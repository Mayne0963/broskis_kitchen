export const dynamic = "force-dynamic";

export default function Forbidden() {
  return (
    <main className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center text-slate-200">
        <h1 className="text-4xl font-extrabold text-yellow-300 drop-shadow">Access Denied</h1>
        <p className="mt-2 text-slate-400">This area is for Broski admins only.</p>
        <a href="/" className="inline-block mt-5 px-5 py-2 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-semibold">
          Back to Home
        </a>
      </div>
    </main>
  );
}