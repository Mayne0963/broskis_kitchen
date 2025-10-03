// app/admin/signin/page.tsx
import { Suspense } from "react";
import SigninForm from "./SigninForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default function AdminSigninPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <Suspense fallback={
          <div className="text-center text-sm opacity-70">Loading session…</div>
        }>
          <SigninForm />
        </Suspense>
      </div>
    </main>
  );
}