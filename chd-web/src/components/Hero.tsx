import Link from 'next/link';

export default function Hero() {
  return (
    <div className="bg-gradient-to-br from-red-50 to-red-100 py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
            <span className="text-red-600">10-year</span> Coronary Heart Disease
            <br />
            <span className="text-red-600">Risk Estimation</span>
          </h1>
          
          <p className="mt-6 text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Advanced machine learning model to assess your cardiovascular risk profile 
            based on clinical and lifestyle factors.
          </p>
          
          <div className="mt-10">
            <Link
              href="/predictor"
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-2xl text-lg font-semibold 
                       shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 
                       focus:outline-none focus:ring-4 focus:ring-red-500 focus:ring-opacity-50"
            >
              Calculate Risk Now →
            </Link>
          </div>
          
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="text-red-600 text-3xl mb-3">🏥</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Clinical Data</h3>
              <p className="text-gray-600 text-sm">
                Uses medical history, blood pressure, cholesterol levels, and other clinical indicators
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="text-red-600 text-3xl mb-3">🤖</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered</h3>
              <p className="text-gray-600 text-sm">
                Random Forest machine learning model trained on cardiovascular research data
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="text-red-600 text-3xl mb-3">⚡</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Instant Results</h3>
              <p className="text-gray-600 text-sm">
                Get immediate risk assessment with detailed breakdown and recommendations
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}