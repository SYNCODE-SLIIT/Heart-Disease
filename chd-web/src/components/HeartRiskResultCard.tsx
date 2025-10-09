import { useState } from 'react';
import ProbabilityCard from './ProbabilityCard';
import { PredictOut } from '../lib/types';

// Risk level type
export type RiskLevel = 'low' | 'medium' | 'high';

// Contributing factor interface
export interface ContributingFactor {
  feature: string;
  direction: 'increases' | 'decreases';
  impact: number; // 0-1 scale
  label?: string; // Optional friendly label
}

// Prediction result interface
export interface PredictionResult {
  probability: number; // 0-1 (will be shown as percentage)
  riskLevel: RiskLevel;
  factors?: ContributingFactor[];
  isLoading?: boolean;
  error?: string;
  apiResult?: PredictOut; // Original API result for ProbabilityCard
}

interface HeartRiskResultCardProps {
  result: PredictionResult;
}

// Risk configuration with colors and messages
const RISK_CONFIG = {
  low: {
    cardBgColor: 'bg-gradient-to-br from-green-50 to-emerald-50',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-200',
    emoji: '💚',
    headline: 'Your heart health looks good!',
    subline: 'Keep up the healthy habits — small wins add up.',
    pillLabel: 'Low Risk',
  },
  medium: {
    cardBgColor: 'bg-gradient-to-br from-amber-50 to-yellow-50',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-800',
    borderColor: 'border-amber-200',
    emoji: '💛',
    headline: 'There are some things to watch.',
    subline: 'A few risk factors could improve with lifestyle changes.',
    pillLabel: 'Moderate Risk',
  },
  high: {
    cardBgColor: 'bg-gradient-to-br from-rose-50 to-pink-50',
    bgColor: 'bg-rose-100',
    textColor: 'text-rose-800',
    borderColor: 'border-rose-200',
    emoji: '❤️',
    headline: 'This suggests higher-than-normal risk.',
    subline: 'Consider discussing your results with a healthcare professional.',
    pillLabel: 'High Risk',
  },
};

export default function HeartRiskResultCard({ result }: HeartRiskResultCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  if (result.isLoading) {
    return (
      <div className="w-full max-w-3xl mx-auto">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl p-8 shadow-lg">
          <div className="flex items-center gap-3 text-blue-600">
            <div className="w-6 h-6 border-3 border-blue-400 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-sm font-medium">✨ Analyzing your health data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (result.error) {
    return (
      <div className="w-full max-w-3xl mx-auto">
        <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-100 rounded-3xl p-8 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <p className="text-sm text-red-700 font-medium">{result.error}</p>
          </div>
        </div>
      </div>
    );
  }

  const config = RISK_CONFIG[result.riskLevel];

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {/* Main Summary Card */}
      <div className={`${config.cardBgColor} border border-gray-200 rounded-3xl p-8 shadow-xl transition-all duration-200`}>
        {/* Header with Emoji */}
        <div className="mb-6 flex items-center gap-4">
          <div className="text-5xl">{config.emoji}</div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">HeartSense Results</h2>
            <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold ${config.bgColor} ${config.textColor} border ${config.borderColor} shadow-sm`}>
              {config.pillLabel}
            </div>
          </div>
        </div>

        {/* Main Message */}
        <div className="mb-6 bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/80">
          <p className="text-xl font-bold text-gray-900 mb-2">{config.headline}</p>
          <p className="text-base text-gray-700">{config.subline}</p>
        </div>

        {/* Toggle Section */}
        <div className="pt-4 border-t border-gray-200/60">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="group flex items-center justify-between w-full text-left focus:outline-none focus:ring-3 focus:ring-blue-400 focus:ring-offset-2 rounded-xl p-3 -m-1 transition-colors hover:bg-white/50"
            aria-label={showDetails ? 'Hide advanced details' : 'Show advanced details'}
            aria-expanded={showDetails}
          >
            <div className="flex-1 flex items-center gap-3">
              <span className="text-xl">{showDetails ? '📊' : '🔍'}</span>
              <div>
                <p className="text-base font-semibold text-gray-900 mb-1">See advanced details</p>
                <p className="text-sm text-gray-600">View exact probability, risk metrics, and model information.</p>
              </div>
            </div>
            <div className="ml-4">
              <div className={`w-14 h-7 rounded-full transition-colors duration-200 ${showDetails ? 'bg-blue-500' : 'bg-gray-300'} relative shadow-inner`}>
                <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${showDetails ? 'translate-x-7' : 'translate-x-0'}`} />
              </div>
            </div>
          </button>
        </div>

        {/* Footer Disclaimer */}
        <div className="mt-6 flex items-start gap-2 bg-gray-100/50 rounded-xl p-3">
          <span className="text-sm">ℹ️</span>
          <p className="text-xs text-gray-600 leading-relaxed">
            This model provides an estimate only and is not a medical diagnosis.
          </p>
        </div>
      </div>

      {/* Advanced Details Card (Expandable) */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          showDetails ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        {result.apiResult && (
          <ProbabilityCard result={result.apiResult} />
        )}
      </div>
    </div>
  );
}
