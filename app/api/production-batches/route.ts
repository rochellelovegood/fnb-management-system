import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase
      .from('production_batches')
      .select('*, finished_products(name, sku)');
    
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('[v0] Production batches GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch production batches' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data, error } = await supabase
      .from('production_batches')
      .insert([body])
      .select();
    
    if (error) throw error;
    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error('[v0] Production batches POST error:', error);
    return NextResponse.json({ error: 'Failed to create production batch' }, { status: 500 });
  }
}
