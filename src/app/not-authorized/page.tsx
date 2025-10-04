export default function NotAuthorized() {
  return (
    <div className="p-10 text-white">
      <h1 className="text-xl font-semibold">Not authorized</h1>
      <p className="text-sm text-neutral-400">You need admin access to view this page.</p>
    </div>
  );
}