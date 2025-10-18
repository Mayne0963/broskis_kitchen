'use client';

import { usePWAInstall } from '@/hooks/usePWAInstall';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Share, Plus, Home } from 'lucide-react';

export function PWAInstallPrompt() {
  const { shouldShow, supportsInstall, isIOS, install, markDismissed } = usePWAInstall();

  if (!shouldShow) return null;

  const handleInstall = async () => {
    if (supportsInstall) {
      await install();
    } else {
      markDismissed();
    }
  };

  return (
    <Dialog open={shouldShow} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-[#C1272D]" />
            Install Broski&apos;s as an App
          </DialogTitle>
          <DialogDescription>
            Get the full Broski&apos;s Kitchen experience with our app!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {supportsInstall ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Install our app for faster access, offline browsing, and a better experience.
              </p>
              <div className="flex gap-2">
                <Button onClick={handleInstall} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Add to Home Screen
                </Button>
                <Button variant="outline" onClick={markDismissed}>
                  Maybe Later
                </Button>
              </div>
            </div>
          ) : isIOS ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                To install Broski&apos;s Kitchen on your iPhone:
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-[#C1272D] text-white rounded-full flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span>Tap the</span>
                    <Share className="h-4 w-4" />
                    <span>Share button below</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-[#C1272D] text-white rounded-full flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span>Scroll down and tap</span>
                    <Plus className="h-4 w-4" />
                    <span>&quot;Add to Home Screen&quot;</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-[#C1272D] text-white rounded-full flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span>Tap &quot;Add&quot; to install</span>
                    <Home className="h-4 w-4" />
                  </div>
                </div>
              </div>
              <Button onClick={markDismissed} variant="outline" className="w-full">
                Got it!
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Your browser doesn&apos;t support app installation, but you can still bookmark us for quick access!
              </p>
              <Button onClick={markDismissed} variant="outline" className="w-full">
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Export as default for layout.tsx
export default PWAInstallPrompt;