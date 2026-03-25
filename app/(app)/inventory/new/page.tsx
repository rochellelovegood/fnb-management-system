'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

interface Ingredient {
  id: string;
  name: string;
  code: string;
  shelf_life_days: number;
}

interface Supplier {
  id: string;
  name: string;
}

export default function NewInventoryPage() {
  const router = useRouter();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    ingredient_id: '',
    batch_number: '',
    quantity: '',
    unit_type: 'kg',
    supplier_id: '',
    received_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    storage_location: '',
    temperature_min: '',
    temperature_max: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ingredientRes, supplierRes] = await Promise.all([
        supabase.from('ingredients').select('id, name, code, shelf_life_days'),
        supabase.from('suppliers').select('id, name'),
      ]);

      setIngredients(ingredientRes.data || []);
      setSuppliers(supplierRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleIngredientChange = (ingredientId: string) => {
    const ingredient = ingredients.find((i) => i.id === ingredientId);
    if (ingredient && formData.received_date) {
      const expiry = new Date(formData.received_date);
      expiry.setDate(expiry.getDate() + (ingredient.shelf_life_days || 0));
      setFormData({
        ...formData,
        ingredient_id: ingredientId,
        expiry_date: expiry.toISOString().split('T')[0],
      });
    } else {
      setFormData({ ...formData, ingredient_id: ingredientId });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('inventory_batches').insert([
        {
          ingredient_id: formData.ingredient_id,
          batch_number: formData.batch_number,
          quantity: parseFloat(formData.quantity),
          unit_type: formData.unit_type,
          supplier_id: formData.supplier_id,
          received_date: formData.received_date,
          expiry_date: formData.expiry_date,
          storage_location: formData.storage_location,
          temperature_min: formData.temperature_min ? parseFloat(formData.temperature_min) : null,
          temperature_max: formData.temperature_max ? parseFloat(formData.temperature_max) : null,
        },
      ]);

      if (error) throw error;
      router.push('/inventory');
    } catch (error) {
      console.error('[v0] Error creating inventory batch:', error);
      alert('Failed to create inventory batch');
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
        <h1 className="text-3xl font-bold text-foreground mb-2">Add Inventory Batch</h1>
        <p className="text-muted-foreground mb-8">Record received ingredients with batch tracking</p>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Ingredient</label>
                <select
                  value={formData.ingredient_id}
                  onChange={(e) => handleIngredientChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="">Select ingredient</option>
                  {ingredients.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Supplier</label>
                <select
                  value={formData.supplier_id}
                  onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="">Select supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Batch Number</label>
                <input
                  type="text"
                  value={formData.batch_number}
                  onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g., BATCH-20240101"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Quantity</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="flex-1 px-3 py-2 border rounded-md"
                    required
                  />
                  <select
                    value={formData.unit_type}
                    onChange={(e) => setFormData({ ...formData, unit_type: e.target.value })}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="kg">kg</option>
                    <option value="liter">liter</option>
                    <option value="pieces">pieces</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Received Date</label>
                <input
                  type="date"
                  value={formData.received_date}
                  onChange={(e) => setFormData({ ...formData, received_date: e.target.value })}
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
              <label className="block text-sm font-medium mb-2">Storage Location</label>
              <input
                type="text"
                value={formData.storage_location}
                onChange={(e) => setFormData({ ...formData, storage_location: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g., Cold Storage A, Shelf 3"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Min Temperature (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.temperature_min}
                  onChange={(e) => setFormData({ ...formData, temperature_min: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Max Temperature (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.temperature_max}
                  onChange={(e) => setFormData({ ...formData, temperature_max: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Add Batch'}
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
