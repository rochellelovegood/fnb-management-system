# F&B ERP Developer Reference Guide

## Quick Commands

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database
- **Schema Creation:** Execute `/scripts/fnb-schema-combined.sql` in Supabase SQL Editor
- **View Tables:** Open Supabase Dashboard → Tables
- **Query Data:** Use Supabase Dashboard → SQL Editor

## Common Code Patterns

### Fetching Data from Supabase

```typescript
import { supabase } from '@/lib/supabase';

// Simple fetch
const { data, error } = await supabase
  .from('products')
  .select('*')
  .order('name', { ascending: true });

// With joins
const { data } = await supabase
  .from('inventory_batches')
  .select('*, ingredients(name, code), suppliers(name)')
  .eq('status', 'active');

// With filtering
const { data } = await supabase
  .from('sales_orders')
  .select('*')
  .neq('status', 'delivered')
  .lte('delivery_date', '2026-03-31');
```

### Using Auth Context

```typescript
import { useAuth } from '@/lib/auth-context';

export default function MyComponent() {
  const { user, userProfile, loading, signOut } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not authenticated</div>;

  return (
    <div>
      <p>User: {userProfile?.full_name}</p>
      <p>Role: {userProfile?.role}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Creating a Data Table

```typescript
const { data, error } = await supabase
  .from('finished_products')
  .select('id, sku, name, selling_price_per_unit, shelf_life_days');

return (
  <div className="grid gap-4">
    {data?.map((product) => (
      <Card key={product.id}>
        <h3>{product.name}</h3>
        <p>SKU: {product.sku}</p>
        <p>Price: ${product.selling_price_per_unit}</p>
      </Card>
    ))}
  </div>
);
```

### Adding a New Page

1. Create file: `app/(app)/module-name/page.tsx`
2. Import components and Supabase client
3. Add route to navigation in `components/navigation.tsx`
4. Use auth check and data fetching pattern

## Database Quick Reference

### User Roles
```
'admin'              - Full access
'production_manager' - Access to production, inventory, sales, suppliers
'kitchen_staff'      - View-only, can update batch status
```

### Common Queries

**Get expiring inventory:**
```sql
SELECT * FROM inventory_batches 
WHERE expiry_date BETWEEN NOW() AND NOW() + INTERVAL '14 days'
ORDER BY expiry_date ASC;
```

**Get active orders:**
```sql
SELECT * FROM sales_orders 
WHERE status != 'delivered' 
ORDER BY delivery_date ASC;
```

**Get supplier performance:**
```sql
SELECT s.name, sp.on_time_delivery_rate, sp.quality_score
FROM suppliers s
JOIN supplier_performance sp ON s.id = sp.supplier_id
ORDER BY sp.quality_score DESC;
```

**Calculate food cost for product:**
```sql
SELECT fp.name, SUM(ic.unit_cost * ri.quantity_needed * ri.wastage_factor) as total_cost
FROM finished_products fp
JOIN recipes r ON fp.id = r.finished_product_id
JOIN recipe_ingredients ri ON r.id = ri.recipe_id
JOIN ingredients i ON ri.ingredient_id = i.id
JOIN ingredient_costs ic ON i.id = ic.ingredient_id
WHERE fp.id = $1
GROUP BY fp.id, fp.name;
```

## Component Structure

### Page Components
Located in `app/(app)/[module]/page.tsx`
- Handle data fetching
- Manage loading states
- Render lists and forms

### UI Components
Located in `components/ui/`
- Pre-built shadcn/ui components
- Used by page components
- Reusable across the app

### Dashboard Components
Located in `components/dashboard/`
- `dashboard-stats.tsx` - KPI stat cards
- `inventory-alert.tsx` - Alert banner
- `production-schedule.tsx` - Schedule list
- `demand-forecast.tsx` - Forecast chart

### Navigation
Located in `components/navigation.tsx`
- Sidebar with filtered menu items by role
- User profile display
- Sign-out button

## UI Component Usage Examples

### Button
```tsx
import { Button } from '@/components/ui/button';

<Button onClick={handleClick}>Click Me</Button>
<Button variant="outline">Outline</Button>
<Button disabled>Disabled</Button>
```

### Card
```tsx
import { Card } from '@/components/ui/card';

<Card className="p-6">
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</Card>
```

### Input
```tsx
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

<div>
  <Label htmlFor="name">Name</Label>
  <Input id="name" placeholder="Enter name" />
</div>
```

### Alert
```tsx
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

<Alert variant="destructive">
  <AlertTriangle className="h-4 w-4" />
  <AlertDescription>Something went wrong</AlertDescription>
</Alert>
```

## Styling Guidelines

### Tailwind Classes
- Use semantic colors: `text-foreground`, `bg-background`, `text-muted-foreground`
- Spacing: `p-4`, `m-2`, `gap-3` (use scale: 2, 4, 6, 8...)
- Responsive: `md:grid-cols-2`, `lg:text-xl`
- Status colors: Green for success, yellow for warning, red for error

### Color System
- **Primary:** Blue for main actions
- **Success:** Green for completed/good
- **Warning:** Yellow for caution
- **Danger:** Red for errors/critical
- **Background:** Use `bg-background`, `text-foreground`

## Common Issues & Solutions

### Issue: "Cannot read property 'role' of null"
**Solution:** Check auth loading state before accessing userProfile
```typescript
if (loading) return <Spinner />;
if (!user || !userProfile) return <Redirect to="/login" />;
```

### Issue: "Table 'users' not found"
**Solution:** Run database schema migration in Supabase SQL Editor

### Issue: Hydration mismatch warnings
**Solution:** Ensure 'use client' directive is at top of file for client components

### Issue: CORS errors from Supabase
**Solution:** Verify NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are correct

## Environment Variables Checklist

- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations

## Git Workflow

```bash
git clone <repo>
cd v0-project
npm install
npm run dev
```

## Deployment Checklist

- [ ] Database schema created in Supabase
- [ ] Test users created and roles assigned
- [ ] Environment variables configured
- [ ] All dependencies installed
- [ ] Build completes without errors: `npm run build`
- [ ] Test critical paths in staging
- [ ] Deploy to Vercel or hosting platform

## Performance Tips

1. **Memoize expensive calculations**
   ```typescript
   const memoizedValue = useMemo(() => expensiveCalculation(), [dependency]);
   ```

2. **Use SWR for data fetching** (future enhancement)
   ```typescript
   import useSWR from 'swr';
   const { data, error } = useSWR('/api/data', fetcher);
   ```

3. **Limit chart data points** - Recharts performs better with < 50 data points

4. **Index frequently queried columns** - Already done in schema

## Debugging Tips

1. **Check console for errors**: `F12` → Console tab
2. **Verify auth state**: Check Application → Cookies → Auth tokens
3. **Monitor queries**: Open Supabase Dashboard → Database → Real-time
4. **Add console.log statements**: `console.log('[v0] Value:', value);`
5. **Test with different roles**: Create test users with each role

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Recharts Documentation](https://recharts.org/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Lucide Icons](https://lucide.dev/)

## Contact & Support

For issues or questions:
1. Check the QUICKSTART.md file
2. Review DATABASE_SETUP.md for database questions
3. Check IMPLEMENTATION_SUMMARY.md for architecture details
4. Review this developer reference for code patterns

---

**Last Updated:** March 24, 2026  
**Maintained By:** Development Team
