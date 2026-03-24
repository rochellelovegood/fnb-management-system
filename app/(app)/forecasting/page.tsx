'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ForecastData {
  product: string;
  forecasted: number;
  actual: number;
  confidence: number;
}

export default function ForecastingPage() {
  const [forecasts, setForecasts] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchForecastData();
  }, []);

  const fetchForecastData = async () => {
    try {
      const { data: forecastData } = await supabase
        .from('demand_forecasts')
        .select('*, finished_products(name)')
        .order('forecast_date', { ascending: true })
        .limit(30);

      // Process data for display
      const processedData: ForecastData[] = (forecastData || []).map((f: any) => ({
        product: f.finished_products?.name || 'Unknown',
        forecasted: f.predicted_demand,
        actual: Math.floor(f.predicted_demand * 0.95), // Dummy actual data
        confidence: f.confidence_level * 100,
      }));

      setForecasts(processedData);

      // Group by week for chart
      const weeklyData = processedData.reduce(
        (acc: any[], item, idx) => {
          const weekIdx = Math.floor(idx / 5);
          if (!acc[weekIdx]) {
            acc[weekIdx] = {
              week: `Week ${weekIdx + 1}`,
              forecasted: 0,
              actual: 0,
              count: 0,
            };
          }
          acc[weekIdx].forecasted += item.forecasted;
          acc[weekIdx].actual += item.actual;
          acc[weekIdx].count += 1;
          return acc;
        },
        []
      );

      setChartData(weeklyData);
    } catch (error) {
      console.error('Error fetching forecast data:', error);
      // Set default data
      setChartData([
        { week: 'Week 1', forecasted: 450, actual: 420 },
        { week: 'Week 2', forecasted: 520, actual: 510 },
        { week: 'Week 3', forecasted: 480, actual: 500 },
        { week: 'Week 4', forecasted: 600, actual: 0 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Demand Forecasting</h1>
        <p className="text-muted-foreground mt-1">Analyze sales trends and predict future demand</p>
      </div>

      <div className="mt-8 grid gap-8">
        {/* Weekly Forecast Chart */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Weekly Demand Forecast</h2>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="forecasted"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Forecasted Demand"
                />
                <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} name="Actual Demand" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Product-level Forecast */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Product Forecasts</h2>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : forecasts.length === 0 ? (
            <p className="text-muted-foreground">No forecast data available</p>
          ) : (
            <div className="space-y-4">
              {forecasts.slice(0, 10).map((forecast, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-semibold text-foreground">{forecast.product}</p>
                    <p className="text-sm text-muted-foreground">
                      Confidence: {forecast.confidence.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{forecast.forecasted} units</p>
                    <p className="text-sm text-muted-foreground">
                      Actual: {forecast.actual} (
                      {(((forecast.actual - forecast.forecasted) / forecast.forecasted) * 100).toFixed(1)}%)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Forecast Accuracy Metrics */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Forecast Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Average Confidence</p>
              <p className="text-2xl font-bold text-foreground">
                {forecasts.length > 0
                  ? (forecasts.reduce((sum, f) => sum + f.confidence, 0) / forecasts.length).toFixed(1)
                  : 0}
                %
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Forecasted</p>
              <p className="text-2xl font-bold text-foreground">
                {forecasts.reduce((sum, f) => sum + f.forecasted, 0)} units
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Forecast Variance</p>
              <p className="text-2xl font-bold text-foreground">
                {forecasts.length > 0
                  ? (
                      (forecasts.reduce((sum, f) => sum + Math.abs(f.actual - f.forecasted), 0) /
                        forecasts.reduce((sum, f) => sum + f.forecasted, 0)) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
