import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Account - Broski\'s Kitchen',
  description: 'Manage your account settings and orders',
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}