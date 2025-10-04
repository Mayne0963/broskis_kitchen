export default function NotAuthorized() {
  return (
    <div className="p-10">
      <h1 className="text-xl font-semibold">Not authorized</h1>
      <p className="text-sm text-neutral-600">
        You need admin access to view this page.
      </p>
    </div>
  );
}