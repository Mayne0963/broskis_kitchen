'use client';

import { PWAInstallPrompt } from '@/components/pwa/PWAManager';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export default function PWATestPage() {
  const { shouldShow, supportsInstall, isIOS, isInstalled } = usePWAInstall();

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">PWA Installation Test</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">PWA Status</h2>
          <div className="space-y-2">
            <p><strong>Should Show Prompt:</strong> {shouldShow ? 'Yes' : 'No'}</p>
            <p><strong>Supports Install:</strong> {supportsInstall ? 'Yes' : 'No'}</p>
            <p><strong>Is iOS:</strong> {isIOS ? 'Yes' : 'No'}</p>
            <p><strong>Is Installed:</strong> {isInstalled ? 'Yes' : 'No'}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <p className="mb-4">
            The PWA installation prompt should appear as a modal dialog if the conditions are met.
            It should only close when you explicitly click one of the buttons (Install, Maybe Later, Got it!, or Close).
          </p>
          <p className="text-sm text-gray-600">
            The prompt will not auto-dismiss when clicking outside the dialog or pressing the escape key.
          </p>
        </div>
      </div>

      {/* The PWA prompt component */}
      <PWAInstallPrompt />
    </div>
  );
}