'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Package,
  Clock,
  Loader2,
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
} from 'recharts';
import { supabase } from '@/lib/supabase';

interface Product {
  id: string;
  name: string;
  sku: string;
}

interface ForecastData {
  productId: string;
  productName: string;
  forecast: WeeklyForecast[];
  confidenceLevel: number;
  trend: 'Increasing' | 'Decreasing' | 'Stable';
  trendPercentage: number;
  seasonalPattern: string;
  peakPeriods: string[];
  keyInsights: string[];
  recommendations: string[];
  metrics: {
    meanAbsoluteError: number;
    meanAbsolutePercentageError: number;
    rSquared: number;
  };
}

interface WeeklyForecast {
  week: number;
  startDate: string;
  predictedDemand: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
}

export default function AIForecastingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [confidenceLevel, setConfidenceLevel] = useState(90);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  };

  const generateForecast = async () => {
    if (!selectedProduct) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct,
          confidenceLevel,
          forecastWeeks: 12,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate forecast');
      }

      setForecast(data.forecast);
    } catch (err) {
      console.error('Forecast error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate forecast');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number | undefined | null): string => {
    if (num === undefined || num === null || isNaN(num)) {
      return '0';
    }
    return Math.round(num).toLocaleString();
  };

  const formatPercentage = (num: number | undefined | null): string => {
    if (num === undefined || num === null || isNaN(num)) {
      return '0';
    }
    return num.toFixed(1);
  };

  const getTrendIcon = () => {
    if (!forecast) return null;
    switch (forecast.trend) {
      case 'Increasing':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'Decreasing':
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      default:
        return <Minus className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getAverageDemand = () => {
    if (!forecast?.forecast?.length) return 0;
    const sum = forecast.forecast.reduce((acc, week) => acc + (week.predictedDemand || 0), 0);
    return Math.round(sum / forecast.forecast.length);
  };

  if (loadingProducts) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            Select a product to analyze historical sales data and predict future demand
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
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
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
              <span className="text-sm font-medium w-12">{confidenceLevel}%</span>
            </div>
          </div>

          <Button
            onClick={generateForecast}
            disabled={!selectedProduct || loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
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

      {/* Error State */}
      {error && (
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </Card>
      )}

      {/* Forecast Results */}
      {forecast && !loading && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Product</p>
                  <p className="font-semibold truncate max-w-[150px]">{forecast.productName}</p>
                </div>
                <Package className="w-8 h-8 text-blue-500" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Average Demand (Weekly)</p>
                  <p className="text-2xl font-bold">{formatNumber(getAverageDemand())}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Trend</p>
                  <div className="flex items-center gap-1">
                    {getTrendIcon()}
                    <p className="text-xl font-bold">{forecast.trend}</p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatPercentage(forecast.trendPercentage)}%
                </span>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Confidence</p>
                  <p className="text-2xl font-bold">{forecast.confidenceLevel}%</p>
                </div>
                <Brain className="w-8 h-8 text-purple-500" />
              </div>
            </Card>
          </div>

          {/* Forecast Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Weekly Forecast Breakdown
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Predicted units by week for {forecast.productName}
            </p>

            {forecast.forecast && forecast.forecast.length > 0 ? (
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={forecast.forecast}>
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
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No forecast data available
              </div>
            )}
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
                  <p className="text-sm text-muted-foreground mb-2">Pattern</p>
                  <p className="text-foreground font-medium">{forecast.seasonalPattern || 'No significant patterns detected'}</p>
                </div>
                {forecast.peakPeriods && forecast.peakPeriods.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Peak Periods</p>
                    <div className="flex flex-wrap gap-2">
                      {forecast.peakPeriods.map((period, i) => (
                        <span key={i} className="px-2 py-1 bg-primary/10 rounded-full text-sm">
                          {period}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Forecast Accuracy</p>
                  <p className="text-sm font-mono">MAPE: {formatPercentage(forecast.metrics?.meanAbsolutePercentageError)}%</p>
                  <p className="text-sm font-mono">R²: {formatPercentage(forecast.metrics?.rSquared)}</p>
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
                {forecast.keyInsights && forecast.keyInsights.length > 0 ? (
                  forecast.keyInsights.map((insight, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{insight}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-muted-foreground">No insights available</li>
                )}
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
              {forecast.recommendations && forecast.recommendations.length > 0 ? (
                forecast.recommendations.map((rec, i) => (
                  <div key={i} className="bg-background/50 rounded-lg p-4 border border-border">
                    <p className="text-sm font-medium leading-relaxed">{rec}</p>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center text-muted-foreground">
                  No recommendations available
                </div>
              )}
            </div>
          </Card>

          {/* Detailed Forecast Table */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Detailed Forecast (12 Weeks)
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
                  {forecast.forecast && forecast.forecast.length > 0 ? (
                    forecast.forecast.map((week) => (
                      <tr key={week.week} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-2 font-medium">{week.week}</td>
                        <td className="py-2 px-2 text-muted-foreground">{week.startDate}</td>
                        <td className="py-2 px-2 text-right font-semibold">
                          {formatNumber(week.predictedDemand)}
                        </td>
                        <td className="py-2 px-2 text-right text-muted-foreground">
                          {formatNumber(week.lowerBound)}
                        </td>
                        <td className="py-2 px-2 text-right text-muted-foreground">
                          {formatNumber(week.upperBound)}
                        </td>
                        <td className="py-2 px-2 text-right">{week.confidence}%</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-muted-foreground">
                        No forecast data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {!forecast && !loading && !error && selectedProduct && (
        <Card className="p-12 text-center">
          <Brain className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Ready to Generate Forecast</h3>
          <p className="text-muted-foreground">
            Click the "Generate Forecast" button to analyze demand patterns
          </p>
        </Card>
      )}

      {!forecast && !loading && !selectedProduct && !error && (
        <Card className="p-12 text-center">
          <Brain className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Ready to Forecast</h3>
          <p className="text-muted-foreground">
            Select a product from the dropdown above to generate a demand forecast
          </p>
        </Card>
      )}
    </div>
  );
}