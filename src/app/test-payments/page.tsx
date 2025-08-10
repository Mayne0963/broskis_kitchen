"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, Loader2, CreditCard, Smartphone, DollarSign } from 'lucide-react'
import { runPaymentSystemTests, testPaymentMethod, paymentHealthCheck, validatePaymentEnvironment } from '@/utils/paymentTesting'
import type { PaymentTestResult } from '@/utils/paymentTesting'

interface TestResult {
  name: string
  status: 'pending' | 'running' | 'success' | 'error'
  result?: PaymentTestResult
  icon: React.ComponentType<{ className?: string }>
}

export default function TestPaymentsPage() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Stripe Connection', status: 'pending', icon: CreditCard },
    { name: 'Apple Pay Availability', status: 'pending', icon: Smartphone },
    { name: 'Google Pay Availability', status: 'pending', icon: Smartphone },
    { name: 'CashApp Availability', status: 'pending', icon: DollarSign },
    { name: 'Payment Intent Creation', status: 'pending', icon: CreditCard },
    { name: 'Webhook Endpoint', status: 'pending', icon: CheckCircle }
  ])
  
  const [isRunning, setIsRunning] = useState(false)
  const [healthCheck, setHealthCheck] = useState<any>(null)
  const [envValidation, setEnvValidation] = useState<any>(null)

  useEffect(() => {
    // Validate environment on load
    const validation = validatePaymentEnvironment()
    setEnvValidation(validation)
  }, [])

  const runTests = async () => {
    setIsRunning(true)
    
    // Reset all tests to pending
    setTests(prev => prev.map(test => ({ ...test, status: 'pending' as const })))
    
    const testMethods = [
      'stripeConnection',
      'applePayAvailability', 
      'googlePayAvailability',
      'cashAppAvailability',
      'paymentIntentCreation',
      'webhookEndpoint'
    ]
    
    for (let i = 0; i < testMethods.length; i++) {
      const testName = testMethods[i]
      
      // Set current test to running
      setTests(prev => prev.map((test, index) => 
        index === i ? { ...test, status: 'running' as const } : test
      ))
      
      try {
        let result: PaymentTestResult
        
        switch (testName) {
          case 'stripeConnection':
            const { testStripeConnection } = await import('@/utils/paymentTesting')
            result = await testStripeConnection()
            break
          case 'applePayAvailability':
            const { testApplePayAvailability } = await import('@/utils/paymentTesting')
            result = await testApplePayAvailability()
            break
          case 'googlePayAvailability':
            const { testGooglePayAvailability } = await import('@/utils/paymentTesting')
            result = await testGooglePayAvailability()
            break
          case 'cashAppAvailability':
            const { testCashAppAvailability } = await import('@/utils/paymentTesting')
            result = await testCashAppAvailability()
            break
          case 'paymentIntentCreation':
            const { testPaymentIntentCreation } = await import('@/utils/paymentTesting')
            result = await testPaymentIntentCreation()
            break
          case 'webhookEndpoint':
            const { testWebhookEndpoint } = await import('@/utils/paymentTesting')
            result = await testWebhookEndpoint()
            break
          default:
            result = { success: false, error: 'Unknown test' }
        }
        
        // Update test result
        setTests(prev => prev.map((test, index) => 
          index === i ? { 
            ...test, 
            status: result.success ? 'success' as const : 'error' as const,
            result 
          } : test
        ))
        
      } catch (error) {
        setTests(prev => prev.map((test, index) => 
          index === i ? { 
            ...test, 
            status: 'error' as const,
            result: { 
              success: false, 
              error: error instanceof Error ? error.message : 'Test failed' 
            }
          } : test
        ))
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    // Run health check
    const health = await paymentHealthCheck()
    setHealthCheck(health)
    
    setIsRunning(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <div className="w-5 h-5 rounded-full bg-gray-600" />
      case 'running':
        return <Loader2 className="w-5 h-5 animate-spin text-yellow-500" />
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <div className="w-5 h-5 rounded-full bg-gray-600" />
    }
  }

  const successCount = tests.filter(test => test.status === 'success').length
  const errorCount = tests.filter(test => test.status === 'error').length
  const totalTests = tests.length

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold mb-4">Payment System Testing</h1>
          <p className="text-gray-400 mb-6">
            Verify that all payment methods are properly configured and working
          </p>
          
          {!isRunning && (
            <button
              onClick={runTests}
              className="bg-[#FFD700] text-black px-6 py-3 rounded-lg font-semibold hover:bg-[#FFD700]/90 transition-colors"
            >
              Run Payment Tests
            </button>
          )}
        </motion.div>

        {/* Environment Validation */}
        {envValidation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-gray-900 rounded-lg border border-gray-700"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
              Environment Validation
            </h2>
            
            <div className="space-y-2">
              <div className={`flex items-center ${envValidation.isValid ? 'text-green-400' : 'text-red-400'}`}>
                {envValidation.isValid ? <CheckCircle className="w-4 h-4 mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                Environment: {envValidation.isValid ? 'Valid' : 'Invalid'}
              </div>
              
              {envValidation.missing.length > 0 && (
                <div className="text-red-400">
                  Missing variables: {envValidation.missing.join(', ')}
                </div>
              )}
              
              {envValidation.warnings.map((warning: string, index: number) => (
                <div key={index} className="text-yellow-400">
                  ⚠️ {warning}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Test Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold mb-2">Test Results</h2>
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-green-400">✓ {successCount} Passed</span>
                <span className="text-red-400">✗ {errorCount} Failed</span>
                <span className="text-gray-400">{totalTests - successCount - errorCount} Pending</span>
              </div>
            </div>
            
            <div className="divide-y divide-gray-700">
              {tests.map((test, index) => {
                const Icon = test.icon
                return (
                  <motion.div
                    key={test.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5 text-gray-400" />
                      <span className="font-medium">{test.name}</span>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {test.result && test.status === 'error' && (
                        <span className="text-red-400 text-sm">{test.result.error}</span>
                      )}
                      {test.result && test.status === 'success' && test.result.details && (
                        <span className="text-green-400 text-sm">
                          {typeof test.result.details === 'object' 
                            ? Object.entries(test.result.details).map(([key, value]) => `${key}: ${value}`).join(', ')
                            : String(test.result.details)
                          }
                        </span>
                      )}
                      {getStatusIcon(test.status)}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </motion.div>

        {/* Health Check Results */}
        {healthCheck && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-900 rounded-lg border border-gray-700 p-6"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              {healthCheck.healthy ? (
                <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 mr-2 text-red-500" />
              )}
              Payment System Health: {healthCheck.healthy ? 'Healthy' : 'Issues Detected'}
            </h2>
            
            {healthCheck.issues.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-red-400 mb-2">Issues:</h3>
                <ul className="space-y-1">
                  {healthCheck.issues.map((issue: string, index: number) => (
                    <li key={index} className="text-red-300 text-sm">• {issue}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {healthCheck.recommendations.length > 0 && (
              <div>
                <h3 className="font-semibold text-blue-400 mb-2">Recommendations:</h3>
                <ul className="space-y-1">
                  {healthCheck.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="text-blue-300 text-sm">• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}

        {/* Progress Bar */}
        {isRunning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed bottom-4 right-4 bg-gray-900 border border-gray-700 rounded-lg p-4 min-w-[300px]"
          >
            <div className="flex items-center space-x-3 mb-2">
              <Loader2 className="w-5 h-5 animate-spin text-[#FFD700]" />
              <span className="font-medium">Running Tests...</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-[#FFD700] h-2 rounded-full transition-all duration-300"
                style={{ width: `${((successCount + errorCount) / totalTests) * 100}%` }}
              />
            </div>
            <div className="text-sm text-gray-400 mt-1">
              {successCount + errorCount} of {totalTests} tests completed
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}