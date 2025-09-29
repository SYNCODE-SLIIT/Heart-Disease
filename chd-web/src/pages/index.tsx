import Head from 'next/head';
import Link from 'next/link';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import Hero from '../components/Hero';

export default function Home() {
  return (
    <>
      <Head>
        <title>HeartSense - 10-year Coronary Heart Disease Risk Assessment</title>
        <meta name="description" content="Advanced machine learning tool for assessing 10-year coronary heart disease risk based on clinical and lifestyle factors." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/heart_icon.svg" />
      </Head>

      <div className="min-h-screen flex flex-col">
        <Nav />
        
        <main className="flex-grow">
          <Hero />
          
          {/* Additional sections */}
          <div className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  How It Works
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Our HeartSense tool uses advanced machine learning to analyze multiple health factors 
                  and provide personalized cardiovascular risk assessment.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-red-600 text-2xl font-bold">1</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Input Your Data</h3>
                  <p className="text-gray-600">
                    Provide your health information including demographics, vital signs, 
                    lab values, and medical history.
                  </p>
                </div>

                <div className="text-center">
                  <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-red-600 text-2xl font-bold">2</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Analysis</h3>
                  <p className="text-gray-600">
                    Our Random Forest model processes your data using patterns learned 
                    from cardiovascular research datasets.
                  </p>
                </div>

                <div className="text-center">
                  <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-red-600 text-2xl font-bold">3</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Get Results</h3>
                  <p className="text-gray-600">
                    Receive your personalized 10-year CHD risk probability with 
                    detailed breakdown and risk classification.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gray-50 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Ready to Assess Your Risk?
              </h2>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                Take control of your cardiovascular health with our evidence-based risk assessment tool.
              </p>
              <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
                <Link
                  href="/predictor"
                  className="inline-block bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-2xl font-semibold 
                           shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
                >
                  Start Risk Assessment
                </Link>
                <Link
                  href="/about"
                  className="inline-block bg-gray-100 hover:bg-gray-200 text-gray-900 px-8 py-4 rounded-2xl font-semibold 
                           transition-colors duration-200"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}