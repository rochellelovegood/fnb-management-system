import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') || 'ingredient';

    if (category === 'packaging') {
      // Fetch packaging inventory
      const { data, error } = await supabase
        .from('packaging_inventory')
        .select(`
          *,
          suppliers:supplier_id (name, code),
          packaging_batches (*)
        `)
        .order('name');

      if (error) {
        console.error('Packaging fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ inventory: data, category: 'packaging' });
    } else if (category === 'finished_good') {
      // Fetch finished products
      const { data, error } = await supabase
        .from('finished_products')
        .select(`
          *,
          production_batches (*)
        `)
        .order('name');

      if (error) {
        console.error('Finished goods fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ inventory: data, category: 'finished_good' });
    } else {
      // Fetch ingredient inventory - WITHOUT suppliers join since it doesn't exist
      const { data, error } = await supabase
        .from('ingredients')
        .select(`
          *,
          inventory_batches (*)
        `)
        .eq('category', 'ingredient')
        .order('name');

      if (error) {
        console.error('Ingredients fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      console.log('Fetched ingredients count:', data?.length || 0);
      return NextResponse.json({ inventory: data, category: 'ingredient' });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory by category' },
      { status: 500 }
    );
  }
}