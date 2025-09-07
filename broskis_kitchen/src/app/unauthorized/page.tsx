import Link from 'next/link'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-[var(--color-rich-black)] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <AlertTriangle className="h-24 w-24 text-blood-red mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-white mb-4">
            Access Denied
          </h1>
          <p className="text-gray-300 text-lg mb-2">
            You don't have permission to access this page.
          </p>
          <p className="text-gray-400 text-sm">
            Please contact your administrator if you believe this is an error.
          </p>
        </div>
        
        <div className="space-y-4">
          <Button 
            asChild
            className="w-full bg-gold-foil hover:bg-gold-foil/90 text-rich-black font-semibold"
          >
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Dashboard
            </Link>
          </Button>
          
          <Button 
            asChild
            variant="outline"
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <Link href="/auth/login">
              Sign In with Different Account
            </Link>
          </Button>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-700">
          <p className="text-gray-500 text-sm">
            Need help? Contact support at{' '}
            <a 
              href="mailto:support@broskiskitchen.com" 
              className="text-gold-foil hover:underline"
            >
              support@broskiskitchen.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}