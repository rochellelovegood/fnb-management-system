import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { forecastDemandWithAI, generateSmartRecommendations } from '@/lib/gemini-client';

export async function POST(request: NextRequest) {
  try {
    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Fetch product details
    const { data: product, error: productError } = await supabase
      .from('finished_products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Fetch 12 weeks of historical sales data
    const { data: historicalSales, error: salesError } = await supabase
      .from('sales_orders')
      .select('order_date, quantity')
      .eq('finished_product_id', productId)
      .gte('order_date', new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('order_date', { ascending: true });

    if (salesError) throw salesError;

    // Get current inventory
    const { data: inventory } = await supabase
      .from('inventory_batches')
      .select('quantity')
      .eq('ingredient_id', productId)
      .gte('expiry_date', new Date().toISOString().split('T')[0]);

    const currentInventory = inventory?.reduce((sum, b) => sum + b.quantity, 0) || 0;

    // Get seasonal factor if exists
    const { data: seasonalFactors } = await supabase
      .from('seasonal_factors')
      .select('multiplier')
      .eq('finished_product_id', productId);

    const seasonalFactor = seasonalFactors?.[0]?.multiplier || 1.0;

    // Call AI forecasting
    const forecast = await forecastDemandWithAI(
      product.name,
      historicalSales?.map(s => ({ date: s.order_date, quantity: s.quantity })) || [],
      product.shelf_life_days || 14,
      currentInventory,
      seasonalFactor
    );

    if (!forecast) {
      return NextResponse.json(
        { error: 'Gemini API not configured or failed' },
        { status: 500 }
      );
    }

    // Generate recommendations
    const recommendations = await generateSmartRecommendations(
      product.name,
      forecast,
      currentInventory,
      product.shelf_life_days || 14,
      7 // default supplier lead time
    );

    // Cache forecast in database
    await supabase
      .from('ai_forecasts')
      .upsert({
        finished_product_id: productId,
        forecast_date: new Date().toISOString().split('T')[0],
        predicted_demand: forecast.predicted_demand,
        confidence_level: forecast.confidence,
        reasoning: forecast.reasoning,
      });

    return NextResponse.json({
      forecast,
      recommendations,
      product: {
        id: product.id,
        name: product.name,
        currentInventory,
        shelfLife: product.shelf_life_days,
      },
    });
  } catch (error) {
    console.error('[v0] Forecast API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
