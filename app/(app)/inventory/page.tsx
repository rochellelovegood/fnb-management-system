'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface InventoryBatch {
  id: string;
  batch_number: string;
  quantity: number;
  unit_of_measure: string;
  received_date: string;
  expiry_date: string;
  storage_location: string;
  ingredients: { name: string; code: string } | null;
}

export default function InventoryPage() {
  const [batches, setBatches] = useState<InventoryBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const { data } = await supabase
        .from('inventory_batches')
        .select('*, ingredients(name, code)')
        .order('expiry_date', { ascending: true });

      setBatches(data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const isExpiringSoon = (expiryDate: string): boolean => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 14 && daysUntilExpiry >= 0;
  };

  const isExpired = (expiryDate: string): boolean => {
    return new Date(expiryDate) < new Date();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground mt-1">Manage ingredient stock and batches</p>
        </div>
        <Button onClick={() => router.push('/inventory/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Batch
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading inventory...</p>
        </div>
      ) : batches.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">No inventory batches found</p>
          <Button onClick={() => router.push('/inventory/new')}>Add First Batch</Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {batches.map((batch) => (
            <Card
              key={batch.id}
              className={`p-6 hover:bg-muted/50 cursor-pointer transition border-l-4 ${
                isExpired(batch.expiry_date)
                  ? 'border-l-red-500 bg-red-50'
                  : isExpiringSoon(batch.expiry_date)
                  ? 'border-l-yellow-500 bg-yellow-50'
                  : 'border-l-green-500'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-foreground">{batch.ingredients?.name}</h3>
                    {isExpired(batch.expiry_date) && (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    {isExpiringSoon(batch.expiry_date) && !isExpired(batch.expiry_date) && (
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Batch: {batch.batch_number} • Code: {batch.ingredients?.code}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Location: {batch.storage_location}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">
                    {batch.quantity} {batch.unit_of_measure}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Expires: {new Date(batch.expiry_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
