import Link from "next/link";

export default function LunchDropPage() {
  return (
    <main className="page-wrapper">
      <h1 className="page-title">BROSKI&apos;S LUNCH DROP™</h1>

      <p className="page-sub">
        Your workplace battles to hit <b>22 plates</b> first. The winning job
        gets tomorrow&apos;s Broski lunch delivered by OTW during your lunch window.
      </p>

      <section className="ld-section">
        <h2 className="ld-heading">How It Works</h2>
        <ol className="ld-list">
          <li>
            <span className="ld-step-label">1. Your workplace enters.</span> A
            captain, supervisor, or HR rep fills out the workplace signup once.
          </li>
          <li>
            <span className="ld-step-label">2. Coworkers pre-order lunch.</span>{" "}
            Employees choose your workplace and shift at checkout the day before
            the drop.
          </li>
          <li>
            <span className="ld-step-label">3. First to 22 plates wins.</span>{" "}
            The first workplace on each shift to reach 22 plates locks in
            tomorrow&apos;s Broski Lunch Drop with free OTW delivery.
          </li>
        </ol>
      </section>

      <div className="ld-cta-row">
        <Link href="/order-race" className="btn-race">
          VIEW ORDER RACE
        </Link>
        <Link href="/enter-workplace" className="btn-signup">
          ENTER YOUR WORKPLACE
        </Link>
      </div>
    </main>
  );
}
