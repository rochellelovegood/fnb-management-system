'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  Package,
  Utensils,
  ShoppingCart,
  TrendingUp,
  Users,
  LogOut,
  Menu,
  X,
  Calendar,
  Brain,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/recipes', label: 'Recipes', icon: Utensils },
  { href: '/inventory/categorized', label: 'Inventory (Categorized)', icon: Package },
  { href: '/production', label: 'Production', icon: ShoppingCart },
  { href: '/sales', label: 'Sales Orders', icon: ShoppingCart },
  { href: '/calendar', label: 'Production Calendar', icon: Calendar },
  { href: '/forecasting-ai', label: 'AI Forecasting', icon: Brain },
  { href: '/demand-management', label: 'Demand Management', icon: Zap },
  { href: '/mrp', label: 'MRP Planning', icon: TrendingUp },
  { href: '/suppliers', label: 'Suppliers', icon: Users },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { userProfile, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
  };

  const filteredNavItems = navItems.filter((item) => {
    // All roles can access dashboard and forecasting
    if (['dashboard', 'forecasting', 'calendar', 'ai'].some((page) => item.href.includes(page))) {
      return true;
    }
    // Only admin and production_manager can access recipes, inventory, and production
    if (['recipes', 'inventory', 'production'].some((page) => item.href.includes(page))) {
      return userProfile?.role !== 'kitchen_staff';
    }
    // Only admin and production_manager can access sales, suppliers, MRP, and demand management
    if (['sales', 'suppliers', 'mrp', 'demand'].some((page) => item.href.includes(page))) {
      return userProfile?.role !== 'kitchen_staff';
    }
    return true;
  });

  return (
    <>
      {/* Mobile menu button */}
      <div className="hidden max-md:flex md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`w-64 border-r border-border bg-background flex flex-col transition-all duration-300 ${
          isOpen ? 'fixed inset-y-0 left-0 z-40' : 'hidden md:flex'
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Utensils className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">F&B ERP</h1>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Sign Out */}
        <div className="border-t border-border p-4 space-y-3">
          <div className="text-sm">
            <p className="font-semibold text-foreground">{userProfile?.full_name || 'User'}</p>
            <p className="text-xs text-muted-foreground">
              {userProfile?.role.replace(/_/g, ' ').toUpperCase()}
            </p>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
