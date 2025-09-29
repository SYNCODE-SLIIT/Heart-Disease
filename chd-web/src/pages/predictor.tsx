import { useState } from 'react';
import Head from 'next/head';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import PredictorForm from '../components/PredictorForm';
import ProbabilityCard from '../components/ProbabilityCard';
import { PredictOut } from '../lib/types';

export default function Predictor() {
  const [result, setResult] = useState<PredictOut | null>(null);

  const handleResult = (newResult: PredictOut) => {
    setResult(newResult);
    // Scroll to result
    setTimeout(() => {
      const resultElement = document.getElementById('prediction-result');
      if (resultElement) {
        resultElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  return (
    <>
      <Head>
        <title>Risk Predictor - HeartSense Assessment Tool</title>
        <meta name="description" content="Calculate your 10-year coronary heart disease risk using our advanced machine learning model." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/heart_icon.svg" />
      </Head>

      <div className="min-h-screen flex flex-col bg-gray-50">
        <Nav />
        
        <main className="flex-grow py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                <span className="text-red-600 font-bold">Heart</span>Sense
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Complete the form below to calculate your 10-year coronary heart disease risk probability. 
                Our AI model will analyze your health factors and provide a personalized assessment.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              {/* Form */}
              <div>
                <PredictorForm onResult={handleResult} />
              </div>

              {/* Results */}
              <div className="lg:sticky lg:top-8">
                {result ? (
                  <div id="prediction-result" className="space-y-6">
                    <ProbabilityCard result={result} />
                    
                    {/* Disclaimer */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
                      <div className="flex items-start">
                        <div className="text-yellow-600 text-2xl mr-3">⚠️</div>
                        <div>
                          <h3 className="font-semibold text-yellow-800 mb-2">Important Disclaimer</h3>
                          <p className="text-yellow-700 text-sm leading-relaxed">
                            This prediction is for <strong>educational and research purposes only</strong>. 
                            It should not be used as a substitute for professional medical advice, diagnosis, 
                            or treatment. Always consult with qualified healthcare providers for medical decisions 
                            and personalized cardiovascular risk management.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Next Steps */}
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                      <h3 className="font-semibold text-blue-800 mb-3">💡 Next Steps</h3>
                      <ul className="text-blue-700 text-sm space-y-2">
                        <li>• Discuss these results with your healthcare provider</li>
                        <li>• Consider lifestyle modifications if appropriate</li>
                        <li>• Follow up with regular health screenings</li>
                        <li>• Monitor and manage modifiable risk factors</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
                    <div className="text-gray-400 text-6xl mb-4">📊</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Your Results Will Appear Here
                    </h3>
                    <p className="text-gray-600">
                      Complete the form to the left to calculate your CHD risk probability.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}