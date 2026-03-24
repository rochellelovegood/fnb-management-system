'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import DashboardStats from '@/components/dashboard/dashboard-stats';
import InventoryAlert from '@/components/dashboard/inventory-alert';
import ProductionSchedule from '@/components/dashboard/production-schedule';
import DemandForecast from '@/components/dashboard/demand-forecast';

interface DashboardData {
  totalProducts: number;
  totalIngredients: number;
  activeOrders: number;
  expiringInventory: number;
  pendingProduction: number;
}

export default function DashboardPage() {
  const { userProfile } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalProducts: 0,
    totalIngredients: 0,
    activeOrders: 0,
    expiringInventory: 0,
    pendingProduction: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch finished products count
      const { count: productsCount } = await supabase
        .from('finished_products')
        .select('*', { count: 'exact', head: true });

      // Fetch ingredients count
      const { count: ingredientsCount } = await supabase
        .from('ingredients')
        .select('*', { count: 'exact', head: true });

      // Fetch active orders
      const { count: ordersCount } = await supabase
        .from('sales_orders')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'delivered');

      // Fetch expiring inventory (within 14 days)
      const today = new Date();
      const twoWeeksFromNow = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
      
      const { count: expiringCount } = await supabase
        .from('inventory_batches')
        .select('*', { count: 'exact', head: true })
        .lte('expiry_date', twoWeeksFromNow.toISOString().split('T')[0])
        .gte('expiry_date', today.toISOString().split('T')[0]);

      // Fetch pending production batches
      const { count: productionCount } = await supabase
        .from('production_batches')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'planned');

      setDashboardData({
        totalProducts: productsCount || 0,
        totalIngredients: ingredientsCount || 0,
        activeOrders: ordersCount || 0,
        expiringInventory: expiringCount || 0,
        pendingProduction: productionCount || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {userProfile?.full_name || 'User'}! ({userProfile?.role.replace('_', ' ').toUpperCase()})
        </p>
      </div>

      {/* Stats */}
      <DashboardStats data={dashboardData} loading={loading} />

      {/* Alerts */}
      {dashboardData.expiringInventory > 0 && (
        <InventoryAlert expiringCount={dashboardData.expiringInventory} />
      )}

      {/* Production Schedule */}
      <ProductionSchedule />

      {/* Demand Forecast */}
      <DemandForecast />
    </div>
  );
}
