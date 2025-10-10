import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Coming Soon - Broski\'s Kitchen',
  description: 'This feature is coming soon to Broski\'s Kitchen',
}

export default function ComingSoonPage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* Logo/Brand */}
        <div className="space-y-4">
          <h1 className="text-6xl md:text-8xl font-bold text-yellow-400 mb-4">
            REWARDS
          </h1>
        </div>

        {/* Coming Soon Message */}
        <div className="space-y-6">
          <h3 className="text-4xl md:text-5xl font-bold text-yellow-400">
            Coming Soon
          </h3>
          <p className="text-xl md:text-2xl text-gray-300 leading-relaxed">
            We're cooking up something special! This feature will be available soon.
          </p>
          <p className="text-lg text-yellow-400 font-semibold">
            Expected: Early 2026
          </p>
        </div>

        {/* Call to Action */}
        <div className="space-y-6">
          <div className="bg-yellow-400 text-black px-8 py-4 rounded-lg inline-block font-bold text-lg hover:bg-yellow-300 transition-colors cursor-pointer">
            <a href="/">Return to Home</a>
          </div>
          
          <div className="text-gray-400">
            <p>Follow us for updates:</p>
            <div className="flex justify-center space-x-6 mt-4">
              <span className="text-yellow-400 hover:text-yellow-300 cursor-pointer">Instagram</span>
              <span className="text-yellow-400 hover:text-yellow-300 cursor-pointer">Twitter</span>
              <span className="text-yellow-400 hover:text-yellow-300 cursor-pointer">Facebook</span>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-yellow-400 rounded-full opacity-50"></div>
          <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-yellow-400 rounded-full opacity-30"></div>
          <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-yellow-400 rounded-full opacity-40"></div>
        </div>
      </div>
    </div>
  )
}