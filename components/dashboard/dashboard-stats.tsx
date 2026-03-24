'use client';

import { Card } from '@/components/ui/card';
import {
  Package,
  ShoppingCart,
  Zap,
  AlertTriangle,
  Utensils,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardStatsProps {
  data: {
    totalProducts: number;
    totalIngredients: number;
    activeOrders: number;
    expiringInventory: number;
    pendingProduction: number;
  };
  loading: boolean;
}

const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  loading,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  loading: boolean;
}) => (
  <Card className="p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <p className="text-3xl font-bold text-foreground">{value}</p>
        )}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>{Icon}</div>
    </div>
  </Card>
);

export default function DashboardStats({ data, loading }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCard
        title="Total Products"
        value={data.totalProducts}
        icon={<Utensils className="h-6 w-6 text-blue-600" />}
        color="bg-blue-100"
        loading={loading}
      />
      <StatCard
        title="Total Ingredients"
        value={data.totalIngredients}
        icon={<Package className="h-6 w-6 text-green-600" />}
        color="bg-green-100"
        loading={loading}
      />
      <StatCard
        title="Active Orders"
        value={data.activeOrders}
        icon={<ShoppingCart className="h-6 w-6 text-orange-600" />}
        color="bg-orange-100"
        loading={loading}
      />
      <StatCard
        title="Expiring Soon"
        value={data.expiringInventory}
        icon={<AlertTriangle className="h-6 w-6 text-red-600" />}
        color="bg-red-100"
        loading={loading}
      />
      <StatCard
        title="Pending Production"
        value={data.pendingProduction}
        icon={<Zap className="h-6 w-6 text-purple-600" />}
        color="bg-purple-100"
        loading={loading}
      />
    </div>
  );
}
