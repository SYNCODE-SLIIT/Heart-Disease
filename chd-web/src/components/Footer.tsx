export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="mb-4">
            <p className="text-lg font-semibold text-gray-900">HeartSense</p>
            <p className="text-sm text-gray-600 mt-1">
              10-year Coronary Heart Disease Risk Assessment Tool
            </p>
          </div>
          
          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-500">
              <strong className="text-red-600">⚠️ Important Disclaimer:</strong> This tool is for educational and research purposes only. 
              It is NOT intended as medical advice, diagnosis, or treatment. Always consult with qualified healthcare professionals 
              for medical decisions.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              © 2024 HeartSense. Built with Random Forest ML model for research purposes.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}