// ── Email Service Stub ───────────────────────────────────────────
// TODO: Replace stubs with actual email provider (e.g., Resend, SendGrid, AWS SES)
// TODO: Add email queue for reliability (e.g., BullMQ + Redis)
// TODO: Add HTML email templates with company branding

// ── Vietnamese Email Templates ──────────────────────────────────

export const EMAIL_TEMPLATES = {
  TASK_ASSIGNED: {
    subject: 'Bạn được giao công việc mới',
    body: (taskTitle: string, assignedBy: string) =>
      `Xin chào,\n\nBạn đã được giao công việc "${taskTitle}" bởi ${assignedBy}.\n\nVui lòng đăng nhập để xem chi tiết.\n\nTrân trọng,\nProjectOpsOS`,
  },
  TASK_OVERDUE: {
    subject: 'Công việc đã quá hạn',
    body: (taskTitle: string) =>
      `Xin chào,\n\nCông việc "${taskTitle}" đã quá hạn. Vui lòng cập nhật tiến độ.\n\nTrân trọng,\nProjectOpsOS`,
  },
  PROJECT_STAGE_CHANGED: {
    subject: 'Giai đoạn dự án thay đổi',
    body: (projectName: string, fromStage: string, toStage: string) =>
      `Xin chào,\n\nDự án "${projectName}" đã chuyển từ "${fromStage}" sang "${toStage}".\n\nVui lòng đăng nhập để xem chi tiết.\n\nTrân trọng,\nProjectOpsOS`,
  },
  HANDOVER_STATUS_CHANGED: {
    subject: 'Cập nhật trạng thái bàn giao',
    body: (handoverTitle: string, status: string) =>
      `Xin chào,\n\nBàn giao "${handoverTitle}" đã được cập nhật trạng thái: ${status}.\n\nVui lòng đăng nhập để xem chi tiết.\n\nTrân trọng,\nProjectOpsOS`,
  },
  FINANCE_APPROVAL: {
    subject: 'Cập nhật phê duyệt tài chính',
    body: (description: string, status: string) =>
      `Xin chào,\n\nBản ghi tài chính "${description}" đã được cập nhật: ${status}.\n\nVui lòng đăng nhập để xem chi tiết.\n\nTrân trọng,\nProjectOpsOS`,
  },
} as const;

// ── sendEmail ───────────────────────────────────────────────────
// TODO: Implement with actual email provider

export async function sendEmail(params: {
  to: string;
  subject: string;
  body: string;
}): Promise<{ success: boolean }> {
  // Stub: log to console for development
  console.log('[Email Stub] Sending email:', {
    to: params.to,
    subject: params.subject,
    bodyPreview: params.body.slice(0, 100),
  });

  // TODO: Replace with actual email sending logic
  // Example with Resend:
  // const resend = new Resend(env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: 'noreply@projectopsos.com',
  //   to: params.to,
  //   subject: params.subject,
  //   text: params.body,
  // });

  return { success: true };
}

// ── sendNotificationEmail ───────────────────────────────────────
// TODO: Implement user email lookup and actual sending

export async function sendNotificationEmail(params: {
  userId: string;
  notification: {
    title: string;
    message: string;
    actionUrl?: string | null;
  };
}): Promise<{ success: boolean }> {
  // Stub: log to console for development
  console.log('[Email Stub] Sending notification email:', {
    userId: params.userId,
    title: params.notification.title,
    messagePreview: params.notification.message.slice(0, 100),
    actionUrl: params.notification.actionUrl,
  });

  // TODO: Look up user email from DB
  // TODO: Build HTML email with action button linking to actionUrl
  // TODO: Call sendEmail with resolved address

  return { success: true };
}
