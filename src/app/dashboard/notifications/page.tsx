import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getNotifications, getUnreadCount } from '@/modules/notifications/queries';
import { NotificationList } from '@/modules/notifications/components/notification-list';
import type { NotificationFilters } from '@/modules/notifications/types';

interface NotificationsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function NotificationsPage({ searchParams }: NotificationsPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const userId = session.user.id;
  const params = await searchParams;

  // Build partial filters — Zod schema in getNotifications() validates enum values
  const filters: Partial<NotificationFilters> = {
    page: typeof params.page === 'string' ? parseInt(params.page, 10) : 1,
    perPage: typeof params.perPage === 'string' ? parseInt(params.perPage, 10) : 20,
  };

  if (typeof params.type === 'string') {
    (filters as Record<string, unknown>).type = params.type;
  }
  if (typeof params.isRead === 'string') {
    (filters as Record<string, unknown>).isRead = params.isRead === 'true';
  }

  const [result, unreadCount] = await Promise.all([
    getNotifications(userId, filters),
    getUnreadCount(userId),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <NotificationList
        data={result.data}
        total={result.total}
        page={result.page}
        perPage={result.perPage}
        totalPages={result.totalPages}
        filters={{
          type: typeof params.type === 'string' ? params.type : undefined,
          isRead:
            typeof params.isRead === 'string' ? params.isRead === 'true' : undefined,
        }}
        unreadCount={unreadCount.total}
      />
    </div>
  );
}
