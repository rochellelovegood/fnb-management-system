import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        id,
        version,
        yield,
        production_time_minutes,
        instructions,
        finished_products!finished_product_id (
          name,
          sku,
          yield_per_batch,
          shelf_life_days
        )
      `);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    console.log('Found recipes:', data?.length);

    return NextResponse.json({ 
      success: true, 
      recipes: data || [] 
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch recipes' 
    }, { status: 500 });
  }
}