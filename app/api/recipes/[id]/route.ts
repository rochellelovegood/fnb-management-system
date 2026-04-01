import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Validation Guard: Stop "undefined" or "null" strings before they hit the DB
    if (!id || id === 'undefined' || id === 'null') {
      return NextResponse.json({ 
        success: false, 
        error: 'A valid Recipe ID is required. Received: ' + id 
      }, { status: 400 });
    }

    // 2. Fetch the Recipe with its finished product and ingredients
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .select(`
        *,
        finished_products!inner (
          name
        ),
        recipe_ingredients (
          quantity_needed,
          unit_of_measure,
          wastage_factor,
          ingredients (
            name
          )
        )
      `)
      .eq('id', id)
      .single();

    // 3. Handle specific Recipe not found or UUID syntax errors
    if (recipeError || !recipe) {
      console.error('Supabase Error:', recipeError?.message);
      return NextResponse.json({ 
        success: false, 
        error: 'Recipe not found',
        debug: {
          recipeId: id,
          dbError: recipeError?.message
        }
      }, { status: 404 });
    }

    // 4. Transform to include original data + the SQL-joined structure
    const formattedRecipe = {
      ...recipe,
      // Map recipe_ingredients to 'ingredients' for frontend compatibility
      ingredients: (recipe.recipe_ingredients || []).map((ri: any) => ({
        ...ri,
        ingredient_name: ri.ingredients?.name,
      })),
      // Keep the SQL view as requested
      sql_view: (recipe.recipe_ingredients || []).map((ri: any) => ({
        recipe_id: recipe.id,
        product_name: recipe.finished_products?.name,
        ingredient_name: ri.ingredients?.name,
        quantity_needed: ri.quantity_needed,
        unit_of_measure: ri.unit_of_measure,
        wastage_factor: ri.wastage_factor
      }))
    };

    return NextResponse.json({ 
      success: true, 
      recipe: formattedRecipe
    });

  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal Server Error'
    }, { status: 500 });
  }
}