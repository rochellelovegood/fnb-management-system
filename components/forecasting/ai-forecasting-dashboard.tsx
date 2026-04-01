'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  AlertCircle,
  Brain,
  BarChart3,
  ChevronRight,
  Activity,
  Package,
  Clock,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
  ReferenceLine,
} from 'recharts';
import { ForecastEngine, ForecastResult } from '../../lib/forecasting/forecast-engine';
import { supabase } from '@/lib/supabase';

interface Product {
  id: string;
  name: string;
  sku: string;
}

export function AIForecastingDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [forecastResult, setForecastResult] = useState<ForecastResult | null>(null);
  const [confidenceLevel, setConfidenceLevel] = useState(90);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('finished_products')
        .select('id, name, sku')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchHistoricalData = async (productId: string) => {
    try {
      // Fetch production batches for this product
      const { data: batches, error: batchesError } = await supabase
        .from('production_batches')
        .select('quantity_produced, production_date')
        .eq('product_id', productId)
        .order('production_date', { ascending: true })
        .limit(52); // Last 52 weeks

      if (batchesError) throw batchesError;

      // Fetch sales orders for this product
      const { data: sales, error: salesError } = await supabase
        .from('sales_orders')
        .select('quantity, order_date')
        .eq('product_id', productId)
        .order('order_date', { ascending: true })
        .limit(52);

      if (salesError) throw salesError;

      // Combine and aggregate data
      const combinedData = new Map<string, number>();

      // Add production data
      batches?.forEach(batch => {
        const date = batch.production_date.split('T')[0];
        const current = combinedData.get(date) || 0;
        combinedData.set(date, current + batch.quantity_produced);
      });

      // Add sales data (as negative to show consumption)
      sales?.forEach(sale => {
        const date = sale.order_date.split('T')[0];
        const current = combinedData.get(date) || 0;
        combinedData.set(date, current - sale.quantity);
      });

      // Convert to array format
      const history = Array.from(combinedData.entries())
        .map(([date, quantity]) => ({
          date,
          quantity: Math.max(0, quantity), // Net production
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setHistoricalData(history);
      return history;
    } catch (error) {
      console.error('Error fetching historical data:', error);
      return [];
    }
  };

  const handleProductSelect = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setSelectedProduct(product);
    setLoading(true);

    const history = await fetchHistoricalData(productId);
    
    // Generate forecast using statistical engine
    setTimeout(() => {
      const forecast = ForecastEngine.generateForecast({
        productId: product.id,
        productName: product.name,
        historicalData: history,
        forecastWeeks: 12,
        confidenceLevel,
      });
      
      setForecastResult(forecast);
      setLoading(false);
    }, 500);
  };

  const regenerateForecast = () => {
    if (!selectedProduct || historicalData.length === 0) return;
    
    setLoading(true);
    setTimeout(() => {
      const forecast = ForecastEngine.generateForecast({
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        historicalData,
        forecastWeeks: 12,
        confidenceLevel,
      });
      setForecastResult(forecast);
      setLoading(false);
    }, 300);
  };

  const getTrendIcon = () => {
    if (!forecastResult) return null;
    switch (forecastResult.trend) {
      case 'Increasing':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'Decreasing':
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      default:
        return <Minus className="h-5 w-5 text-yellow-500" />;
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  if (loadingProducts) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Forecasting</h1>
          <p className="text-muted-foreground mt-1">
            Select a product to analyze historical sales data and predict future demand using statistical forecasting
          </p>
        </div>
        <Brain className="h-12 w-12 text-primary opacity-50" />
      </div>

      {/* Controls */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="flex-1 w-full">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Select Product
            </label>
            <Select onValueChange={handleProductSelect} value={selectedProduct?.id}>
              <SelectTrigger className="w-full md:w-96">
                <SelectValue placeholder="Choose a product..." />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} ({product.sku})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-auto">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Confidence Level
            </label>
            <div className="flex items-center gap-4">
              <Slider
                value={[confidenceLevel]}
                onValueChange={(value) => setConfidenceLevel(value[0])}
                min={50}
                max={99}
                step={1}
                className="w-48"
              />
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {confidenceLevel}%
              </Badge>
            </div>
          </div>

          <Button
            onClick={regenerateForecast}
            disabled={!selectedProduct || loading}
            className="bg-gradient-to-r from-primary to-primary/80"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Generate Forecast
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Results */}
      {forecastResult && (
        <div className="space-y-6">
          {/* Product Header with Metrics */}
          <Card className="p-6 bg-gradient-to-r from-primary/5 via-primary/5 to-transparent">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold">{forecastResult.productName}</h2>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-sm text-muted-foreground">Statistical Demand Forecast</p>
                  <Badge variant="outline" className="text-xs">
                    MAPE: {forecastResult.metrics.meanAbsolutePercentageError}%
                  </Badge>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Confidence Level</p>
                  <p className="text-2xl font-bold text-primary">{forecastResult.confidenceLevel}%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Trend</p>
                  <div className="flex items-center gap-1">
                    {getTrendIcon()}
                    <p className="text-2xl font-bold">{forecastResult.trend}</p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Change</p>
                  <p className={`text-2xl font-bold ${forecastResult.trend === 'Increasing' ? 'text-green-500' : forecastResult.trend === 'Decreasing' ? 'text-red-500' : 'text-yellow-500'}`}>
                    {forecastResult.trend === 'Increasing' ? '+' : ''}{forecastResult.trendPercentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Forecast Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Weekly Forecast Breakdown
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Predicted units by week for {forecastResult.productName}
            </p>

            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={forecastResult.forecast}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis 
                    dataKey="week" 
                    label={{ value: 'Week', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    label={{ value: 'Units', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [formatNumber(value), 'Units']}
                    labelFormatter={(label) => `Week ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="upperBound"
                    stroke="none"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.1}
                  />
                  <Area
                    type="monotone"
                    dataKey="lowerBound"
                    stroke="none"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.1}
                  />
                  <Line
                    type="monotone"
                    dataKey="predictedDemand"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                    name="Predicted Demand"
                  />
                  <ReferenceLine y={0} stroke="hsl(var(--border))" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Seasonality Analysis */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Seasonality Analysis
              </h3>
              <div className="space-y-4">
                <div>
                  <Badge variant="outline" className="mb-2 bg-primary/10">
                    Seasonal Pattern Detected
                  </Badge>
                  <p className="text-foreground font-medium">
                    {forecastResult.seasonalPattern}
                  </p>
                </div>
                {forecastResult.peakPeriods.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Peak Periods</p>
                    <div className="flex flex-wrap gap-2">
                      {forecastResult.peakPeriods.map((period, i) => (
                        <Badge key={i} variant="secondary">
                          {period}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="pt-2">
                  <p className="text-sm text-muted-foreground">
                    Forecast Accuracy: R² = {forecastResult.metrics.rSquared}
                  </p>
                </div>
              </div>
            </Card>

            {/* Key Insights */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Key Insights
              </h3>
              <ul className="space-y-3">
                {forecastResult.keyInsights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Production Recommendations */}
          <Card className="p-6 bg-gradient-to-r from-primary/5 to-primary/10">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Production Recommendations
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              {forecastResult.recommendations.map((rec, i) => (
                <div key={i} className="bg-background/50 rounded-lg p-4 border border-border">
                  <p className="text-sm font-medium leading-relaxed">{rec}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Forecast Summary Table */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Detailed Forecast
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Week</th>
                    <th className="text-left py-3 px-2">Start Date</th>
                    <th className="text-right py-3 px-2">Predicted Demand</th>
                    <th className="text-right py-3 px-2">Lower Bound</th>
                    <th className="text-right py-3 px-2">Upper Bound</th>
                    <th className="text-right py-3 px-2">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {forecastResult.forecast.slice(0, 8).map((week) => (
                    <tr key={week.week} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-2 font-medium">{week.week}</td>
                      <td className="py-2 px-2 text-muted-foreground">{week.startDate}</td>
                      <td className="py-2 px-2 text-right font-semibold">{formatNumber(week.predictedDemand)}</td>
                      <td className="py-2 px-2 text-right text-muted-foreground">{formatNumber(week.lowerBound)}</td>
                      <td className="py-2 px-2 text-right text-muted-foreground">{formatNumber(week.upperBound)}</td>
                      <td className="py-2 px-2 text-right">{week.confidence}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {!forecastResult && !loading && selectedProduct === null && (
        <Card className="p-12 text-center">
          <Brain className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Ready to Forecast</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Select a product from the dropdown above to generate a statistical demand forecast based on historical data
          </p>
        </Card>
      )}

      {loading && (
        <Card className="p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Analyzing historical data and generating forecast...</p>
        </Card>
      )}
    </div>
  );
}