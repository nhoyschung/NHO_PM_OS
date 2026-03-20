import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-utils';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <DashboardLayout userName={user.name} userRole={user.role}>
      {children}
    </DashboardLayout>
  );
}
