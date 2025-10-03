import Head from 'next/head';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy & Terms - HeartSense</title>
        <meta name="description" content="Privacy policy and terms of use for the HeartSense tool." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/heart_icon.svg" />
      </Head>

      <div className="min-h-screen flex flex-col bg-gray-50">
        <Nav />
        
        <main className="flex-grow py-8">
          {/* Shared narrow content wrapper: keep in sync with about page */}
          <div className="max-w-3xl mx-auto px-3 sm:px-4 lg:px-6">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Privacy & <span className="text-red-600">Terms</span>
              </h1>
              <p className="text-xl text-gray-600">
                Your privacy and understanding of our service
              </p>
            </div>

            <div className="space-y-12">
              {/* Privacy Policy */}
              <section className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="text-red-600 text-3xl mr-3">🔒</span>
                  Privacy Policy
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Data Collection</h3>
                    <p className="text-gray-600 mb-3">
                      HeartSense is designed with privacy in mind. Here&apos;s what you need to know about your data:
                    </p>
                    <ul className="text-gray-600 space-y-2 text-sm ml-4">
                      <li>• <strong>No Account System:</strong> We do not require registration or account creation</li>
                      <li>• <strong>Temporary Processing:</strong> Health data is processed in real-time and not stored permanently</li>
                      <li>• <strong>No Server Storage:</strong> Your health information is not saved on our servers</li>
                      <li>• <strong>Local Session Only:</strong> Data exists only during your browser session</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">How We Handle Your Information</h3>
                    <div className="bg-green-50 rounded-xl p-4">
                      <ul className="text-green-700 space-y-1 text-sm">
                        <li>✅ Health data is processed locally in your browser when possible</li>
                        <li>✅ API calls are made over encrypted HTTPS connections</li>
                        <li>✅ Predictions are calculated and returned immediately</li>
                        <li>✅ No tracking cookies or persistent identifiers are used</li>
                        <li>✅ No third-party analytics or advertising services</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Technical Safeguards</h3>
                    <p className="text-gray-600 text-sm">
                      Our application uses industry-standard security practices including encrypted data transmission, 
                      secure API endpoints, and minimal data retention policies to protect your privacy.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Contact Information</h3>
                    <p className="text-gray-600 text-sm">
                      For privacy questions or concerns, please contact us at: <strong>privacy@heartsense.example.com</strong>
                    </p>
                  </div>
                </div>
              </section>

              {/* Terms of Use */}
              <section className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="text-red-600 text-3xl mr-3">📜</span>
                  Terms of Use
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Acceptance of Terms</h3>
                    <p className="text-gray-600 text-sm">
                      By using HeartSense, you acknowledge and agree to these terms. 
                      If you do not agree with any part of these terms, please do not use our service.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Service Description</h3>
                    <p className="text-gray-600 text-sm mb-3">
                      HeartSense is an educational and research tool that uses machine learning 
                      to estimate 10-year coronary heart disease risk based on provided health information.
                    </p>
                    <ul className="text-gray-600 space-y-1 text-sm ml-4">
                      <li>• The service is provided free of charge</li>
                      <li>• Results are for educational purposes only</li>
                      <li>• No personal data is stored or tracked</li>
                      <li>• Service availability is not guaranteed</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">User Responsibilities</h3>
                    <ul className="text-gray-600 space-y-1 text-sm ml-4">
                      <li>• Provide accurate health information for reliable predictions</li>
                      <li>• Understand that results are estimates, not medical diagnoses</li>
                      <li>• Use the service responsibly and not for commercial purposes</li>
                      <li>• Respect the educational nature of the tool</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Limitations of Liability</h3>
                    <p className="text-gray-600 text-sm">
                      This service is provided &quot;as is&quot; without warranties of any kind. We are not liable for 
                      any decisions made based on the predictions provided by this tool.
                    </p>
                  </div>
                </div>
              </section>

              {/* Medical Disclaimer */}
              <section className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="text-red-600 text-3xl mr-3">⚕️</span>
                  Medical Disclaimer
                </h2>
                
                <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-xl">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-red-800 text-lg">🚨 Not Medical Advice</h3>
                    
                    <div className="text-red-700 text-sm space-y-3">
                      <p>
                        <strong>This tool is NOT intended as medical advice, diagnosis, or treatment.</strong> 
                        HeartSense is designed exclusively for educational and research purposes.
                      </p>
                      
                      <p>
                        <strong>Always consult with qualified healthcare professionals</strong> for:
                      </p>
                      <ul className="ml-4 space-y-1">
                        <li>• Medical advice and treatment decisions</li>
                        <li>• Interpretation of your cardiovascular risk</li>
                        <li>• Personalized risk management strategies</li>
                        <li>• Any health concerns or symptoms</li>
                      </ul>
                      
                      <p>
                        <strong>Never delay or replace professional medical consultation</strong> based on 
                        results from this predictive tool. Your healthcare provider has access to your 
                        complete medical history and can provide personalized, evidence-based recommendations.
                      </p>
                      
                      <p className="font-semibold">
                        If you are experiencing chest pain, shortness of breath, or other cardiac symptoms, 
                        seek immediate emergency medical attention.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Updates and Changes */}
              <section className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="text-red-600 text-3xl mr-3">🔄</span>
                  Updates and Changes
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Policy Updates</h3>
                    <p className="text-gray-600 text-sm">
                      We may update these privacy and terms policies periodically to reflect changes in our 
                      service or legal requirements. Significant changes will be communicated through our website.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Service Changes</h3>
                    <p className="text-gray-600 text-sm">
                      We reserve the right to modify, suspend, or discontinue the service at any time. 
                      As this is a research tool, continuous availability is not guaranteed.
                    </p>
                  </div>
                  
                  <div className="text-center pt-6 border-t border-gray-200">
                    <p className="text-gray-500 text-xs">
                      Last updated: December 2024<br />
                      HeartSense v1.0
                    </p>
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