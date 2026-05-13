'use client';

import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { AlertTriangle, X, LogOut, Key, UserX, UserCheck } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  icon?: 'logout' | 'reset' | 'deactivate' | 'activate' | 'warning';
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  type = 'info',
  icon = 'warning'
}: ConfirmationModalProps) {
  const getIcon = () => {
    switch (icon) {
      case 'logout': return <LogOut className="h-5 w-5 text-rose-700" />;
      case 'reset': return <Key className="h-5 w-5 text-amber-700" />;
      case 'deactivate': return <UserX className="h-5 w-5 text-rose-700" />;
      case 'activate': return <UserCheck className="h-5 w-5 text-emerald-700" />;
      default: return <AlertTriangle className="h-5 w-5 text-amber-700" />;
    }
  };

  const getButtonClass = () => {
    switch (type) {
      case 'danger': return 'bg-rose-600 hover:bg-rose-700 text-white';
      case 'warning': return 'bg-amber-600 hover:bg-amber-700 text-white';
      default: return 'bg-[var(--color-accent)] hover:brightness-95 text-white';
    }
  };

  const getIconBg = () => {
    switch (type) {
      case 'danger': return 'bg-rose-50';
      case 'warning': return 'bg-amber-50';
      default: return 'bg-indigo-50';
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-950/45" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-150"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-left align-middle shadow-[0_10px_26px_rgba(15,31,51,0.10)] transition-all sm:p-7">
                <div className="mb-6 flex items-start justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-border)] ${getIconBg()}`}>
                    {getIcon()}
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 text-[var(--color-text-soft)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-muted)] rounded-xl transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <Dialog.Title
                  as="h3"
                  className="text-xl sm:text-2xl font-semibold text-[var(--color-text)] leading-tight mb-2"
                >
                  {title}
                </Dialog.Title>
                
                <div className="mt-2">
                  <p className="text-[var(--color-text-secondary)] leading-relaxed">
                    {message}
                  </p>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row-reverse gap-3">
                  <button
                    type="button"
                    className={`inline-flex h-11 flex-1 items-center justify-center rounded-xl px-5 text-sm font-medium transition-all active:scale-[0.99] ${getButtonClass()}`}
                    onClick={() => {
                      onConfirm();
                      onClose();
                    }}
                  >
                    {confirmText}
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-5 text-sm font-medium text-[var(--color-text-secondary)] transition-all active:scale-[0.99]"
                    onClick={onClose}
                  >
                    {cancelText}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
