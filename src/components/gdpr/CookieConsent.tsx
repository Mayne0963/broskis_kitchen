'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  Cookie, 
  Settings, 
  X, 
  Shield, 
  BarChart3, 
  Target,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'

interface CookiePreferences {
  essential: boolean
  analytics: boolean
  marketing: boolean
  personalization: boolean
}

const COOKIE_CONSENT_KEY = 'broski-cookie-consent'
const COOKIE_PREFERENCES_KEY = 'broski-cookie-preferences'

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Always true, cannot be disabled
    analytics: false,
    marketing: false,
    personalization: false
  })

  useEffect(() => {
    // Check if user has already made a choice
    const hasConsent = localStorage.getItem(COOKIE_CONSENT_KEY)
    const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY)
    
    if (!hasConsent) {
      // Show banner after a short delay
      const timer = setTimeout(() => {
        setShowBanner(true)
      }, 2000)
      
      return () => clearTimeout(timer)
    } else if (savedPreferences) {
      // Load saved preferences
      try {
        const parsed = JSON.parse(savedPreferences)
        setPreferences(parsed)
      } catch (error) {
        console.error('Error parsing cookie preferences:', error)
      }
    }
  }, [])

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      essential: true,
      analytics: true,
      marketing: true,
      personalization: true
    }
    
    savePreferences(allAccepted)
    setShowBanner(false)
    setShowSettings(false)
  }

  const handleAcceptSelected = () => {
    savePreferences(preferences)
    setShowBanner(false)
    setShowSettings(false)
  }

  const handleRejectAll = () => {
    const essentialOnly: CookiePreferences = {
      essential: true,
      analytics: false,
      marketing: false,
      personalization: false
    }
    
    savePreferences(essentialOnly)
    setShowBanner(false)
    setShowSettings(false)
  }

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true')
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs))
    setPreferences(prefs)
    
    // Apply preferences to actual tracking
    applyTrackingPreferences(prefs)
  }

  const applyTrackingPreferences = (prefs: CookiePreferences) => {
    // TODO: Implement actual tracking control
    // For example:
    // - Enable/disable Google Analytics
    // - Enable/disable marketing pixels
    // - Enable/disable personalization cookies
    
    console.log('Applying tracking preferences:', prefs)
    
    // Example: Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        'analytics_storage': prefs.analytics ? 'granted' : 'denied',
        'ad_storage': prefs.marketing ? 'granted' : 'denied',
        'personalization_storage': prefs.personalization ? 'granted' : 'denied'
      })
    }
  }

  const updatePreference = (key: keyof CookiePreferences, value: boolean) => {
    if (key === 'essential') return // Cannot disable essential cookies
    
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }))
  }

  if (!showBanner) return null

  return (
    <>
      {/* Cookie Banner */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50">
        <Card className="max-w-4xl shadow-lg border-2 bg-black text-white">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Cookie className="h-8 w-8 text-amber-600" />
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">
                  We use cookies to enhance your experience
                </h3>
                <p className="text-sm text-gray-300 mb-4">
                  We use essential cookies to make our site work. We&apos;d also like to set optional cookies to help us improve our website and analyze how it&apos;s used. We won&apos;t set optional cookies unless you enable them.
                </p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    Essential cookies always active
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <BarChart3 className="h-3 w-3 mr-1" />
                    Analytics optional
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Target className="h-3 w-3 mr-1" />
                    Marketing optional
                  </Badge>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleAcceptAll} size="sm">
                    Accept All
                  </Button>
                  <Button onClick={handleRejectAll} variant="outline" size="sm">
                    Reject Optional
                  </Button>
                  <Button 
                    onClick={() => setShowSettings(true)} 
                    variant="outline" 
                    size="sm"
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Customize
                  </Button>
                  <Link href="/privacy" className="text-xs text-blue-400 hover:underline self-center">
                    Privacy Policy
                  </Link>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBanner(false)}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cookie Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-black text-white border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Cookie Preferences</h2>
                  <p className="text-sm text-gray-300">
                    Choose which cookies you&apos;d like to accept
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-6">
                {/* Essential Cookies */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      <h3 className="font-medium">Essential Cookies</h3>
                      <Badge variant="secondary" className="text-xs">Required</Badge>
                    </div>
                    <p className="text-sm text-gray-300">
                      These cookies are necessary for the website to function and cannot be switched off. They are usually only set in response to actions made by you which amount to a request for services.
                    </p>
                    <div className="mt-2 text-xs text-gray-400">
                      Examples: Authentication, security, shopping cart
                    </div>
                  </div>
                  <div className="ml-4">
                    <Switch 
                      checked={preferences.essential} 
                      disabled={true}
                    />
                  </div>
                </div>
                
                {/* Analytics Cookies */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      <h3 className="font-medium">Analytics Cookies</h3>
                      <Badge variant="outline" className="text-xs">Optional</Badge>
                    </div>
                    <p className="text-sm text-gray-300">
                      These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.
                    </p>
                    <div className="mt-2 text-xs text-gray-400">
                      Examples: Google Analytics, page views, user behavior
                    </div>
                  </div>
                  <div className="ml-4">
                    <Switch 
                      checked={preferences.analytics} 
                      onCheckedChange={(checked) => updatePreference('analytics', checked)}
                    />
                  </div>
                </div>
                
                {/* Marketing Cookies */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-5 w-5 text-purple-600" />
                      <h3 className="font-medium">Marketing Cookies</h3>
                      <Badge variant="outline" className="text-xs">Optional</Badge>
                    </div>
                    <p className="text-sm text-gray-300">
                      These cookies are used to track visitors across websites to display relevant advertisements and measure campaign effectiveness.
                    </p>
                    <div className="mt-2 text-xs text-gray-400">
                      Examples: Facebook Pixel, Google Ads, retargeting
                    </div>
                  </div>
                  <div className="ml-4">
                    <Switch 
                      checked={preferences.marketing} 
                      onCheckedChange={(checked) => updatePreference('marketing', checked)}
                    />
                  </div>
                </div>
                
                {/* Personalization Cookies */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-orange-600" />
                      <h3 className="font-medium">Personalization Cookies</h3>
                      <Badge variant="outline" className="text-xs">Optional</Badge>
                    </div>
                    <p className="text-sm text-gray-300">
                      These cookies enable enhanced functionality and personalization, such as remembering your preferences and customizing content.
                    </p>
                    <div className="mt-2 text-xs text-gray-400">
                      Examples: Language preferences, customized recommendations
                    </div>
                  </div>
                  <div className="ml-4">
                    <Switch 
                      checked={preferences.personalization} 
                      onCheckedChange={(checked) => updatePreference('personalization', checked)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 mt-8">
                <Button onClick={handleAcceptSelected} className="flex-1">
                  Save Preferences
                </Button>
                <Button onClick={handleAcceptAll} variant="outline">
                  Accept All
                </Button>
                <Button onClick={handleRejectAll} variant="outline">
                  Reject Optional
                </Button>
              </div>
              
              <div className="mt-4 text-center">
                <Link href="/privacy" className="text-xs text-blue-400 hover:underline">
                  Read our full Privacy Policy
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}