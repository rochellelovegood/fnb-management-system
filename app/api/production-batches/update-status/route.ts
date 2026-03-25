import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { batchId, status, qcNotes } = await request.json();

    if (!batchId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: batchId, status' },
        { status: 400 }
      );
    }

    const validStatuses = ['planned', 'in_production', 'quality_check', 'completed', 'packaged'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (qcNotes) {
      updateData.qc_notes = qcNotes;
    }

    const { data, error } = await supabase
      .from('production_batches')
      .update(updateData)
      .eq('id', batchId)
      .select();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to update batch status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Production batch status updated to ${status}`,
      data: data?.[0],
    });
  } catch (error) {
    console.error('Error updating status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
