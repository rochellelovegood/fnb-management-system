'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';

interface SeasonalFactor {
  id: string;
  finished_product_id: string;
  season: string;
  multiplier: number;
  start_date: string;
  end_date: string;
  reason: string;
}

interface DemandEvent {
  id: string;
  finished_product_id: string;
  event_name: string;
  event_date: string;
  expected_surge_factor: number;
  duration_days: number;
}

interface Product {
  id: string;
  name: string;
}

const SEASONS = ['spring', 'summer', 'fall', 'winter', 'holiday'];

export default function DemandManagementPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [seasonalFactors, setSeasonalFactors] = useState<SeasonalFactor[]>([]);
  const [demandEvents, setDemandEvents] = useState<DemandEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  // Form states
  const [showSeasonalForm, setShowSeasonalForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [newSeasonal, setNewSeasonal] = useState({
    season: 'spring',
    multiplier: 1.0,
    start_date: '',
    end_date: '',
    reason: '',
  });
  const [newEvent, setNewEvent] = useState({
    event_name: '',
    event_date: '',
    expected_surge_factor: 1.2,
    duration_days: 7,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, factorsRes, eventsRes] = await Promise.all([
        supabase.from('finished_products').select('id, name').order('name'),
        supabase.from('seasonal_factors').select('*').order('season'),
        supabase.from('demand_events').select('*').order('event_date'),
      ]);

      setProducts(productsRes.data || []);
      setSeasonalFactors(factorsRes.data || []);
      setDemandEvents(eventsRes.data || []);

      if (productsRes.data && productsRes.data.length > 0) {
        setSelectedProductId(productsRes.data[0].id);
      }
    } catch (error) {
      console.error('[v0] Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSeasonalFactor = async () => {
    if (!selectedProductId || !newSeasonal.season) {
      alert('Please select a product and season');
      return;
    }

    try {
      const { error } = await supabase.from('seasonal_factors').insert({
        finished_product_id: selectedProductId,
        season: newSeasonal.season,
        multiplier: newSeasonal.multiplier,
        start_date: newSeasonal.start_date || null,
        end_date: newSeasonal.end_date || null,
        reason: newSeasonal.reason,
      });

      if (error) throw error;

      setNewSeasonal({
        season: 'spring',
        multiplier: 1.0,
        start_date: '',
        end_date: '',
        reason: '',
      });
      setShowSeasonalForm(false);
      fetchData();
    } catch (error) {
      console.error('[v0] Error adding seasonal factor:', error);
      alert('Failed to add seasonal factor');
    }
  };

  const addDemandEvent = async () => {
    if (!selectedProductId || !newEvent.event_name || !newEvent.event_date) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase.from('demand_events').insert({
        finished_product_id: selectedProductId,
        event_name: newEvent.event_name,
        event_date: newEvent.event_date,
        expected_surge_factor: newEvent.expected_surge_factor,
        duration_days: newEvent.duration_days,
      });

      if (error) throw error;

      setNewEvent({
        event_name: '',
        event_date: '',
        expected_surge_factor: 1.2,
        duration_days: 7,
      });
      setShowEventForm(false);
      fetchData();
    } catch (error) {
      console.error('[v0] Error adding event:', error);
      alert('Failed to add demand event');
    }
  };

  const deleteSeasonalFactor = async (id: string) => {
    if (!confirm('Delete this seasonal factor?')) return;

    try {
      const { error } = await supabase.from('seasonal_factors').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('[v0] Error deleting factor:', error);
    }
  };

  const deleteDemandEvent = async (id: string) => {
    if (!confirm('Delete this demand event?')) return;

    try {
      const { error } = await supabase.from('demand_events').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('[v0] Error deleting event:', error);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  const productSeasonalFactors = seasonalFactors.filter(
    (f) => f.finished_product_id === selectedProductId
  );
  const productDemandEvents = demandEvents.filter(
    (e) => e.finished_product_id === selectedProductId
  );

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Demand Management</h1>
        <p className="text-gray-600 mt-2">Configure seasonal adjustments and demand events to improve forecast accuracy</p>
      </div>

      {/* Product Selector */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Select Product</h2>
        <select
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
          className="w-full p-2 border rounded-lg"
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </Card>

      {/* Seasonal Factors Section */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Seasonal Factors</h2>
          <Button
            onClick={() => setShowSeasonalForm(!showSeasonalForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Factor
          </Button>
        </div>

        {showSeasonalForm && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Season</label>
              <select
                value={newSeasonal.season}
                onChange={(e) => setNewSeasonal({ ...newSeasonal, season: e.target.value })}
                className="w-full p-2 border rounded-lg"
              >
                {SEASONS.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Multiplier (e.g., 1.2 = 20% increase)</label>
              <input
                type="number"
                step="0.1"
                value={newSeasonal.multiplier}
                onChange={(e) => setNewSeasonal({ ...newSeasonal, multiplier: parseFloat(e.target.value) })}
                className="w-full p-2 border rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  value={newSeasonal.start_date}
                  onChange={(e) => setNewSeasonal({ ...newSeasonal, start_date: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input
                  type="date"
                  value={newSeasonal.end_date}
                  onChange={(e) => setNewSeasonal({ ...newSeasonal, end_date: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Reason</label>
              <input
                type="text"
                placeholder="e.g., Summer promotion"
                value={newSeasonal.reason}
                onChange={(e) => setNewSeasonal({ ...newSeasonal, reason: e.target.value })}
                className="w-full p-2 border rounded-lg"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={addSeasonalFactor} className="bg-green-600 text-white px-4 py-2 rounded-lg">
                Save Factor
              </Button>
              <Button
                onClick={() => setShowSeasonalForm(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded-lg"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {productSeasonalFactors.length === 0 ? (
            <p className="text-gray-500">No seasonal factors configured</p>
          ) : (
            productSeasonalFactors.map((factor) => (
              <div key={factor.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold capitalize">{factor.season}</p>
                  <p className="text-sm text-gray-600">{factor.reason}</p>
                  <p className="text-xs text-gray-500">
                    {factor.start_date} to {factor.end_date} | Multiplier: {factor.multiplier}x
                  </p>
                </div>
                <button
                  onClick={() => deleteSeasonalFactor(factor.id)}
                  className="text-red-600 hover:bg-red-50 p-2 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Demand Events Section */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Demand Events</h2>
          <Button
            onClick={() => setShowEventForm(!showEventForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Event
          </Button>
        </div>

        {showEventForm && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Event Name</label>
              <input
                type="text"
                placeholder="e.g., Thanksgiving, Black Friday"
                value={newEvent.event_name}
                onChange={(e) => setNewEvent({ ...newEvent, event_name: e.target.value })}
                className="w-full p-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Event Date</label>
              <input
                type="date"
                value={newEvent.event_date}
                onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
                className="w-full p-2 border rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Surge Factor</label>
                <input
                  type="number"
                  step="0.1"
                  value={newEvent.expected_surge_factor}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, expected_surge_factor: parseFloat(e.target.value) })
                  }
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Duration (days)</label>
                <input
                  type="number"
                  value={newEvent.duration_days}
                  onChange={(e) => setNewEvent({ ...newEvent, duration_days: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={addDemandEvent} className="bg-green-600 text-white px-4 py-2 rounded-lg">
                Save Event
              </Button>
              <Button
                onClick={() => setShowEventForm(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded-lg"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {productDemandEvents.length === 0 ? (
            <p className="text-gray-500">No demand events configured</p>
          ) : (
            productDemandEvents.map((event) => (
              <div key={event.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border-l-4 border-orange-500">
                <div>
                  <p className="font-semibold">{event.event_name}</p>
                  <p className="text-sm text-gray-600">
                    Date: {new Date(event.event_date).toLocaleDateString()} | Duration: {event.duration_days} days
                  </p>
                  <p className="text-xs text-gray-500">Surge Factor: {event.expected_surge_factor}x</p>
                </div>
                <button
                  onClick={() => deleteDemandEvent(event.id)}
                  className="text-red-600 hover:bg-red-50 p-2 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Info Card */}
      <Card className="p-6 bg-blue-50 border-l-4 border-blue-500">
        <div className="flex gap-3">
          <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-900">How Seasonal Factors Work</h3>
            <p className="text-sm text-blue-800 mt-1">
              Seasonal factors multiply the base demand forecast. For example, a 1.5x multiplier during summer means expect 50% more demand. AI will detect patterns from historical data and blend them with your manual factors for more accurate forecasts.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
