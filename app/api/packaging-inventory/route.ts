import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('packaging_inventory')
      .select(`
        *,
        suppliers:supplier_id (id, name, code),
        packaging_batches (
          id,
          batch_number,
          quantity,
          received_date,
          expiry_date,
          storage_location
        )
      `)
      .order('name');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ packaging: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch packaging inventory' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { data, error } = await supabase
      .from('packaging_inventory')
      .insert([
        {
          code: body.code,
          name: body.name,
          description: body.description,
          packaging_type: body.packaging_type,
          unit_of_measure: body.unit_of_measure,
          supplier_id: body.supplier_id,
          quantity_on_hand: body.quantity_on_hand || 0,
          reorder_point: body.reorder_point,
          unit_cost: body.unit_cost,
        },
      ])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ packaging: data[0] }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create packaging inventory' },
      { status: 500 }
    );
  }
}