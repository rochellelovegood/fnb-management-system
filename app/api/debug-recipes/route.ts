import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    // Test 1: Get all recipes without join
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select('*');
    
    console.log('Raw recipes:', recipes);
    
    // Test 2: Get finished products
    const { data: products, error: productsError } = await supabase
      .from('finished_products')
      .select('*');
    
    console.log('Products:', products);
    
    // Test 3: Check relationship
    const { data: withJoin, error: joinError } = await supabase
      .from('recipes')
      .select(`
        id,
        version,
        finished_product_id,
        finished_products (*)
      `);
    
    console.log('With join:', withJoin);
    
    return NextResponse.json({
      success: true,
      debug: {
        recipesCount: recipes?.length || 0,
        recipes: recipes,
        productsCount: products?.length || 0,
        products: products,
        withJoinCount: withJoin?.length || 0,
        withJoin: withJoin,
        errors: {
          recipes: recipesError?.message,
          products: productsError?.message,
          join: joinError?.message
        }
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ 
      success: false, 
      error: String(error) 
    }, { status: 500 });
  }
}