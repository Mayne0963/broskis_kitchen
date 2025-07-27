'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Shield, Eye, Lock, UserCheck, Database, Mail } from 'lucide-react'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Privacy Policy
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Quick Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Quick Overview
            </CardTitle>
            <CardDescription>
              Here's what you need to know about your privacy at Broski's Kitchen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <Lock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Data Protection</h3>
                <p className="text-sm text-gray-600">We use industry-standard encryption to protect your data</p>
              </div>
              <div className="text-center">
                <UserCheck className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Your Control</h3>
                <p className="text-sm text-gray-600">You can access, update, or delete your data anytime</p>
              </div>
              <div className="text-center">
                <Database className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Minimal Collection</h3>
                <p className="text-sm text-gray-600">We only collect data necessary for our services</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Information We Collect */}
          <Card>
            <CardHeader>
              <CardTitle>1. Information We Collect</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Personal Information</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Name, email address, and phone number</li>
                  <li>Delivery addresses and payment information</li>
                  <li>Account preferences and order history</li>
                  <li>Communication preferences</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Usage Information</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>How you interact with our website and app</li>
                  <li>Pages visited and features used</li>
                  <li>Device information and IP address</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Location Information</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Delivery addresses you provide</li>
                  <li>General location for delivery estimates (with your consent)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* How We Use Information */}
          <Card>
            <CardHeader>
              <CardTitle>2. How We Use Your Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Service Delivery</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Process and fulfill your orders</li>
                  <li>Provide customer support</li>
                  <li>Send order confirmations and updates</li>
                  <li>Manage your account and preferences</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Improvement &amp; Personalization</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Improve our services and user experience</li>
                  <li>Personalize content and recommendations</li>
                  <li>Analyze usage patterns and trends</li>
                  <li>Develop new features and services</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Communication</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Send promotional offers (with your consent)</li>
                  <li>Notify you about menu drops and special events</li>
                  <li>Provide important service announcements</li>
                  <li>Respond to your inquiries and feedback</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Information Sharing */}
          <Card>
            <CardHeader>
              <CardTitle>3. Information Sharing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
              </p>
              
              <div>
                <h4 className="font-semibold mb-2">Service Providers</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Payment processors (Stripe) for transaction processing</li>
                  <li>Delivery partners for order fulfillment</li>
                  <li>Cloud service providers for data storage</li>
                  <li>Analytics providers for service improvement</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Legal Requirements</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>When required by law or legal process</li>
                  <li>To protect our rights and property</li>
                  <li>To ensure user safety and security</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card>
            <CardHeader>
              <CardTitle>4. Data Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                We implement appropriate technical and organizational measures to protect your personal information:
              </p>
              
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>SSL/TLS encryption for data transmission</li>
                <li>Secure data storage with encryption at rest</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication measures</li>
                <li>Employee training on data protection</li>
              </ul>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card>
            <CardHeader>
              <CardTitle>5. Your Rights and Choices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                You have the following rights regarding your personal information:
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Access &amp; Portability</h4>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>Request a copy of your data</li>
                    <li>Download your information</li>
                    <li>View your account details</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Control &amp; Deletion</h4>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>Update or correct your information</li>
                    <li>Delete your account and data</li>
                    <li>Opt-out of marketing communications</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>How to exercise your rights:</strong> Contact us at privacy@broskiskitchen.com or use the privacy controls in your account settings.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Cookies */}
          <Card>
            <CardHeader>
              <CardTitle>6. Cookies and Tracking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                We use cookies and similar technologies to enhance your experience:
              </p>
              
              <div>
                <h4 className="font-semibold mb-2">Essential Cookies</h4>
                <p className="text-gray-600 mb-2">Required for basic website functionality:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Authentication and security</li>
                  <li>Shopping cart functionality</li>
                  <li>Session management</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Analytics Cookies</h4>
                <p className="text-gray-600 mb-2">Help us understand how you use our site:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Page views and user interactions</li>
                  <li>Performance monitoring</li>
                  <li>Error tracking and debugging</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700">
                  You can manage your cookie preferences through your browser settings or our cookie consent banner.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Data Retention */}
          <Card>
            <CardHeader>
              <CardTitle>7. Data Retention</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                We retain your personal information only as long as necessary:
              </p>
              
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li><strong>Account Information:</strong> Until you delete your account</li>
                <li><strong>Order History:</strong> 7 years for tax and legal purposes</li>
                <li><strong>Marketing Data:</strong> Until you unsubscribe</li>
                <li><strong>Analytics Data:</strong> 26 months (anonymized)</li>
              </ul>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>8. Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </h4>
                  <p className="text-gray-600">privacy@broskiskitchen.com</p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Response Time</h4>
                  <p className="text-gray-600">We'll respond within 30 days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <Separator className="mb-6" />
          <p className="text-sm text-gray-500">
            This privacy policy is effective as of {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} and may be updated from time to time.
          </p>
        </div>
      </div>
    </div>
  )
}