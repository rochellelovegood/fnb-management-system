import { Metadata } from 'next';
import { AIForecastingDashboard } from '@/components/forecasting/ai-forecasting-dashboard';

export const metadata: Metadata = {
  title: 'AI Forecasting | SwiftProcess',
  description: 'Statistical demand forecasting for production planning',
};

export default function ForecastingPage() {
  return (
    <div className="container mx-auto py-6">
      <AIForecastingDashboard />
    </div>
  );
}