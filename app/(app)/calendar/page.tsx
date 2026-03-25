'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Calendar, Clock } from 'lucide-react';

interface ProductionBatch {
  id: string;
  batch_number: string;
  finished_product_id: string;
  finished_products: { name: string };
  production_date: string;
  scheduled_start_time?: string;
  scheduled_end_time?: string;
  status: string;
  quantity_produced: number;
}

const STATUS_COLORS: { [key: string]: string } = {
  planned: '#93c5fd',
  in_production: '#fbbf24',
  quality_check: '#a78bfa',
  completed: '#86efac',
  packaged: '#67e8f9',
};

export default function ProductionCalendarPage() {
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<'gantt' | 'calendar'>('gantt');
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchProductionBatches();
  }, []);

  useEffect(() => {
    prepareChartData();
  }, [batches]);

  const fetchProductionBatches = async () => {
    try {
      const { data } = await supabase
        .from('production_batches')
        .select('*, finished_products(name)')
        .gte('production_date', new Date().toISOString().split('T')[0])
        .lte('production_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('production_date', { ascending: true });

      setBatches((data || []) as ProductionBatch[]);
      setLoading(false);
    } catch (error) {
      console.error('[v0] Error fetching batches:', error);
      setLoading(false);
    }
  };

  const prepareChartData = () => {
    const data = batches.map((batch, idx) => ({
      id: batch.batch_number,
      product: batch.finished_products?.name || 'Unknown',
      date: batch.production_date,
      quantity: batch.quantity_produced,
      status: batch.status,
      color: STATUS_COLORS[batch.status] || '#d1d5db',
    }));
    setChartData(data);
  };

  const getWeekNumber = (date: string) => {
    const d = new Date(date);
    const firstDay = new Date(d.getFullYear(), 0, 1);
    const passedDays = Math.floor((d.getTime() - firstDay.getTime()) / (1000 * 60 * 60 * 24));
    return Math.ceil((passedDays + firstDay.getDay()) / 7);
  };

  const groupedByWeek = batches.reduce((acc, batch) => {
    const week = getWeekNumber(batch.production_date);
    if (!acc[week]) {
      acc[week] = [];
    }
    acc[week].push(batch);
    return acc;
  }, {} as { [key: number]: ProductionBatch[] });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Production Calendar</h1>
        <p className="text-gray-600 mt-2">View and manage production batches with Gantt chart and calendar views</p>
      </div>

      {/* View Toggle */}
      <Card className="p-4 flex gap-2">
        <button
          onClick={() => setViewType('gantt')}
          className={`px-4 py-2 rounded-lg font-medium ${
            viewType === 'gantt' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          Gantt Chart
        </button>
        <button
          onClick={() => setViewType('calendar')}
          className={`px-4 py-2 rounded-lg font-medium ${
            viewType === 'calendar' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          Calendar View
        </button>
      </Card>

      {loading ? (
        <Card className="p-6 text-center">
          <p>Loading production schedule...</p>
        </Card>
      ) : viewType === 'gantt' ? (
        /* Gantt Chart View */
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Gantt Chart View (Next 30 Days)</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ top: 5, right: 30, left: 200, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="category" dataKey="date" />
              <YAxis type="category" dataKey="product" width={180} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                }}
              />
              <Bar dataKey="quantity" radius={4}>
                {chartData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-6 flex gap-4 flex-wrap">
            {Object.entries(STATUS_COLORS).map(([status, color]) => (
              <div key={status} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
                <span className="capitalize text-sm">{status}</span>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        /* Calendar Grid View */
        <div className="space-y-4">
          {Object.entries(groupedByWeek)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([week, weekBatches]) => (
              <Card key={week} className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Week {week}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {weekBatches.map((batch) => (
                    <div
                      key={batch.id}
                      className="p-4 rounded-lg border-2"
                      style={{ borderColor: STATUS_COLORS[batch.status] }}
                    >
                      <div className="font-semibold">{batch.finished_products?.name}</div>
                      <div className="text-sm text-gray-600 mt-1">Batch: {batch.batch_number}</div>
                      <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(batch.production_date).toLocaleDateString()}
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm font-medium">{batch.quantity_produced} units</span>
                        <span
                          className="text-xs px-2 py-1 rounded capitalize font-medium text-white"
                          style={{ backgroundColor: STATUS_COLORS[batch.status] }}
                        >
                          {batch.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
        </div>
      )}

      {batches.length === 0 && !loading && (
        <Card className="p-6 text-center text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No production batches scheduled for the next 30 days</p>
        </Card>
      )}
    </div>
  );
}
