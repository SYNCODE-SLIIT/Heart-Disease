import { PredictOut } from '../lib/types';
import { formatProbability, getRiskBand, getDecisionBadge, formatThreshold } from '../lib/format';

interface ProbabilityCardProps {
  result: PredictOut;
}

export default function ProbabilityCard({ result }: ProbabilityCardProps) {
  const riskBand = getRiskBand(result.probability);
  const decisionLabel = result.prediction === 1 ? 'High Risk' : 'Low Risk';

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-md mx-auto">
      {/* Main Result */}
      <div className="text-center mb-6">
        <div className="text-4xl font-bold text-gray-900 mb-2">
          {formatProbability(result.probability)}
        </div>
        <div className="text-gray-600 text-sm">
          10-year CHD risk probability
        </div>
      </div>

      {/* Decision Badge */}
      <div className="text-center mb-6">
        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getDecisionBadge(result.prediction)}`}>
          {decisionLabel}
        </span>
        <div className="text-xs text-gray-500 mt-1">
          Threshold: {formatThreshold(result.threshold)}
        </div>
      </div>

      {/* Risk Band */}
      <div className={`rounded-xl p-4 mb-6 ${riskBand.bgColor}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className={`font-semibold ${riskBand.color}`}>
              {riskBand.level} Risk
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {riskBand.description}
            </div>
          </div>
          <div className="text-2xl">
            {riskBand.level === 'Low' ? '🟢' : riskBand.level === 'Medium' ? '🟡' : '🔴'}
          </div>
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>0%</span>
          <span>Risk Level</span>
          <span>100%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              result.probability < 0.20 ? 'bg-green-500' :
              result.probability <= 0.50 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(result.probability * 100, 100)}%` }}
          />
        </div>
        <div className="text-center mt-1">
          <div 
            className="inline-block w-1 h-4 bg-gray-400"
            style={{ marginLeft: `${Math.min(result.threshold * 100, 95)}%` }}
            title={`Threshold: ${formatThreshold(result.threshold)}`}
          />
        </div>
      </div>

      {/* Model Info */}
      <div className="text-center text-xs text-gray-400 border-t border-gray-100 pt-4">
        Model: {result.model_version} | Random Forest Algorithm
      </div>
    </div>
  );
}