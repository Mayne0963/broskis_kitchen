import React from 'react';

const TermsPage = () => {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <main className="pt-16 pb-20 container mx-auto px-4 space-y-12 max-w-4xl">
        {/* Title */}
        <header className="space-y-2 text-center">
          <h1 className="text-4xl font-bold">Terms and Conditions</h1>
          <p className="text-sm text-muted">Effective: July 12, 2025</p>
        </header>

        {/* Important Notice */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Important – Please Read Carefully</h2>
          <p className="leading-relaxed">
            These Terms and Conditions ("Terms") include an arbitration agreement, jury and
            class-action waivers, limitations of liability, and other provisions that affect your
            legal rights.
          </p>
          <p className="leading-relaxed">
            By installing, accessing, or using any of Broskis Kitchen LLC's online properties
            (websites, mobile apps, email newsletters, subscriptions, and other digital services),
            you agree to be bound by these Terms. Broskis Kitchen LLC ("we," "us") operates from
            [Your Address], Fort Wayne, Indiana.
          </p>
        </section>

        {/* 1. About the Online Services */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">1. About the Online Services</h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-medium">Availability of Products and Services</h3>
              <p className="leading-relaxed">
                Broskis Kitchen products and services may not be available in all regions.
                Descriptions in the Online Services are subject to local availability.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-medium">Use While Operating Vehicles</h3>
              <p className="leading-relaxed">
                Do <strong>not</strong> use the Online Services while driving or operating any vehicle.
                Safe use requires that you are not behind the wheel.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-medium">Your Devices and Accounts</h3>
              <ul className="list-disc list-inside leading-relaxed space-y-1">
                <li>
                  You are responsible for all devices, software, and data charges needed to access
                  the Online Services.
                </li>
                <li>We do not guarantee compatibility with every device or operating system.</li>
                <li>Keep your account credentials secure. Only one account per user is permitted.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-medium">Updates and Termination</h3>
              <p className="leading-relaxed">
                We may update, modify, or terminate the Online Services—or your access—at any time
                without notice. If you disagree with any changes, your sole remedy is to stop using
                the services.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-medium">Updates to These Terms</h3>
              <p className="leading-relaxed">
                We may revise these Terms at any time. Material changes will be posted via the Online
                Services. Continued use after changes constitutes acceptance.
              </p>
            </div>
          </div>
        </section>

        {/* 2. Communications and Privacy */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">2. Communications and Privacy</h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-medium">Communications</h3>
              <p className="leading-relaxed">
                By providing contact information, you consent to receive marketing, transactional,
                and other messages via email, SMS, or push notifications, as described in our Privacy
                Statement.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-medium">Opt-Out</h3>
              <p className="leading-relaxed">
                Manage your preferences in your account profile or by following unsubscribe
                instructions. For essential account notices, closing your account may be the only way
                to opt out.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Orders, Pickup, and Delivery */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">3. Orders, Pickup, and Delivery</h2>
          <p className="leading-relaxed">
            Applies to orders placed for pickup or delivery through the Online Services.
          </p>

          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-medium">Placing Orders</h3>
              <ul className="list-disc list-inside leading-relaxed space-y-1">
                <li>You must register an account and add a valid payment method.</li>
                <li>Pickup and delivery availability vary by location.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-medium">Payment Methods</h3>
              <p className="leading-relaxed">
                We partner with third-party payment processors. By registering a card, you authorize
                any necessary verification charges.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-medium">Merchant of Record</h3>
              <ul className="list-disc list-inside leading-relaxed space-y-1">
                <li>For pickup orders, Broskis Kitchen is the merchant of record.</li>
                <li>
                  For delivery orders, the fulfilling restaurant and any delivery partner are the
                  merchant(s) of record.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-medium">Cancellation and Refunds</h3>
              <p className="leading-relaxed">
                You may cancel or modify your order before final checkout. After payment, contact
                the restaurant or delivery partner for refunds. Your consumer rights are not limited
                by these Terms.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Deals, Promotions, and Loyalty Programs */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">4. Deals, Promotions, and Loyalty Programs</h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-medium">General Deals</h3>
              <p className="leading-relaxed">
                Deals and promotions are subject to availability, participating locations, and
                expiration upon redemption. Only one deal per order unless otherwise stated.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-medium">Loyalty Program</h3>
              <p className="leading-relaxed">
                Enrollment in our rewards program is governed by separate terms. Points have no
                cash value, are nontransferable, and expire if unused after six months.
              </p>
            </div>
          </div>
        </section>

        {/* 5. Intellectual Property */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">5. Intellectual Property</h2>
          <p className="leading-relaxed">
            All content, trademarks, and materials in the Online Services are owned by Broskis
            Kitchen or its licensors and are licensed—not sold—to you. We grant you a revocable,
            non-exclusive license to use the Online Services for personal, non-commercial purposes
            in compliance with these Terms.
          </p>
        </section>

        {/* 6. User Submissions */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">6. User Submissions</h2>
          <p className="leading-relaxed">
            By submitting any content (ideas, feedback, images), you grant Broskis Kitchen a
            perpetual, irrevocable, royalty-free license to use, reproduce, modify, and publish your
            submissions for any purpose.
          </p>
        </section>

        {/* 7. Acceptable Use */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">7. Acceptable Use</h2>
          <p className="leading-relaxed">You agree <strong>not</strong> to:</p>
          <ul className="list-disc list-inside leading-relaxed space-y-1">
            <li>Violate applicable laws or these Terms</li>
            <li>Reverse-engineer, decompile, or scrape the Online Services</li>
            <li>Use automated systems to access or extract data</li>
            <li>Interfere with the operation of the Online Services or its networks</li>
          </ul>
        </section>

        {/* 8. Disclaimers and Limitations */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">8. Disclaimers &amp; Limitations of Liability</h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-medium">Disclaimer</h3>
              <p className="leading-relaxed">The Online Services are provided "as is," without warranties.</p>
            </div>

            <div>
              <h3 className="text-xl font-medium">Limitation of Liability</h3>
              <p className="leading-relaxed">
                To the fullest extent permitted by law, Broskis Kitchen and its affiliates are not
                liable for any indirect, incidental, or consequential damages.
              </p>
            </div>
          </div>
        </section>

        {/* 9. Governing Law & Dispute Resolution */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">9. Governing Law &amp; Dispute Resolution</h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-medium">Arbitration</h3>
              <p className="leading-relaxed">
                You and Broskis Kitchen agree to resolve disputes through binding arbitration under
                the AAA Consumer Rules, waiving jury trial and class actions. Broskis Kitchen covers
                arbitration fees exceeding $200.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-medium">Opt-Out</h3>
              <p className="leading-relaxed">
                To opt-out, email{' '}
                <a href="mailto:arbitration-optout@broskiskitchen.com" className="text-amber-400 hover:underline">
                  arbitration-optout@broskiskitchen.com
                </a>{' '}
                within 30 days of first acceptance.
              </p>
            </div>
          </div>
        </section>

        {/* 10. Miscellaneous */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">10. Miscellaneous</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-medium">International Use</h3>
              <p className="leading-relaxed">
                If accessing from outside the U.S., you are responsible for compliance with local laws.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-medium">Severability</h3>
              <p className="leading-relaxed">
                If any provision is unenforceable, the remainder of these Terms remains in effect.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-medium">Assignment</h3>
              <p className="leading-relaxed">You may not assign these Terms without our prior written consent.</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-12 border-t pt-6 text-center">
          <p className="leading-relaxed">
            Questions? Contact us at{' '}
            <a href="mailto:support@broskiskitchen.com" className="text-amber-400 hover:underline">
              support@broskiskitchen.com
            </a>{' '}
            or visit our Contact Us page.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default TermsPage;
