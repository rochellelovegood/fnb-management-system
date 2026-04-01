'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Package, Boxes, ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface InventoryItem {
  id: string;
  code: string;
  name: string;
  quantity_on_hand?: number;
  reorder_point?: number;
  unit_of_measure?: string;
  supplier_id?: string;
  suppliers?: { name: string; code: string };
  inventory_batches?: Array<{
    id: string;
    batch_number: string;
    quantity: number;
    expiry_date: string;
  }>;
  packaging_batches?: Array<{
    id: string;
    batch_number: string;
    quantity: number;
    expiry_date: string;
  }>;
  production_batches?: Array<{
    id: string;
    batch_number: string;
    quantity_produced: number;
    status: string;
  }>;
  sku?: string;
  category?: string;
}

type InventoryCategory = 'ingredient' | 'packaging' | 'finished_good';

export default function CategorizedInventoryPage() {
  const [activeTab, setActiveTab] = useState<InventoryCategory>('ingredient');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchInventoryByCategory(activeTab);
  }, [activeTab]);

  async function fetchInventoryByCategory(category: InventoryCategory) {
    try {
      setLoading(true);
      const response = await fetch(`/api/inventory/by-category?category=${category}`);
      const data = await response.json();
      setInventory(data.inventory || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  }

  const categoryConfig = {
    ingredient: {
      label: 'Raw Materials (Ingredients)',
      icon: Package,
      color: 'bg-blue-500',
      newUrl: '/inventory/new',
      description: 'Food ingredients and raw materials',
    },
    packaging: {
      label: 'Packaging Materials',
      icon: Boxes,
      color: 'bg-purple-500',
      newUrl: '/packaging/new',
      description: 'Bottles, containers, and packaging supplies',
    },
    finished_good: {
      label: 'Finished Goods Products',
      icon: ShoppingCart,
      color: 'bg-green-500',
      newUrl: '/products/new',
      description: 'Ready-to-sell finished products',
    },
  };

  const config = categoryConfig[activeTab];
  const Icon = config.icon;

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
          <p className="text-muted-foreground mt-1">Track materials across all inventory categories</p>
        </div>
        <Button onClick={() => router.push(config.newUrl)}>
          <Plus className="h-4 w-4 mr-2" />
          Add New
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {(Object.entries(categoryConfig) as [InventoryCategory, typeof config][]).map(([category, cfg]) => {
          const TabIcon = cfg.icon;
          return (
            <button
              key={category}
              onClick={() => setActiveTab(category)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition font-semibold ${
                activeTab === category
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <TabIcon className="h-4 w-4" />
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Category Description */}
      <Card className="p-4 bg-muted/50 border-0">
        <div className="flex items-start gap-3">
          <Icon className={`h-5 w-5 mt-0.5 ${config.color} rounded text-white p-1`} />
          <div>
            <h2 className="font-semibold text-foreground">{config.label}</h2>
            <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
          </div>
        </div>
      </Card>

      {/* Inventory List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading {config.label.toLowerCase()}...</p>
        </div>
      ) : inventory.length === 0 ? (
        <Card className="p-12 text-center">
          <Icon className={`h-12 w-12 mx-auto mb-4 opacity-50`} />
          <p className="text-muted-foreground mb-4">No {config.label.toLowerCase()} found</p>
          <Button onClick={() => router.push(config.newUrl)}>Add First {config.label}</Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {inventory.map((item) => {
            const batches = activeTab === 'ingredient' ? item.inventory_batches : activeTab === 'packaging' ? item.packaging_batches : item.production_batches;
            const isLowStock = activeTab !== 'finished_good' && item.quantity_on_hand !== undefined && item.reorder_point !== undefined && item.quantity_on_hand <= item.reorder_point;

            return (
              <Card
                key={item.id}
                className={`p-6 cursor-pointer hover:bg-muted/50 transition ${isLowStock ? 'border-orange-500' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground text-lg">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {activeTab === 'finished_good' ? `SKU: ${item.sku}` : `Code: ${item.code}`}
                    </p>

                    {activeTab !== 'finished_good' && (
                      <div className="flex gap-4 mt-3 text-sm">
                        <span className="text-foreground">
                          Stock: <span className="font-semibold">{item.quantity_on_hand}</span> {item.unit_of_measure}
                        </span>
                        <span className="text-foreground">
                          Reorder Point: <span className="font-semibold">{item.reorder_point}</span>
                        </span>
                        {item.suppliers && (
                          <span className="text-foreground">
                            Supplier: <span className="font-semibold">{item.suppliers.name}</span>
                          </span>
                        )}
                      </div>
                    )}

                    {batches && batches.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Batches</p>
                        <div className="flex flex-wrap gap-2">
                          {batches.slice(0, 3).map((batch) => (
                            <span key={batch.id} className="text-xs bg-muted px-2 py-1 rounded">
                              {batch.batch_number}: {'quantity' in batch ? batch.quantity : batch.quantity_produced} units
                            </span>
                          ))}
                          {batches.length > 3 && (
                            <span className="text-xs text-muted-foreground px-2 py-1">
                              +{batches.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {isLowStock && (
                    <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded text-xs font-semibold">
                      Low Stock ⚠
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}