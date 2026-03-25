'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

interface FinishedProduct {
  id: string;
  name: string;
  sku: string;
  shelf_life_days: number;
}

export default function NewProductionBatchPage() {
  const router = useRouter();
  const [products, setProducts] = useState<FinishedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    finished_product_id: '',
    batch_number: '',
    quantity_produced: '',
    actual_yield: '',
    production_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    status: 'planned',
    qc_notes: '',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await supabase.from('finished_products').select('id, name, sku, shelf_life_days');
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleProductChange = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product && formData.production_date) {
      const expiry = new Date(formData.production_date);
      expiry.setDate(expiry.getDate() + (product.shelf_life_days || 0));
      setFormData({
        ...formData,
        finished_product_id: productId,
        expiry_date: expiry.toISOString().split('T')[0],
      });
    } else {
      setFormData({ ...formData, finished_product_id: productId });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('production_batches').insert([
        {
          finished_product_id: formData.finished_product_id,
          batch_number: formData.batch_number,
          quantity_produced: parseFloat(formData.quantity_produced),
          actual_yield: formData.actual_yield ? parseFloat(formData.actual_yield) : null,
          production_date: formData.production_date,
          expiry_date: formData.expiry_date,
          status: formData.status,
          qc_notes: formData.qc_notes,
        },
      ]);

      if (error) throw error;
      router.push('/production');
    } catch (error) {
      console.error('[v0] Error creating production batch:', error);
      alert('Failed to create production batch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-foreground mb-2">Create Production Batch</h1>
        <p className="text-muted-foreground mb-8">Schedule a new production batch</p>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Product</label>
              <select
                value={formData.finished_product_id}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                <option value="">Select a product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Batch Number</label>
              <input
                type="text"
                value={formData.batch_number}
                onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g., BATCH-001-2024"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Quantity to Produce (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.quantity_produced}
                  onChange={(e) => setFormData({ ...formData, quantity_produced: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Actual Yield (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.actual_yield}
                  onChange={(e) => setFormData({ ...formData, actual_yield: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Production Date</label>
                <input
                  type="date"
                  value={formData.production_date}
                  onChange={(e) => setFormData({ ...formData, production_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Expiry Date</label>
                <input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="planned">Planned</option>
                <option value="in_production">In Production</option>
                <option value="quality_check">Quality Check</option>
                <option value="completed">Completed</option>
                <option value="packaged">Packaged</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">QC Notes</label>
              <textarea
                value={formData.qc_notes}
                onChange={(e) => setFormData({ ...formData, qc_notes: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Batch'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
