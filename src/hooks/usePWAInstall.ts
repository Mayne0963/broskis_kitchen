'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      if (typeof window !== 'undefined') {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        const isInWebAppiOS = (window.navigator as any).standalone === true;
        setIsInstalled(isStandalone || isInWebAppiOS);
      }
    };

    // Check if device is iOS
    const checkIfIOS = () => {
      if (typeof window !== 'undefined') {
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIOSDevice);
      }
    };

    checkIfInstalled();
    checkIfIOS();

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Save the event so it can be triggered later
      setDeferredPrompt(e);
      // Show the install prompt if not already installed
      if (!isInstalled) {
        setShouldShow(true);
      }
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShouldShow(false);
      setDeferredPrompt(null);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);

      // For iOS devices, show the prompt if not installed
      if (isIOS && !isInstalled) {
        setShouldShow(true);
      }
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      }
    };
  }, [isInstalled, isIOS]);

  const install = async () => {
    if (!deferredPrompt) return;

    try {
      // Show the install prompt
      await deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setShouldShow(false);
      } else {
        console.log('User dismissed the install prompt');
      }
      
      // Clear the deferredPrompt
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error during PWA installation:', error);
    }
  };

  const markDismissed = () => {
    setShouldShow(false);
  };

  const supportsInstall = deferredPrompt !== null || isIOS;

  return {
    shouldShow,
    supportsInstall,
    isIOS,
    isInstalled,
    install,
    markDismissed,
    deferredPrompt
  };
}