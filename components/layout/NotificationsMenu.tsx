'use client';

import { Bell, Check, Clock, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { HeaderNotification } from '@/components/layout/types';

interface NotificationsMenuProps {
  notifications: HeaderNotification[];
  unreadCount: number;
  showNotifications: boolean;
  notifRef: React.RefObject<HTMLDivElement | null>;
  onToggle: () => void;
  onNotificationClick: (notificationId: string) => void;
  onReadAll: () => void;
}

export function NotificationsMenu({
  notifications,
  unreadCount,
  showNotifications,
  notifRef,
  onToggle,
  onNotificationClick,
  onReadAll,
}: NotificationsMenuProps) {
  const getNotificationIcon = (type: HeaderNotification['type']) => {
    const icons = {
      success: <Check className="h-4 w-4 text-emerald-600" />,
      warning: <Clock className="h-4 w-4 text-amber-600" />,
      error: <X className="h-4 w-4 text-rose-600" />,
      info: <Bell className="h-4 w-4 text-[var(--color-accent)]" />,
    };
    return icons[type] || icons.info;
  };

  return (
    <div className="relative" ref={notifRef}>
      <button onClick={onToggle} className="group relative rounded-lg border bg-[var(--color-surface)] p-2.5 transition-colors hover:bg-[var(--color-surface-muted)]">
        <Bell className="h-[18px] w-[18px] text-[var(--color-text-soft)] transition-colors group-hover:text-[var(--color-accent)]" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute right-0 top-full z-50 mt-2 w-96 rounded-lg border bg-[var(--color-surface)] shadow-[0_10px_24px_rgba(15,31,51,0.08)]">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-sm font-semibold text-[var(--color-text)]">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <span className="rounded-full bg-[var(--color-accent-soft)] px-2.5 py-1 text-xs font-medium text-[var(--color-accent)]">
                  {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}
                </span>
              )}
              {unreadCount > 0 && (
                <button onClick={onReadAll} className="text-xs font-medium text-[var(--color-text-soft)] transition-colors hover:text-[var(--color-accent)]">
                  Tout lu
                </button>
              )}
            </div>
          </div>
          <div className="max-h-[420px] divide-y overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => onNotificationClick(notification.id)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--color-surface-muted)] ${
                    !notification.isRead ? 'bg-[var(--color-accent-soft)]/35' : ''
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">{getNotificationIcon(notification.type)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-[var(--color-text)]">{notification.title}</div>
                    <div className="text-xs text-[var(--color-text-secondary)]">{notification.message}</div>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-[var(--color-text-soft)]">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: fr })}
                    </div>
                  </div>
                  {!notification.isRead && <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-[var(--color-accent)]" />}
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-sm text-[var(--color-text-soft)]">Aucune notification</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
