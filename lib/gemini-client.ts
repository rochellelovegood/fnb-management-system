'use client';

import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  console.warn('[v0] NEXT_PUBLIC_GEMINI_API_KEY is not set. AI features will be disabled.');
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export interface ForecastResult {
  predicted_demand: number;
  confidence: number;
  reasoning: string;
  trend: string;
  seasonality: string;
}

export interface Recommendation {
  type: 'production' | 'inventory' | 'ingredient' | 'alert';
  title: string;
  description: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
}

export async function forecastDemandWithAI(
  productName: string,
  historicalSalesData: Array<{ date: string; quantity: number }>,
  shelfLifeDays: number,
  currentInventory: number,
  seasonalFactor?: number
): Promise<ForecastResult | null> {
  if (!genAI) {
    console.warn('[v0] Gemini not configured. Using fallback forecast.');
    return null;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Calculate trend and basic stats
    const recentSales = historicalSalesData.slice(-12);
    const avgDaily = recentSales.reduce((sum, d) => sum + d.quantity, 0) / recentSales.length;
    const trend = historicalSalesData.length > 4
      ? historicalSalesData.slice(-4).reduce((sum, d) => sum + d.quantity, 0) / 4 > 
        historicalSalesData.slice(-8, -4).reduce((sum, d) => sum + d.quantity, 0) / 4
        ? 'increasing'
        : 'decreasing'
      : 'stable';

    const prompt = `You are a food & beverage production forecasting AI specialist.

Product: ${productName}
Shelf life: ${shelfLifeDays} days
Current inventory: ${currentInventory} units
Seasonal factor: ${seasonalFactor ? `${(seasonalFactor * 100).toFixed(0)}%` : 'normal'}

Historical sales data (last 12 weeks, daily quantities):
${historicalSalesData.map(d => `${d.date}: ${d.quantity}`).join('\n')}

Based on this F&B production data, predict the demand for the next 4 weeks.
Consider:
1. Weekly seasonality patterns
2. Trend direction (${trend})
3. Holiday/peak periods
4. Shelf life constraints
5. Current inventory levels

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "predicted_demand": <number for next 4 weeks>,
  "confidence": <0.0 to 1.0>,
  "reasoning": "<brief explanation>",
  "trend": "<increasing|decreasing|stable>",
  "seasonality": "<pattern description>"
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse JSON response (handle potential markdown formatting)
    let jsonStr = responseText;
    if (jsonStr.includes('```json')) {
      jsonStr = jsonStr.split('```json')[1].split('```')[0];
    } else if (jsonStr.includes('```')) {
      jsonStr = jsonStr.split('```')[1].split('```')[0];
    }

    const forecast = JSON.parse(jsonStr.trim()) as ForecastResult;
    return forecast;
  } catch (error) {
    console.error('[v0] Gemini forecast error:', error);
    return null;
  }
}

export async function generateSmartRecommendations(
  productName: string,
  forecastResult: ForecastResult,
  currentInventory: number,
  shelfLifeDays: number,
  supplierLeadTime: number
): Promise<Recommendation[]> {
  if (!genAI) {
    return [];
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are a food & beverage supply chain optimization specialist.

Product: ${productName}
Predicted demand (4 weeks): ${forecastResult.predicted_demand} units
Confidence: ${(forecastResult.confidence * 100).toFixed(0)}%
Current inventory: ${currentInventory} units
Shelf life: ${shelfLifeDays} days
Supplier lead time: ${supplierLeadTime} days

Forecast reasoning: ${forecastResult.reasoning}
Trend: ${forecastResult.trend}
Seasonality: ${forecastResult.seasonality}

Generate 3-5 actionable recommendations for production planning and inventory management.

Respond ONLY with valid JSON array (no markdown):
[
  {
    "type": "<production|inventory|ingredient|alert>",
    "title": "<short title>",
    "description": "<detailed description>",
    "action": "<specific action to take>",
    "priority": "<high|medium|low>"
  }
]`;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text();

    // Parse JSON response
    if (responseText.includes('```json')) {
      responseText = responseText.split('```json')[1].split('```')[0];
    } else if (responseText.includes('```')) {
      responseText = responseText.split('```')[1].split('```')[0];
    }

    const recommendations = JSON.parse(responseText.trim()) as Recommendation[];
    return recommendations;
  } catch (error) {
    console.error('[v0] Recommendations error:', error);
    return [];
  }
}
