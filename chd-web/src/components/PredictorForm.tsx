import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PredictIn, PredictOut } from '../lib/types';
import { postPredict, ApiError } from '../lib/api';

// Zod schema for form validation
const predictSchema = z.object({
  // Demographics
  age: z.number().min(18, 'Age must be at least 18').max(120, 'Age must be less than 120'),
  gender: z.enum(['Male', 'Female'], { message: 'Please select gender' }),
  
  // Vital signs
  sysBP: z.number().min(70, 'Systolic BP must be at least 70 mmHg').max(300, 'Systolic BP must be less than 300 mmHg'),
  pulsePressure: z.number().min(10, 'Pulse pressure must be at least 10 mmHg').max(200, 'Pulse pressure must be less than 200 mmHg').optional(),
  BMI: z.number().min(10, 'BMI must be at least 10').max(60, 'BMI must be less than 60'),
  heartRate: z.number().min(30, 'Heart rate must be at least 30 bpm').max(220, 'Heart rate must be less than 220 bpm').optional(),
  
  // Lab values
  totChol: z.number().min(100, 'Total cholesterol must be at least 100 mg/dL').max(600, 'Total cholesterol must be less than 600 mg/dL').optional(),
  glucose: z.number().min(50, 'Glucose must be at least 50 mg/dL').max(500, 'Glucose must be less than 500 mg/dL').optional(),
  
  // Lifestyle
  cigsPerDay: z.number().min(0, 'Cannot be negative').max(100, 'Must be less than 100').optional(),
  currentSmoker: z.enum(['Yes', 'No']).optional(),
  
  // Medical history
  BPMeds: z.enum(['Yes', 'No']).optional(),
  prevalentStroke: z.enum(['Yes', 'No']).optional(),
  prevalentHyp: z.enum(['Yes', 'No']).optional(),
  diabetes: z.enum(['Yes', 'No']).optional(),
}).superRefine((data, ctx) => {
  if (data.currentSmoker === 'No' && typeof data.cigsPerDay === 'number' && data.cigsPerDay !== 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['cigsPerDay'], message: 'Must be 0 when not a smoker' });
  }
});

type FormData = z.infer<typeof predictSchema>;

interface PredictorFormProps {
  onResult: (result: PredictOut) => void;
}

