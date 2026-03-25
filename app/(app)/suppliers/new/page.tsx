'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function NewSupplierPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    product_categories: '',
    certifications: '',
    lead_time_days: '',
    temperature_controlled: false,
    minimum_order_qty: '',
    payment_terms: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('suppliers').insert([
        {
          code: formData.code,
          name: formData.name,
          contact_person: formData.contact_person,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          product_categories: formData.product_categories,
          certifications: formData.certifications,
          lead_time_days: formData.lead_time_days ? parseInt(formData.lead_time_days) : null,
          temperature_controlled: formData.temperature_controlled,
          minimum_order_qty: formData.minimum_order_qty ? parseFloat(formData.minimum_order_qty) : null,
          payment_terms: formData.payment_terms,
        },
      ]);

      if (error) throw error;
      router.push('/suppliers');
    } catch (error) {
      console.error('[v0] Error creating supplier:', error);
      alert('Failed to create supplier');
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
        <h1 className="text-3xl font-bold text-foreground mb-2">Add New Supplier</h1>
        <p className="text-muted-foreground mb-8">Register a new supplier for your ingredients</p>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Supplier Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g., SUP-001"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Company Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Contact Person</label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Lead Time (days)</label>
                <input
                  type="number"
                  value={formData.lead_time_days}
                  onChange={(e) => setFormData({ ...formData, lead_time_days: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Product Categories</label>
              <input
                type="text"
                value={formData.product_categories}
                onChange={(e) => setFormData({ ...formData, product_categories: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g., Flour, Sugar, Oil"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Certifications</label>
              <input
                type="text"
                value={formData.certifications}
                onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g., Organic, Halal, ISO 9001"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Minimum Order Qty (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.minimum_order_qty}
                  onChange={(e) => setFormData({ ...formData, minimum_order_qty: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Payment Terms</label>
                <input
                  type="text"
                  value={formData.payment_terms}
                  onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g., Net 30"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="temp_controlled"
                checked={formData.temperature_controlled}
                onChange={(e) => setFormData({ ...formData, temperature_controlled: e.target.checked })}
                className="h-4 w-4 rounded"
              />
              <label htmlFor="temp_controlled" className="ml-3 text-sm font-medium">
                Temperature Controlled Delivery
              </label>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Supplier'}
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
