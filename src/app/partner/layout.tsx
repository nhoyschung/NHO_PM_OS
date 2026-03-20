import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-utils';
import { PartnerLayout } from '@/components/layout/partner-layout';

export default async function PartnerGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // RBAC: only viewer role uses partner portal; others go to main dashboard
  if (user.role !== 'viewer') {
    redirect('/dashboard');
  }

  return (
    <PartnerLayout userName={user.name} userRole={user.role}>
      {children}
    </PartnerLayout>
  );
}
