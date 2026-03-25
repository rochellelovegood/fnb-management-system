'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';

interface UpdateStatusModalProps {
  batchId: string;
  batchNumber: string;
  currentStatus: string;
  onClose: () => void;
  onStatusUpdated: () => void;
}

export function UpdateStatusModal({
  batchId,
  batchNumber,
  currentStatus,
  onClose,
  onStatusUpdated,
}: UpdateStatusModalProps) {
  const [newStatus, setNewStatus] = useState(currentStatus);
  const [qcNotes, setQcNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const statuses = ['planned', 'in_production', 'quality_check', 'completed', 'packaged'];
  
  const statusColors: Record<string, string> = {
    planned: 'bg-blue-100 text-blue-800',
    in_production: 'bg-yellow-100 text-yellow-800',
    quality_check: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    packaged: 'bg-gray-100 text-gray-800',
  };

  const handleStatusUpdate = async () => {
    if (newStatus === currentStatus && !qcNotes) {
      setError('Please select a new status or add QC notes');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/production-batches/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId,
          status: newStatus,
          qcNotes: qcNotes || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update status');
      }

      onStatusUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Update Production Status</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Batch</p>
            <p className="text-lg font-semibold">{batchNumber}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Current Status</p>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${statusColors[currentStatus]}`}>
              {currentStatus.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-2">
              New Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-2">
              QC Notes (Optional)
            </label>
            <textarea
              value={qcNotes}
              onChange={(e) => setQcNotes(e.target.value)}
              placeholder="Add quality check notes or comments..."
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={3}
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-800 px-3 py-2 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Updating...' : 'Update Status'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