export default function PredictorForm({ onResult }: PredictorFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<FormData>({ resolver: zodResolver(predictSchema) });

  // Prevent typing minus/exponent/plus in number inputs
  const preventMinus: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
      e.preventDefault();
    }
  };

  // Prevent pasting invalid characters into number fields
  const preventInvalidPaste: React.ClipboardEventHandler<HTMLInputElement> = (e) => {
    const text = e.clipboardData.getData('text');
    if (/[eE+\-]/.test(text)) {
      e.preventDefault();
    }
  };

  // If currentSmoker is 'No', enforce cigsPerDay = 0 and disable field
  const currentSmokerValue = watch('currentSmoker');
  const cigsValue = watch('cigsPerDay');
  useEffect(() => {
    if (currentSmokerValue === 'No') {
      setValue('cigsPerDay', 0, { shouldValidate: false, shouldDirty: true });
    }
  }, [currentSmokerValue, setValue]);

  // If cigsPerDay > 0, enforce currentSmoker = 'Yes'
  useEffect(() => {
    if (typeof cigsValue === 'number' && cigsValue > 0 && currentSmokerValue !== 'Yes') {
      setValue('currentSmoker', 'Yes', { shouldValidate: false, shouldDirty: true });
    }
  }, [cigsValue, currentSmokerValue, setValue]);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await postPredict(data as PredictIn);
      onResult(result);
      // Don't reset form after successful prediction
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    reset();
    setError(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        HeartSense Assessment Form
      </h2>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="text-red-700 text-sm">
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Demographics */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Demographics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age (years) *
              </label>
              <input
                type="number"
                min={18}
                {...register('age', { valueAsNumber: true })}
                onKeyDown={preventMinus}
                onPaste={preventInvalidPaste}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="e.g., 45"
              />
              {errors.age && (
                <p className="text-red-600 text-sm mt-1">{errors.age.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender *
              </label>
              <select
                {...register('gender', { setValueAs: (v) => (v === '' ? undefined : v) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              {errors.gender && (
                <p className="text-red-600 text-sm mt-1">{errors.gender.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Vital Signs */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vital Signs</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Systolic Blood Pressure (mmHg) *
              </label>
              <input
                type="number"
                step="0.1"
                min={70}
                {...register('sysBP', { valueAsNumber: true })}
                onKeyDown={preventMinus}
                onPaste={preventInvalidPaste}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="e.g., 130"
              />
              {errors.sysBP && (
                <p className="text-red-600 text-sm mt-1">{errors.sysBP.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pulse Pressure (mmHg)
              </label>
              <input
                type="number"
                step="0.1"
                min={10}
                {...register('pulsePressure', { valueAsNumber: true, setValueAs: (v) => (Number.isNaN(v) ? undefined : v) })}
                onKeyDown={preventMinus}
                onPaste={preventInvalidPaste}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="e.g., 40"
              />
              {errors.pulsePressure && (
                <p className="text-red-600 text-sm mt-1">{errors.pulsePressure.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                BMI (kg/m²) *
              </label>
              <input
                type="number"
                step="0.1"
                min={10}
                {...register('BMI', { valueAsNumber: true })}
                onKeyDown={preventMinus}
                onPaste={preventInvalidPaste}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="e.g., 25.5"
              />
              {errors.BMI && (
                <p className="text-red-600 text-sm mt-1">{errors.BMI.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Heart Rate (bpm)
              </label>
              <input
                type="number"
                step="0.1"
                min={30}
                {...register('heartRate', { valueAsNumber: true, setValueAs: (v) => (Number.isNaN(v) ? undefined : v) })}
                onKeyDown={preventMinus}
                onPaste={preventInvalidPaste}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="e.g., 75"
              />
              {errors.heartRate && (
                <p className="text-red-600 text-sm mt-1">{errors.heartRate.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Lab Values */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Lab Values</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Cholesterol (mg/dL)
              </label>
              <input
                type="number"
                step="0.1"
                min={100}
                {...register('totChol', { valueAsNumber: true, setValueAs: (v) => (Number.isNaN(v) ? undefined : v) })}
                onKeyDown={preventMinus}
                onPaste={preventInvalidPaste}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="e.g., 200"
              />
              {errors.totChol && (
                <p className="text-red-600 text-sm mt-1">{errors.totChol.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Glucose (mg/dL)
              </label>
              <input
                type="number"
                step="0.1"
                min={50}
                {...register('glucose', { valueAsNumber: true, setValueAs: (v) => (Number.isNaN(v) ? undefined : v) })}
                onKeyDown={preventMinus}
                onPaste={preventInvalidPaste}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="e.g., 90"
              />
              {errors.glucose && (
                <p className="text-red-600 text-sm mt-1">{errors.glucose.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Lifestyle */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Lifestyle</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cigarettes per Day
              </label>
              <input
                type="number"
                step="0.1"
                min={0}
                {...register('cigsPerDay', { valueAsNumber: true, setValueAs: (v) => {
                  if (v === '' || v === null || typeof v === 'undefined') return undefined;
                  const n = Number(v);
                  if (Number.isNaN(n)) return undefined;
                  return n < 0 ? 0 : n;
                } })}
                onKeyDown={preventMinus}
                onPaste={preventInvalidPaste}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder={currentSmokerValue === 'No' ? '0 (disabled when not a smoker)' : 'e.g., 0'}
                disabled={currentSmokerValue === 'No'}
              />
              {errors.cigsPerDay && (
                <p className="text-red-600 text-sm mt-1">{errors.cigsPerDay.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Smoker
              </label>
              <select
                {...register('currentSmoker', { setValueAs: (v) => (v === '' ? undefined : v) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
              >
                <option value="">Select option</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
              {errors.currentSmoker && (
                <p className="text-red-600 text-sm mt-1">{errors.currentSmoker.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Medical History */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Medical History</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                On BP Medication
              </label>
              <select
                {...register('BPMeds', { setValueAs: (v) => (v === '' ? undefined : v) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
              >
                <option value="">Select option</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
              {errors.BPMeds && (
                <p className="text-red-600 text-sm mt-1">{errors.BPMeds.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Previous Stroke
              </label>
              <select
                {...register('prevalentStroke', { setValueAs: (v) => (v === '' ? undefined : v) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
              >
                <option value="">Select option</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
              {errors.prevalentStroke && (
                <p className="text-red-600 text-sm mt-1">{errors.prevalentStroke.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hypertension
              </label>
              <select
                {...register('prevalentHyp', { setValueAs: (v) => (v === '' ? undefined : v) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
              >
                <option value="">Select option</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
              {errors.prevalentHyp && (
                <p className="text-red-600 text-sm mt-1">{errors.prevalentHyp.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diabetes
              </label>
              <select
                {...register('diabetes', { setValueAs: (v) => (v === '' ? undefined : v) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
              >
                <option value="">Select option</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
              {errors.diabetes && (
                <p className="text-red-600 text-sm mt-1">{errors.diabetes.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-6 py-4 rounded-2xl font-semibold 
                     shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 
                     focus:outline-none focus:ring-4 focus:ring-red-500 focus:ring-opacity-50 disabled:transform-none"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Calculating...
              </span>
            ) : (
              'Calculate Risk'
            )}
          </button>
          
          <button
            type="button"
            onClick={handleReset}
            className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-6 py-4 rounded-2xl font-semibold 
                     transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Reset Form
          </button>
        </div>
      </form>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
        <div className="text-yellow-800 text-sm">
          <strong>Note:</strong> Fields marked with * are required. Optional fields can be left empty and the model will handle missing values appropriately.
        </div>
      </div>
    </div>
  );
}