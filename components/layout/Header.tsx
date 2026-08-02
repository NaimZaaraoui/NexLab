'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { GlobalSearchBox } from '@/components/layout/GlobalSearchBox';
import { NotificationsMenu } from '@/components/layout/NotificationsMenu';
import { UserMenu } from '@/components/layout/UserMenu';
import { QcStatusChip } from '@/components/layout/QcStatusChip';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import type { HeaderNotification, HeaderQcSummary, HeaderSearchResult } from '@/components/layout/types';
import { useMobileMenu } from '@/components/providers/MobileMenuContext';
import { useSession } from 'next-auth/react';

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toggle } = useMobileMenu();

  const user = session?.user;
  const role = user?.role || 'TECHNICIEN';

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<HeaderSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const [notifications, setNotifications] = useState<HeaderNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [qcSummary, setQcSummary] = useState<HeaderQcSummary | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setShowSearchResults(false);
        setShowNotifications(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
          if (res.ok) {
            const data = await res.json();
            setSearchResults(data.results || []);
            setShowSearchResults(true);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const knownNotificationIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        
        // Handle native notifications for new unread messages
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          const newUnread = data.filter((n: HeaderNotification) => !n.isRead && !knownNotificationIds.current.has(n.id));
          
          newUnread.forEach((notif: HeaderNotification) => {
            const nativeNotif = new Notification(notif.title, {
              body: notif.message,
              icon: '/icon.png',
              tag: notif.id,
            });
            
            nativeNotif.onclick = () => {
              window.focus();
              handleNotificationClick(notif.id);
              nativeNotif.close();
            };
          });
        }
        
        // Update known IDs
        const newIds = new Set<string>();
        data.forEach((n: HeaderNotification) => newIds.add(n.id));
        knownNotificationIds.current = newIds;

        setNotifications(data);
        setUnreadCount(data.filter((n: HeaderNotification) => !n.isRead).length);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => {
      if (!document.hidden) fetchNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadQcStatus = async () => {
      try {
        const res = await fetch('/api/qc/today');
        if (res.ok) {
          const data = await res.json();
          setQcSummary(data);
        }
      } catch (error) {
        console.error(error);
      }
    };

    loadQcStatus();
    const interval = setInterval(loadQcStatus, 300000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = async (notificationId: string) => {
    try {
      const notif = notifications.find(n => n.id === notificationId);
      await fetch(`/api/notifications/${notificationId}/read`, { method: 'POST' });
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      if (notif?.analysisId) {
        router.push(`/analyses/${notif.analysisId}`);
        setShowNotifications(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-page)]/70 backdrop-blur-md transition-all duration-300">
        <div className="flex h-20 items-center justify-between gap-4 px-4 lg:px-6 xl:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              onClick={() => {
                toggle();
                onMobileMenuToggle?.();
              }}
              className="rounded-xl border bg-[var(--color-surface)] p-2 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-muted)] lg:hidden"
            >
              <Menu className="w-5 h-5 text-[var(--color-text-secondary)]" />
            </button>

            <GlobalSearchBox
              searchQuery={searchQuery}
              isSearching={isSearching}
              searchResults={searchResults}
              showSearchResults={showSearchResults}
              searchRef={searchRef}
              searchInputRef={searchInputRef}
              onSearchQueryChange={setSearchQuery}
              onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
              onSelectResult={(result) => {
                let url: string;
                if (result.type === 'patient') {
                  url = `/dashboard/patients/${result.id}`;
                } else if (result.type === 'analysis') {
                  url = `/analyses/${result.id}`;
                } else {
                  url = `/tests?highlight=${result.id}`;
                }
                router.push(url);
                setShowSearchResults(false);
                setSearchQuery('');
              }}
            />
          </div>

          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <QcStatusChip qcSummary={qcSummary} onClick={() => router.push('/dashboard/qc')} />

            <NotificationsMenu
              notifications={notifications}
              unreadCount={unreadCount}
              showNotifications={showNotifications}
              notifRef={notifRef}
              onToggle={() => setShowNotifications((value) => !value)}
              onNotificationClick={handleNotificationClick}
              onReadAll={async () => {
                await fetch('/api/notifications/read-all', { method: 'POST' });
                setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
                setUnreadCount(0);
              }}
            />

            <UserMenu
              name={user?.name}
              email={user?.email}
              role={role}
              show={showUserMenu}
              menuRef={userMenuRef}
              onToggle={() => setShowUserMenu((v) => !v)}
              onLogoutRequest={() => setShowLogoutConfirm(true)}
            />
          </div>
        </div>
      </header>

      <ConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => signOut({ redirectTo: '/login' })}
        title="Se déconnecter ?"
        message="Êtes-vous sûr de vouloir quitter votre session ? Vous devrez vous reconnecter pour accéder au laboratoire."
        confirmText="Déconnexion"
        type="danger"
        icon="logout"
      />
    </>
  );
}
