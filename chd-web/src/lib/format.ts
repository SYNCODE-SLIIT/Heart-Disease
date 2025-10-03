import { RiskBand } from './types';

export function formatProbability(probability: number): string {
  return `${(probability * 100).toFixed(1)}%`;
}

export function getRiskBand(probability: number): RiskBand {
  if (probability < 0.20) {
    return {
      level: 'Low',
      color: 'text-green-700',
      bgColor: 'bg-green-100',
      description: 'Low risk of CHD in the next 10 years'
    };
  } else if (probability <= 0.50) {
    return {
      level: 'Medium',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100',
      description: 'Moderate risk of CHD in the next 10 years'
    };
  } else {
    return {
      level: 'High',
      color: 'text-red-700',
      bgColor: 'bg-red-100',
      description: 'High risk of CHD in the next 10 years'
    };
  }
}

export function getDecisionColor(prediction: number): string {
  return prediction === 1 ? 'text-red-600' : 'text-green-600';
}

export function getDecisionBadge(prediction: number): string {
  return prediction === 1 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
}

export function formatThreshold(threshold: number): string {
  return `${(threshold * 100).toFixed(0)}%`;
}