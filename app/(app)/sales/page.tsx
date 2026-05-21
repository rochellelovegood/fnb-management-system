'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SalesOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_type: string;
  order_date: string;
  delivery_date: string;
  status: string;
  special_instructions: string | null;
}

export default function SalesPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchSalesOrders();
  }, []);

  const fetchSalesOrders = async () => {
    try {
      // Remove the .select() that tries to join with finished_products
      const { data, error } = await supabase
        .from('sales_orders')
        .select('*')
        .order('delivery_date', { ascending: true });

      if (error) {
        console.error('Error fetching sales orders:', error);
      } else {
        console.log('Fetched orders:', data?.length);
        setOrders(data || []);
      }
    } catch (error) {
      console.error('Error fetching sales orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-green-100 text-green-800',
    picked: 'bg-yellow-100 text-yellow-800',
    packaged: 'bg-purple-100 text-purple-800',
    shipped: 'bg-orange-100 text-orange-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sales Orders</h1>
          <p className="text-muted-foreground mt-1">Manage customer orders and deliveries</p>
        </div>
        <Button onClick={() => router.push('/sales/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Order
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading sales orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">No sales orders found</p>
          <Button onClick={() => router.push('/sales/new')}>Create First Order</Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Card key={order.id} className="p-6 hover:bg-muted/50 cursor-pointer transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{order.customer_name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Order: {order.order_number}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Type: {order.customer_type.toUpperCase()} • Order Date: {new Date(order.order_date).toLocaleDateString()} • Delivery: {new Date(order.delivery_date).toLocaleDateString()}
                  </p>
                  {order.special_instructions && (
                    <p className="text-sm text-muted-foreground mt-1 italic">
                      Note: {order.special_instructions}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      statusColors[order.status] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {order.status.toUpperCase()}
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