import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-utils';
import { isRoleAtLeast } from '@/lib/rbac';
import { runComplianceChecks } from '@/modules/compliance/queries';
import { ComplianceDashboard } from '@/modules/compliance/components';

export default async function CompliancePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // RBAC: admin/manager only
  if (!isRoleAtLeast(user.role, 'manager')) {
    redirect('/dashboard');
  }

  const report = await runComplianceChecks();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tuân thủ</h1>
        <p className="text-muted-foreground">
          Kiểm tra tuân thủ quy trình và chính sách toàn hệ thống.
        </p>
      </div>

      {/* Compliance Dashboard */}
      <ComplianceDashboard report={report} />
    </div>
  );
}
