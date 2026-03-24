'use client';

import { Card } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ProductionBatch {
  id: string;
  batch_number: string;
  status: string;
  production_date: string;
  quantity_produced: number;
}

export default function ProductionSchedule() {
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductionBatches();
  }, []);

  const fetchProductionBatches = async () => {
    try {
      const { data } = await supabase
        .from('production_batches')
        .select('id, batch_number, status, production_date, quantity_produced')
        .order('production_date', { ascending: true })
        .limit(5);

      setBatches(data || []);
    } catch (error) {
      console.error('Error fetching production batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    planned: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    quality_check: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    packaged: 'bg-gray-100 text-gray-800',
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold text-foreground mb-4">Upcoming Production</h2>
      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : batches.length === 0 ? (
        <p className="text-muted-foreground">No production batches scheduled</p>
      ) : (
        <div className="space-y-3">
          {batches.map((batch) => (
            <div
              key={batch.id}
              className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition"
            >
              <div>
                <p className="font-semibold text-foreground">{batch.batch_number}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(batch.production_date).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Qty: {batch.quantity_produced}</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    statusColors[batch.status] || 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {batch.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
