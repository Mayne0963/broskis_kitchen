export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Authentication is now handled at the individual page level
  // to preserve the target pathname in redirects
  return <>{children}</>;
}