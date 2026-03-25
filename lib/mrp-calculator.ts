'use client';

import { supabase } from './supabase';

export interface MRPRequirement {
  ingredient_id: string;
  ingredient_name: string;
  quantity_needed: number;
  unit_type: string;
  wastage_factor: number;
  available_quantity: number;
  purchase_quantity: number;
  supplier_id: string;
  supplier_name: string;
  lead_time_days: number;
}

export interface ProductionPlan {
  product_id: string;
  product_name: string;
  forecast_demand: number;
  current_inventory: number;
  production_quantity: number;
  expiry_date: string;
  requirements: MRPRequirement[];
}

export interface MRPResult {
  production_plans: ProductionPlan[];
  total_purchase_orders: number;
  total_production_batches: number;
  estimated_cost: number;
  timestamp: string;
}

export async function calculateMRP(): Promise<MRPResult> {
  try {
    // Fetch all finished products
    const { data: products, error: productsError } = await supabase
      .from('finished_products')
      .select('*');

    if (productsError) throw productsError;

    const productionPlans: ProductionPlan[] = [];
    let totalPurchaseOrders = 0;
    let totalProductionBatches = 0;
    let totalCost = 0;

    for (const product of products || []) {
      // Get demand forecast
      const { data: forecasts } = await supabase
        .from('demand_forecasts')
        .select('*')
        .eq('finished_product_id', product.id)
        .gte('forecast_date', new Date().toISOString().split('T')[0])
        .order('forecast_date', { ascending: true })
        .limit(1);

      const forecastDemand = forecasts?.[0]?.predicted_demand || 0;

      // Get current inventory
      const { data: inventory } = await supabase
        .from('inventory_batches')
        .select('*')
        .eq('ingredient_id', product.id)
        .gte('expiry_date', new Date().toISOString().split('T')[0]);

      const currentInventory = inventory?.reduce((sum, batch) => sum + batch.quantity, 0) || 0;

      // Calculate production needed
      const safetyStock = (forecastDemand / 14) * 7; // 7-day lead time buffer
      const productionQty = Math.max(0, forecastDemand + safetyStock - currentInventory);

      if (productionQty === 0) continue;

      // Get recipe and calculate material requirements
      const { data: recipes } = await supabase
        .from('recipes')
        .select('*')
        .eq('finished_product_id', product.id)
        .order('version', { ascending: false })
        .limit(1);

      const recipe = recipes?.[0];
      if (!recipe) continue;

      // Get recipe ingredients
      const { data: recipeIngredients } = await supabase
        .from('recipe_ingredients')
        .select(
          `*,
          ingredients:ingredient_id(id, name, shelf_life_days),
          ingredient_costs(unit_cost, suppliers(id, name, lead_time_days))`
        )
        .eq('recipe_id', recipe.id);

      const requirements: MRPRequirement[] = [];

      for (const recipeIngredient of recipeIngredients || []) {
        // Calculate total material needed with wastage
        const materialNeeded = productionQty * 
          recipeIngredient.quantity_needed * 
          recipeIngredient.wastage_factor;

        // Check available inventory
        const { data: ingredientInventory } = await supabase
          .from('inventory_batches')
          .select('*')
          .eq('ingredient_id', recipeIngredient.ingredient_id)
          .gte('expiry_date', new Date().toISOString().split('T')[0]);

        const availableQty = ingredientInventory?.reduce((sum, batch) => sum + batch.quantity, 0) || 0;
        const purchaseQty = Math.max(0, materialNeeded - availableQty) * 1.1; // 10% buffer

        if (purchaseQty > 0) {
          const cost = purchaseQty * (recipeIngredient.ingredient_costs?.[0]?.unit_cost || 0);
          totalCost += cost;
          totalPurchaseOrders++;

          requirements.push({
            ingredient_id: recipeIngredient.ingredient_id,
            ingredient_name: recipeIngredient.ingredients?.name || 'Unknown',
            quantity_needed: materialNeeded,
            unit_type: recipeIngredient.unit_of_measure,
            wastage_factor: recipeIngredient.wastage_factor,
            available_quantity: availableQty,
            purchase_quantity: purchaseQty,
            supplier_id: recipeIngredient.ingredient_costs?.[0]?.suppliers?.id || '',
            supplier_name: recipeIngredient.ingredient_costs?.[0]?.suppliers?.name || 'Unknown',
            lead_time_days: recipeIngredient.ingredient_costs?.[0]?.suppliers?.lead_time_days || 0,
          });
        }
      }

      // Calculate expiry date
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + (product.shelf_life_days || 14));

      productionPlans.push({
        product_id: product.id,
        product_name: product.name,
        forecast_demand: forecastDemand,
        current_inventory: currentInventory,
        production_quantity: productionQty,
        expiry_date: expiryDate.toISOString().split('T')[0],
        requirements,
      });

      totalProductionBatches++;
    }

    return {
      production_plans: productionPlans,
      total_purchase_orders: totalPurchaseOrders,
      total_production_batches: totalProductionBatches,
      estimated_cost: Math.round(totalCost * 100) / 100,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[v0] MRP calculation error:', error);
    throw error;
  }
}

export async function executeMRPPlan(mrpResult: MRPResult): Promise<boolean> {
  try {
    const { data: user } = await supabase.auth.getUser();

    // Log the MRP run
    const { data: mprRun, error: logError } = await supabase
      .from('mrp_runs')
      .insert({
        trigger_type: 'manual',
        status: 'executed',
        generated_production_qty: mrpResult.production_plans,
        generated_purchase_orders: mrpResult.production_plans.flatMap(p => p.requirements),
        notes: `MRP executed at ${new Date().toISOString()}`,
        created_by: user?.user?.id,
      })
      .select();

    if (logError) throw logError;

    // Create production batches
    for (const plan of mrpResult.production_plans) {
      const batchNumber = `PB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const { error: batchError } = await supabase
        .from('production_batches')
        .insert({
          finished_product_id: plan.product_id,
          batch_number: batchNumber,
          recipe_version: 1,
          quantity_produced: plan.production_quantity,
          production_date: new Date().toISOString().split('T')[0],
          expiry_date: plan.expiry_date,
          status: 'planned',
        });

      if (batchError) console.error('[v0] Error creating batch:', batchError);
    }

    // Create purchase orders (simplified - in real system would integrate with procurement)
    for (const plan of mrpResult.production_plans) {
      for (const req of plan.requirements) {
        const poNumber = `PO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        // Insert purchase order logic here if you have a purchase_orders table
      }
    }

    return true;
  } catch (error) {
    console.error('[v0] MRP execution error:', error);
    return false;
  }
}
