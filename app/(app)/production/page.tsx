'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProductionBatch {
  id: string;
  batch_number: string;
  quantity_produced: number;
  actual_yield: number | null;
  production_date: string;
  expiry_date: string;
  status: string;
  finished_products: { name: string; sku: string } | null;
}

export default function ProductionPage() {
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchProductionBatches();
  }, []);

  const fetchProductionBatches = async () => {
    try {
      const { data } = await supabase
        .from('production_batches')
        .select('*, finished_products(name, sku)')
        .order('production_date', { ascending: false });

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
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Production</h1>
          <p className="text-muted-foreground mt-1">Schedule and track production batches</p>
        </div>
        <Button onClick={() => router.push('/production/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Batch
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading production batches...</p>
        </div>
      ) : batches.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">No production batches scheduled</p>
          <Button onClick={() => router.push('/production/new')}>Schedule First Batch</Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {batches.map((batch) => (
            <Card key={batch.id} className="p-6 hover:bg-muted/50 cursor-pointer transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{batch.finished_products?.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Batch: {batch.batch_number} • SKU: {batch.finished_products?.sku}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Produced: {new Date(batch.production_date).toLocaleDateString()} • Expires:{' '}
                    {new Date(batch.expiry_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">{batch.quantity_produced} units</p>
                  <p className="text-sm text-muted-foreground">Yield: {batch.actual_yield || 'Pending'}</p>
                  <span
                    className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                      statusColors[batch.status] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {batch.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
