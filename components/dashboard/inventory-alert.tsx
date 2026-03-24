'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface InventoryAlertProps {
  expiringCount: number;
}

export default function InventoryAlert({ expiringCount }: InventoryAlertProps) {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Inventory Expiring Soon</AlertTitle>
      <AlertDescription>
        {expiringCount} ingredient batch{expiringCount !== 1 ? 'es' : ''} expiring within the next 14 days.{' '}
        <Link href="/inventory" className="underline font-semibold hover:no-underline">
          View Inventory
        </Link>
      </AlertDescription>
    </Alert>
  );
}
