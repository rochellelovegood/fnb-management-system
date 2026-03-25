import { NextRequest, NextResponse } from 'next/server';
import { calculateMRP } from '@/lib/mrp-calculator';

export async function GET(request: NextRequest) {
  try {
    const mrpResult = await calculateMRP();
    return NextResponse.json(mrpResult);
  } catch (error) {
    console.error('[v0] MRP calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate MRP' },
      { status: 500 }
    );
  }
}
