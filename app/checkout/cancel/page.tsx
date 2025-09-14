export default function CheckoutCancelPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Payment Cancelled</h1>
        <p className="text-lg text-gray-600 mb-6">
          Your payment was cancelled. No charges have been made to your account.
        </p>
        <div className="space-x-4">
          <a 
            href="/checkout"
            className="inline-block rounded-md bg-[#E9B949] px-6 py-3 font-semibold text-black hover:opacity-90"
          >
            Try Again
          </a>
          <a 
            href="/"
            className="inline-block rounded-md border border-gray-300 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50"
          >
            Return to Home
          </a>
        </div>
      </div>
    </main>
  );
}