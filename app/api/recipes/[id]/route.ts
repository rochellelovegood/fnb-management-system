import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // 1. Validation Guard: Stop "undefined" or "null" strings before they hit the DB
    if (!id || id === 'undefined' || id === 'null') {
      return NextResponse.json({ 
        success: false, 
        error: 'A valid Recipe ID is required. Received: ' + id 
      }, { status: 400 });
    }

    // 2. Fetch the Recipe and join the finished_product in one go (Optional but faster)
    // If your foreign keys are set up in Supabase, you can do this:
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .select(`
        *,
        finished_products (*)
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

    // 4. Return the successful response
    return NextResponse.json({ 
      success: true, 
      recipe: recipe
    });

  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal Server Error'
    }, { status: 500 });
  }
}