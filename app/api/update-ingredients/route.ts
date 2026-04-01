import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipeIngredientId, quantityNeeded, wasteageFactor } = body;

    const { data, error } = await supabase
      .from('recipe_ingredients')
      .update({
        quantity_needed: quantityNeeded,
        wastage_factor: wasteageFactor,
      })
      .eq('id', recipeIngredientId)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ingredient: data[0] });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update recipe ingredients' },
      { status: 500 }
    );
  }
}