import { NextRequest, NextResponse } from 'next/server';
import { executeMRPPlan, calculateMRP } from '@/lib/mrp-calculator';

export async function POST(request: NextRequest) {
  try {
    // Get the MRP plan to execute
    const mrpResult = await calculateMRP();
    
    // Execute the plan
    const success = await executeMRPPlan(mrpResult);
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'MRP plan executed successfully',
        summary: {
          productionBatches: mrpResult.total_production_batches,
          purchaseOrders: mrpResult.total_purchase_orders,
          estimatedCost: mrpResult.estimated_cost,
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to execute MRP plan' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[v0] MRP execution error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
