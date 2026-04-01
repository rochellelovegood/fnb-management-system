import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ForecastEngine, ForecastInput } from '@/lib/forecasting/forecast-engine';

export async function POST(request: NextRequest) {
  try {
    // IMPORTANT: Await cookies() in Next.js 15
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    
    // Get request body
    const body = await request.json();
    const { productId, confidenceLevel = 90, forecastWeeks = 12 } = body;

    // Validate required fields
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Fetch product details
    const { data: product, error: productError } = await supabase
      .from('finished_products')
      .select('name, sku')
      .eq('id', productId)
      .single();

    if (productError) {
      console.error('Error fetching product:', productError);
    }

    const productName = product?.name || 'Selected Product';

    // Fetch historical sales data
    const { data: salesOrders, error: salesError } = await supabase
      .from('sales_orders')
      .select('quantity, order_date')
      .eq('product_id', productId)
      .order('order_date', { ascending: true })
      .limit(100);

    if (salesError) {
      console.error('Error fetching sales data:', salesError);
    }

    // Fetch production batches
    const { data: productionBatches, error: productionError } = await supabase
      .from('production_batches')
      .select('quantity_produced, production_date')
      .eq('product_id', productId)
      .order('production_date', { ascending: true })
      .limit(50);

    if (productionError) {
      console.error('Error fetching production data:', productionError);
    }

    // Combine historical data
    const historicalDataMap = new Map<string, number>();

    // Add sales data
    salesOrders?.forEach(order => {
      const date = order.order_date.split('T')[0];
      const current = historicalDataMap.get(date) || 0;
      historicalDataMap.set(date, current + order.quantity);
    });

    // Add production data
    productionBatches?.forEach(batch => {
      const date = batch.production_date.split('T')[0];
      const current = historicalDataMap.get(date) || 0;
      historicalDataMap.set(date, current + batch.quantity_produced);
    });

    // Convert to array format
    const historicalData = Array.from(historicalDataMap.entries())
      .map(([date, quantity]) => ({
        date,
        quantity: Math.max(0, quantity),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Prepare input for forecast engine
    const forecastInput: ForecastInput = {
      productId,
      productName,
      historicalData,
      forecastWeeks,
      confidenceLevel,
    };

    // Generate forecast
    const forecastResult = ForecastEngine.generateForecast(forecastInput);

    return NextResponse.json({
      success: true,
      forecast: forecastResult,
      productId,
      productName,
      sku: product?.sku,
      dataPoints: historicalData.length,
      confidenceLevel,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Forecast error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate forecast', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}