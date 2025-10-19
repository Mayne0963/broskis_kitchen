import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Digital Accessibility',
  description: 'Learn about Broski\'s Kitchen\'s commitment to digital accessibility and how we ensure our services are available to everyone.',
};

const AccessibilityPage = () => {
  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Skip to main content link for screen readers */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-amber-400 text-black px-4 py-2 rounded z-50"
        aria-label="Skip to main content"
      >
        Skip to main content
      </a>
      
      <main id="main-content" className="pt-16 pb-20 container mx-auto px-4 space-y-12 max-w-4xl">
        {/* Title */}
        <header className="space-y-2 text-center">
          <h1 className="text-4xl font-bold" id="page-title">Digital Accessibility</h1>
          <p className="text-sm text-muted" aria-describedby="page-title">Broski&apos;s Kitchen is built for everyone</p>
        </header>

        {/* I. Digital Accessibility Commitment */}
        <section className="space-y-4" aria-labelledby="commitment-heading">
          <h2 id="commitment-heading" className="text-2xl font-semibold">I. Our Accessibility Commitment</h2>
          <p className="leading-relaxed">
            At Broskis Kitchen, we build legacies—and we build them for all. Our digital
            experiences adhere to the W3C&apos;s Web Content Accessibility Guidelines (WCAG). We
            continually test our sites and apps with real assistive technology (screen readers,
            switch devices, voice control) and with users who rely on these tools every day.
          </p>
        </section>

        {/* II. How to Request Assistance */}
        <section className="space-y-4" aria-labelledby="assistance-heading">
          <h2 id="assistance-heading" className="text-2xl font-semibold">II. How to Request Assistance</h2>
          <p className="leading-relaxed">
            If you or someone you assist encounters difficulty navigating our menus, placing an
            order, or engaging with any Broskis Kitchen channel, please contact our Digital
            Accessibility team at{' '}
            <a
              href="mailto:accessibility@broskiskitchen.com"
              className="text-amber-400 hover:underline focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-black"
              aria-label="Email accessibility team at accessibility@broskiskitchen.com"
            >
              accessibility@broskiskitchen.com
            </a>
            . In your message, include:
          </p>
          <ul className="list-disc list-inside leading-relaxed space-y-1">
            <li>Your contact information</li>
            <li>The web address or app screen where you experienced an issue</li>
            <li>The assistive technology or device you were using</li>
          </ul>
          <p className="leading-relaxed text-muted">
            Note: This inbox is monitored solely for accessibility issues. For other feedback,
            please visit our Customer Service page.
          </p>
        </section>

        {/* III. Inclusive Ordering */}
        <section className="space-y-4" aria-labelledby="ordering-heading">
          <h2 id="ordering-heading" className="text-2xl font-semibold">III. Inclusive Ordering</h2>
          <p className="leading-relaxed">
            Whether you order via the Broskis Kitchen app, website, in-store counter, or drive-thru,
            we offer accessible options:
          </p>
          <ul className="list-disc list-inside leading-relaxed space-y-1">
            <li>
              <strong>Accessible App & Site:</strong> Screen-reader friendly, full keyboard
              navigation, and high-contrast mode.
            </li>
            <li>
              <strong>Kiosk-Free Counter:</strong> If you prefer not to use touchscreens, our crew
              will take your order directly.
            </li>
            <li>
              <strong>Drive-Thru Support:</strong> For speech or hearing disabilities, pull up to
              the window and we&apos;ll assist you.
            </li>
          </ul>
        </section>

        {/* IV. Alternate Menu Formats */}
        <section className="space-y-4" aria-labelledby="menu-formats-heading">
          <h2 id="menu-formats-heading" className="text-2xl font-semibold">IV. Alternate Menu Formats</h2>
          <ul className="list-disc list-inside leading-relaxed space-y-1">
            <li>Large-print menus available in-store upon request</li>
            <li>Picture-based guides for quick visual ordering</li>
            <li>Audio menu via our app&apos;s &quot;Listen Mode&quot;</li>
          </ul>
        </section>

        {/* V. Recording Notice */}
        <section className="space-y-4" aria-labelledby="recording-heading">
          <h2 id="recording-heading" className="text-2xl font-semibold">V. Recording Notice</h2>
          <p className="leading-relaxed">
            We capture video at pickup windows and in cooking areas for service improvement,
            technology R&amp;D, and safety compliance. For details, see our Recording Notice FAQ.
          </p>
        </section>

        {/* Footer */}
        <footer className="mt-12 border-t pt-6 text-center">
          <p className="leading-relaxed">
            If you encounter barriers, we&apos;re here to decode and elevate. Reach out anytime at{' '}
            <a
              href="mailto:accessibility@broskiskitchen.com"
              className="text-amber-400 hover:underline focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-black"
              aria-label="Email accessibility team at accessibility@broskiskitchen.com"
            >
              accessibility@broskiskitchen.com
            </a>
            .
          </p>
        </footer>
      </main>
    </div>
  );
};

export default AccessibilityPage;
