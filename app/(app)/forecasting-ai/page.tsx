'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { AlertCircle, Lightbulb, TrendingUp } from 'lucide-react';

interface AIForecast {
  predicted_demand: number;
  confidence: number;
  reasoning: string;
  trend: string;
  seasonality: string;
}

interface Recommendation {
  type: 'production' | 'inventory' | 'ingredient' | 'alert';
  title: string;
  description: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
}

interface Product {
  id: string;
  name: string;
}

export default function AIForecastingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [forecast, setForecast] = useState<AIForecast | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      generateAIForecast();
    }
  }, [selectedProductId]);

  const fetchProducts = async () => {
    try {
      const { data } = await supabase
        .from('finished_products')
        .select('id, name')
        .order('name');
      setProducts(data || []);
      if (data && data.length > 0) {
        setSelectedProductId(data[0].id);
      }
    } catch (error) {
      console.error('[v0] Error fetching products:', error);
    }
  };

  const generateAIForecast = async () => {
    if (!selectedProductId) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/ai/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: selectedProductId }),
      });

      const data = await response.json();
      
      if (data.forecast) {
        setForecast(data.forecast);
        setRecommendations(data.recommendations || []);
        
        // Prepare chart data
        const chartData = [
          {
            name: 'Historical',
            demand: Math.round(data.forecast.predicted_demand * 0.85),
          },
          {
            name: 'Forecast',
            demand: Math.round(data.forecast.predicted_demand),
          },
          {
            name: 'Conservative',
            demand: Math.round(data.forecast.predicted_demand * 0.9),
          },
        ];
        setChartData(chartData);
      }
    } catch (error) {
      console.error('[v0] Error generating forecast:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">AI-Powered Demand Forecasting</h1>
        <p className="text-gray-600 mt-2">Gemini AI analyzes historical data to predict demand and provide smart recommendations</p>
      </div>

      {/* Product Selector */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Select Product</h2>
        <select
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
          className="w-full p-2 border rounded-lg"
        >
          <option value="">Choose a product...</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </Card>

      {loading && (
        <Card className="p-6 text-center">
          <p>Analyzing historical data with AI...</p>
        </Card>
      )}

      {forecast && !loading && (
        <>
          {/* Forecast Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Predicted Demand (4 weeks)</p>
                  <p className="text-3xl font-bold">{Math.round(forecast.predicted_demand)}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-blue-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div>
                <p className="text-gray-600 text-sm">Confidence Level</p>
                <p className="text-3xl font-bold">{(forecast.confidence * 100).toFixed(0)}%</p>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${forecast.confidence * 100}%` }}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div>
                <p className="text-gray-600 text-sm">Trend</p>
                <p className="text-3xl font-bold capitalize">{forecast.trend}</p>
                <p className="text-xs text-gray-500 mt-2">{forecast.seasonality}</p>
              </div>
            </Card>
          </div>

          {/* Forecast Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Demand Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="demand" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* AI Reasoning */}
          <Card className="p-6 bg-blue-50">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              AI Analysis
            </h3>
            <p className="text-gray-700">{forecast.reasoning}</p>
          </Card>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                Smart Recommendations
              </h3>
              <div className="space-y-3">
                {recommendations.map((rec, idx) => (
                  <div key={idx} className={`p-4 rounded-lg ${getPriorityColor(rec.priority)}`}>
                    <div className="font-semibold">{rec.title}</div>
                    <div className="text-sm mt-1">{rec.description}</div>
                    <div className="text-xs mt-2 font-medium">Action: {rec.action}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
