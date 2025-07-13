import React from 'react';

const PrivacyPage = () => {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <main className="pt-16 pb-20 container mx-auto px-4 space-y-12 max-w-4xl">
        {/* Page Title */}
        <header className="space-y-2 text center">
          <h1 className="text-4xl font-bold">Privacy Statement</h1>
          <p className="text-sm text-muted">Last updated: July 12, 2025</p>
        </header>

        {/* I. Introduction */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">I. Introduction</h2>
          <p className="leading-relaxed">
            Your privacy matters. This Privacy Statement (“Statement”) describes how Broskis Kitchen LLC
            (“Broskis Kitchen,” “we,” “us”) collects, uses, stores, shares, and otherwise processes
            personal information of our customers who visit our restaurants, use our websites or mobile apps
            (“Online Services”), or otherwise interact with us.
          </p>
          <p className="leading-relaxed">
            If you reside outside the United States, please visit the country-specific section of our
            website for local addenda.
          </p>
        </section>

        {/* II. Information We Collect & Process */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">II. Information We Collect &amp; Process</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-medium">A. Information You Provide</h3>
              <ul className="list-disc list-inside mt-2 leading-relaxed space-y-1">
                <li><strong>Contact &amp; profile data:</strong> name, email, phone, address, birthday</li>
                <li><strong>Payment &amp; transaction data:</strong> card details, order history</li>
                <li><strong>Account credentials:</strong> usernames, passwords</li>
                <li><strong>Preferences &amp; feedback:</strong> liked products, survey responses</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-medium">B. Information Collected Automatically</h3>
              <ul className="list-disc list-inside mt-2 leading-relaxed space-y-1">
                <li>IP address, browser &amp; OS data</li>
                <li>App &amp; website usage (pages, clicks, session lengths)</li>
                <li>Location data (if enabled)</li>
                <li>Cookies, web beacons, pixels (see Section VI)</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-medium">C. Information from Third Parties</h3>
              <p className="mt-2 leading-relaxed">
                We supplement our data with information from payment processors, analytics providers,
                marketing partners, and public sources.
              </p>
            </div>
          </div>
        </section>

        {/* III. How We Use Your Information */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">III. How We Use Your Information</h2>
          <ul className="list-decimal list-inside mt-2 leading-relaxed space-y-1">
            <li>Provide &amp; improve Online Services, process orders, manage accounts</li>
            <li>Communicate updates, marketing offers, and support</li>
            <li>Personalize your experience &amp; recommendations</li>
            <li>Analyze trends, usage &amp; business analytics</li>
            <li>Ensure security, prevent fraud &amp; comply with legal obligations</li>
            <li>Develop new products, services &amp; AI-driven features</li>
          </ul>
        </section>

        {/* IV. How We Share Your Information */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">IV. How We Share Your Information</h2>
          <ul className="list-disc list-inside mt-2 leading-relaxed space-y-1">
            <li>Subsidiaries &amp; affiliates</li>
            <li>Service providers (payment, delivery, analytics, marketing)</li>
            <li>Third parties in business transactions (sale or merger)</li>
            <li>Legal authorities when required by law</li>
          </ul>
          <p className="mt-2 leading-relaxed">
            <strong>Note:</strong> We do <em>not</em> sell your personal information for monetary gain.
          </p>
        </section>

        {/* V. Your Choices & Rights */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">V. Your Choices &amp; Rights</h2>
          <ul className="list-disc list-inside mt-2 leading-relaxed space-y-1">
            <li>Access, correct, or delete your personal data</li>
            <li>Restrict or object to certain processing</li>
            <li>Opt out of marketing communications</li>
            <li>Withdraw consent where processing is consent-based</li>
          </ul>
          <p className="mt-2 leading-relaxed">
            Manage preferences in your account settings or contact us at{' '}
            <a href="mailto:privacy@broskiskitchen.com" className="text-amber-400 hover:underline">
              privacy@broskiskitchen.com
            </a>.
          </p>
        </section>

        {/* VI. Cookies & Tracking */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">VI. Cookies &amp; Tracking Technologies</h2>
          <p className="leading-relaxed">
            We use cookies &amp; similar tech to operate and optimize our Online Services, remember
            preferences, and tailor marketing. Categories include:
          </p>
          <ul className="list-disc list-inside mt-2 leading-relaxed space-y-1">
            <li>Strictly necessary (core functionality)</li>
            <li>Performance (analytics)</li>
            <li>Functional (enhancements)</li>
            <li>Advertising (targeted ads)</li>
          </ul>
          <p className="mt-2 leading-relaxed">
            Manage cookie settings via your browser or our cookie consent tool.
          </p>
        </section>

        {/* VII. Security & Retention */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">VII. Security &amp; Retention</h2>
          <p className="leading-relaxed">
            We implement industry-standard measures to protect your data and retain it only as long
            as necessary to fulfill the described purposes and comply with laws.
          </p>
        </section>

        {/* VIII. International Transfers */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">VIII. International Data Transfers</h2>
          <p className="leading-relaxed">
            When transferring data across borders, we use safeguards such as Standard Contractual Clauses.
          </p>
        </section>

        {/* IX. Children’s Privacy */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">IX. Children’s Privacy</h2>
          <p className="leading-relaxed">
            Our services are not directed to children under 16, and we do not knowingly collect their data.
            If you believe we have, contact{' '}
            <a href="mailto:privacy@broskiskitchen.com" className="text-amber-400 hover:underline">
              privacy@broskiskitchen.com
            </a>.
          </p>
        </section>

        {/* X. Changes */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">X. Changes to This Statement</h2>
          <p className="leading-relaxed">
            We may update this Statement—material changes will be posted here or communicated via email.
          </p>
        </section>

        {/* XI. Contact */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">XI. Contact Us</h2>
          <p className="leading-relaxed">
            For questions or to exercise your rights, email{' '}
            <a href="mailto:privacy@broskiskitchen.com" className="text-amber-400 hover:underline">
              privacy@broskiskitchen.com
            </a>, or write to:
          </p>
          <address className="not-italic leading-relaxed">
            Broskis Kitchen LLC<br />
            Privacy Office<br />
            123 Flavor Street<br />
            Fort Wayne, IN 46802
          </address>
        </section>
      </main>
    </div>
  );
};

export default PrivacyPage;
