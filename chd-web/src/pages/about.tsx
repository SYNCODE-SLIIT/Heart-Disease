import Head from 'next/head';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

export default function About() {
  return (
    <>
      <Head>
        <title>About - HeartSense Methodology</title>
        <meta name="description" content="Learn about the methodology, model, and data behind our HeartSense risk prediction tool." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/heart_icon.svg" />
      </Head>

      <div className="min-h-screen flex flex-col bg-gray-50">
        <Nav />
        
        <main className="flex-grow py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                About Our <span className="text-red-600">Methodology</span>
              </h1>
              <p className="text-xl text-gray-600">
                Understanding the science and technology behind CHD risk prediction
              </p>
            </div>

            <div className="space-y-12">
              {/* Dataset Section */}
              <section className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="text-red-600 text-3xl mr-3">📊</span>
                  Dataset & Features
                </h2>
                
                <p className="text-gray-600 mb-6">
                  Our model is trained on cardiovascular health data following the Framingham Heart Study approach, 
                  incorporating both demographic and clinical risk factors for comprehensive assessment.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Demographics</h3>
                    <ul className="text-gray-600 space-y-1 text-sm">
                      <li>• Age (years)</li>
                      <li>• Gender (Male/Female)</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Vital Signs</h3>
                    <ul className="text-gray-600 space-y-1 text-sm">
                      <li>• Systolic Blood Pressure (mmHg)</li>
                      <li>• Pulse Pressure (mmHg)</li>
                      <li>• Body Mass Index (kg/m²)</li>
                      <li>• Heart Rate (bpm)</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Laboratory Values</h3>
                    <ul className="text-gray-600 space-y-1 text-sm">
                      <li>• Total Cholesterol (mg/dL)</li>
                      <li>• Glucose (mg/dL)</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Medical History</h3>
                    <ul className="text-gray-600 space-y-1 text-sm">
                      <li>• Cigarettes per Day</li>
                      <li>• Current Smoking Status</li>
                      <li>• BP Medication Use</li>
                      <li>• Previous Stroke</li>
                      <li>• Hypertension History</li>
                      <li>• Diabetes Status</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Preprocessing Section */}
              <section className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="text-red-600 text-3xl mr-3">⚙️</span>
                  Data Preprocessing
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Feature Engineering</h3>
                    <p className="text-gray-600 text-sm">
                      <strong>Pulse Pressure Derivation:</strong> When not directly provided, pulse pressure is calculated 
                      as the difference between systolic and diastolic blood pressure, providing important cardiovascular insights.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Data Validation & Capping</h3>
                    <p className="text-gray-600 text-sm">
                      Extreme values are identified and capped to reasonable physiological ranges to prevent model bias. 
                      Missing values are handled through intelligent imputation based on population norms and correlated features.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Standardization</h3>
                    <p className="text-gray-600 text-sm">
                      Categorical variables are encoded appropriately (gender, yes/no responses), while continuous variables 
                      are scaled to ensure optimal model performance across different feature ranges.
                    </p>
                  </div>
                </div>
              </section>

              {/* Model Section */}
              <section className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="text-red-600 text-3xl mr-3">🤖</span>
                  Machine Learning Model
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Random Forest Algorithm</h3>
                    <p className="text-gray-600 mb-3">
                      We use a Random Forest classifier, an ensemble learning method that combines multiple decision trees 
                      to provide robust and interpretable predictions for cardiovascular risk assessment.
                    </p>
                    
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Why Random Forest?</h4>
                      <ul className="text-gray-600 space-y-1 text-sm">
                        <li>• <strong>High Accuracy:</strong> Excellent performance on healthcare prediction tasks</li>
                        <li>• <strong>Handles Missing Data:</strong> Robust to incomplete patient information</li>
                        <li>• <strong>Feature Importance:</strong> Provides insights into which factors drive risk</li>
                        <li>• <strong>Reduced Overfitting:</strong> Ensemble approach prevents model complexity issues</li>
                        <li>• <strong>Interpretability:</strong> Medical professionals can understand decision pathways</li>
                      </ul>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-green-50 rounded-xl p-4">
                      <h4 className="font-semibold text-green-800 mb-2">Model Performance</h4>
                      <ul className="text-green-700 space-y-1 text-sm">
                        <li>• <strong>ROC AUC:</strong> 0.85+ (Excellent discrimination)</li>
                        <li>• <strong>PR-AUC:</strong> 0.70+ (Good precision-recall balance)</li>
                        <li>• <strong>Cross-validation:</strong> Consistent performance across folds</li>
                      </ul>
                    </div>

                    <div className="bg-blue-50 rounded-xl p-4">
                      <h4 className="font-semibold text-blue-800 mb-2">Threshold Policy</h4>
                      <p className="text-blue-700 text-sm mb-2">
                        <strong>Decision Threshold: 30%</strong>
                      </p>
                      <p className="text-blue-700 text-sm">
                        Optimized to balance sensitivity and specificity for clinical relevance, 
                        following cardiovascular risk assessment guidelines.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Model Card Section */}
              <section className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="text-red-600 text-3xl mr-3">📋</span>
                  Model Card
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Intended Use</h3>
                    <p className="text-gray-600 text-sm">
                      This model is designed for <strong>educational and research purposes</strong> to demonstrate 
                      machine learning applications in cardiovascular risk assessment. It is not intended for 
                      clinical decision-making or replacing professional medical evaluation.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Limitations</h3>
                    <ul className="text-gray-600 space-y-1 text-sm">
                      <li>• <strong>Population Bias:</strong> Model performance may vary across different demographic groups</li>
                      <li>• <strong>Temporal Validity:</strong> Risk factors and their relationships may change over time</li>
                      <li>• <strong>Missing Context:</strong> Cannot account for family history, genetic factors, or recent lifestyle changes</li>
                      <li>• <strong>Static Assessment:</strong> Provides point-in-time risk, not dynamic risk tracking</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Fairness Considerations</h3>
                    <p className="text-gray-600 text-sm">
                      We acknowledge that cardiovascular risk prediction can vary across different populations. 
                      Ongoing monitoring and validation across diverse groups is essential for equitable healthcare AI.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Model Monitoring</h3>
                    <p className="text-gray-600 text-sm">
                      Regular model validation and updates are necessary to maintain accuracy and relevance. 
                      Healthcare domain expertise should always guide model interpretation and application.
                    </p>
                  </div>
                </div>
              </section>

              {/* Technical Details */}
              <section className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="text-red-600 text-3xl mr-3">🔧</span>
                  Technical Implementation
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Technology Stack</h3>
                    <ul className="text-gray-600 space-y-1 text-sm">
                      <li>• <strong>ML Framework:</strong> scikit-learn</li>
                      <li>• <strong>Data Processing:</strong> pandas, numpy</li>
                      <li>• <strong>Backend:</strong> FastAPI (Python)</li>
                      <li>• <strong>Frontend:</strong> Next.js (TypeScript)</li>
                      <li>• <strong>Model Storage:</strong> joblib serialization</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Model Pipeline</h3>
                    <ul className="text-gray-600 space-y-1 text-sm">
                      <li>• Input validation and preprocessing</li>
                      <li>• Missing value imputation</li>
                      <li>• Feature scaling and encoding</li>
                      <li>• Random Forest prediction</li>
                      <li>• Probability calibration</li>
                      <li>• Threshold-based classification</li>
                    </ul>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}