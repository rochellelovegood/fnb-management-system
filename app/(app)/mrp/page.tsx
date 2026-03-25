'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { AlertCircle, CheckCircle, Package, ShoppingCart, TrendingUp } from 'lucide-react';

interface MRPResult {
  production_plans: Array<{
    product_id: string;
    product_name: string;
    forecast_demand: number;
    current_inventory: number;
    production_quantity: number;
    expiry_date: string;
    requirements: Array<{
      ingredient_name: string;
      quantity_needed: number;
      purchase_quantity: number;
      supplier_name: string;
    }>;
  }>;
  total_purchase_orders: number;
  total_production_batches: number;
  estimated_cost: number;
  timestamp: string;
}

export default function MRPPage() {
  const [mrpResult, setMrpResult] = useState<MRPResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);

  const calculateMRP = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/mrp/calculate');
      const data: MRPResult = await response.json();
      setMrpResult(data);

      // Prepare chart data
      const chartData = data.production_plans.map((plan) => ({
        product: plan.product_name,
        forecast: plan.forecast_demand,
        current: plan.current_inventory,
        production: plan.production_quantity,
      }));
      setChartData(chartData);
    } catch (error) {
      console.error('[v0] MRP calculation error:', error);
      alert('Failed to calculate MRP');
    } finally {
      setLoading(false);
    }
  };

  const executeMRP = async () => {
    if (!confirm('Execute MRP plan and create production batches?')) return;

    setLoading(true);
    try {
      const response = await fetch('/api/mrp/execute', { method: 'POST' });
      const result = await response.json();

      if (result.success) {
        alert('MRP plan executed successfully!');
        setMrpResult(null);
        setChartData([]);
      } else {
        alert('Failed to execute MRP plan');
      }
    } catch (error) {
      console.error('[v0] Execution error:', error);
      alert('Error executing MRP plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">MRP Calculation</h1>
        <p className="text-gray-600 mt-2">Material Requirements Planning with demand forecasting and inventory optimization</p>
      </div>

      {/* Action Buttons */}
      <Card className="p-6">
        <div className="flex gap-4">
          <Button
            onClick={calculateMRP}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium"
          >
            {loading ? 'Calculating...' : 'Calculate MRP'}
          </Button>
          {mrpResult && (
            <Button
              onClick={executeMRP}
              disabled={loading}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium"
            >
              {loading ? 'Executing...' : 'Execute Plan'}
            </Button>
          )}
        </div>
      </Card>

      {mrpResult && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Production Batches</p>
                  <p className="text-3xl font-bold">{mrpResult.total_production_batches}</p>
                </div>
                <Package className="w-12 h-12 text-blue-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Purchase Orders</p>
                  <p className="text-3xl font-bold">{mrpResult.total_purchase_orders}</p>
                </div>
                <ShoppingCart className="w-12 h-12 text-green-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Estimated Cost</p>
                  <p className="text-3xl font-bold">${mrpResult.estimated_cost.toFixed(2)}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-orange-500" />
              </div>
            </Card>
          </div>

          {/* Production Plans Chart */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Production Plans</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="product" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="forecast" fill="#3b82f6" name="Forecast Demand" />
                <Bar dataKey="current" fill="#10b981" name="Current Inventory" />
                <Bar dataKey="production" fill="#f59e0b" name="To Produce" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Detailed Plans */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Production & Material Requirements</h2>
            <div className="space-y-6">
              {mrpResult.production_plans.map((plan) => (
                <div key={plan.product_id} className="border-l-4 border-blue-500 pl-4 pb-4 border-b">
                  <h3 className="font-semibold text-lg">{plan.product_name}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                    <div>
                      <p className="text-gray-600">Forecast Demand</p>
                      <p className="font-bold">{plan.forecast_demand}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Current Stock</p>
                      <p className="font-bold">{plan.current_inventory}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">To Produce</p>
                      <p className="font-bold text-blue-600">{plan.production_quantity}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Expiry Date</p>
                      <p className="font-bold">{new Date(plan.expiry_date).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Material Requirements */}
                  {plan.requirements.length > 0 && (
                    <div className="mt-4 bg-gray-50 rounded-lg p-4">
                      <p className="font-semibold text-sm mb-3">Material Requirements</p>
                      <table className="w-full text-sm">
                        <thead className="border-b">
                          <tr>
                            <th className="text-left">Ingredient</th>
                            <th className="text-right">Needed</th>
                            <th className="text-right">To Order</th>
                            <th className="text-left">Supplier</th>
                          </tr>
                        </thead>
                        <tbody>
                          {plan.requirements.map((req, idx) => (
                            <tr key={idx} className="border-b last:border-0">
                              <td>{req.ingredient_name}</td>
                              <td className="text-right">{req.quantity_needed.toFixed(2)}</td>
                              <td className="text-right font-semibold text-orange-600">
                                {req.purchase_quantity.toFixed(2)}
                              </td>
                              <td>{req.supplier_name}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {!mrpResult && !loading && (
        <Card className="p-12 text-center text-gray-500">
          <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg">Click "Calculate MRP" to analyze demand, inventory, and generate production plans</p>
        </Card>
      )}
    </div>
  );
}
