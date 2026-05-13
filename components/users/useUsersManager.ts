import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
}

export function useUsersManager() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currentUserId = session?.user?.id;
  const adminCount = users.filter(u => u.role === 'ADMIN' && u.isActive).length;

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'danger' | 'warning' | 'info';
    icon: 'logout' | 'reset' | 'deactivate' | 'activate' | 'warning';
    title: string;
    message: string;
    action: () => void;
  }>({
    isOpen: false,
    type: 'info',
    icon: 'warning',
    title: '',
    message: '',
    action: () => {},
  });

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Erreur lors du chargement des utilisateurs');
      const data = await response.json();
      setUsers(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleActive = useCallback((user: User) => {
    setConfirmModal({
      isOpen: true,
      type: user.isActive ? 'danger' : 'info',
      icon: user.isActive ? 'deactivate' : 'activate',
      title: user.isActive ? 'Désactiver l\'utilisateur ?' : 'Activer l\'utilisateur ?',
      message: user.isActive 
        ? `Êtes-vous sûr de vouloir désactiver ${user.name} ? Il ne pourra plus se connecter au système.`
        : `Voulez-vous réactiver l'accès pour ${user.name} ?`,
      action: async () => {
        try {
          const response = await fetch(`/api/users/${user.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'toggle-active' }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Erreur lors de la modification');
          }

          fetchUsers();
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : 'Erreur de modification');
        }
      }
    });
  }, [fetchUsers]);

  const handleResetPassword = useCallback((user: User) => {
    setConfirmModal({
      isOpen: true,
      type: 'warning',
      icon: 'reset',
      title: 'Réinitialiser le mot de passe ?',
      message: `Le mot de passe de ${user.name} sera réinitialisé à "NexLab2026!". L'utilisateur sera forcé de le changer à sa prochaine connexion.`,
      action: async () => {
        try {
          const response = await fetch(`/api/users/${user.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'reset-password' }),
          });

          if (!response.ok) throw new Error('Erreur lors de la réinitialisation');
          fetchUsers();
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : 'Erreur de réinitialisation');
        }
      }
    });
  }, [fetchUsers]);

  const closeConfirmModal = useCallback(() => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  return {
    users,
    loading,
    error,
    currentUserId,
    adminCount,
    confirmModal,
    fetchUsers,
    handleToggleActive,
    handleResetPassword,
    closeConfirmModal,
  };
}
