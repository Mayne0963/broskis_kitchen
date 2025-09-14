export default function CheckoutSuccessPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-green-600 mb-4">Payment Successful!</h1>
        <p className="text-lg text-gray-600 mb-6">
          Thank you for your order. Your payment has been processed successfully.
        </p>
        <a 
          href="/"
          className="inline-block rounded-md bg-[#E9B949] px-6 py-3 font-semibold text-black hover:opacity-90"
        >
          Return to Home
        </a>
      </div>
    </main>
  );
}