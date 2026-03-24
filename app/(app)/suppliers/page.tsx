'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Supplier {
  id: string;
  code: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  lead_time_days: number;
  temperature_controlled: boolean;
  supplier_performance: {
    on_time_delivery_rate: number | null;
    quality_score: number | null;
  } | null;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const { data } = await supabase
        .from('suppliers')
        .select('*, supplier_performance(*)')
        .order('name', { ascending: true });

      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (score: number | null): string => {
    if (!score) return 'text-gray-400';
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Suppliers</h1>
          <p className="text-muted-foreground mt-1">Manage suppliers and track performance</p>
        </div>
        <Button onClick={() => router.push('/suppliers/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Supplier
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading suppliers...</p>
        </div>
      ) : suppliers.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">No suppliers registered</p>
          <Button onClick={() => router.push('/suppliers/new')}>Add First Supplier</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suppliers.map((supplier) => (
            <Card
              key={supplier.id}
              className="p-6 hover:bg-muted/50 cursor-pointer transition"
            >
              <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-foreground">{supplier.name}</h3>
                    <p className="text-xs text-muted-foreground">Code: {supplier.code}</p>
                  </div>
                  {supplier.temperature_controlled && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                      Cold Chain
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <p className="text-muted-foreground">
                  <span className="font-semibold">Contact:</span> {supplier.contact_person}
                </p>
                <p className="text-muted-foreground">
                  <span className="font-semibold">Email:</span> {supplier.email}
                </p>
                <p className="text-muted-foreground">
                  <span className="font-semibold">Phone:</span> {supplier.phone}
                </p>
                <p className="text-muted-foreground">
                  <span className="font-semibold">Lead Time:</span> {supplier.lead_time_days} days
                </p>
              </div>

              {supplier.supplier_performance && (
                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">On-Time Delivery</span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-semibold">
                        {supplier.supplier_performance.on_time_delivery_rate?.toFixed(1)}%
                      </span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.round((supplier.supplier_performance.on_time_delivery_rate || 0) / 20)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Quality Score</span>
                    <span
                      className={`text-sm font-semibold ${getPerformanceColor(
                        supplier.supplier_performance.quality_score
                      )}`}
                    >
                      {supplier.supplier_performance.quality_score?.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
