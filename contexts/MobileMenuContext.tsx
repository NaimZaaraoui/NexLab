'use client';
import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface MenuCtx {
  isOpen: boolean;
  isCollapsed: boolean;
  toggle: () => void;
  close: () => void;
  open: () => void;
  toggleCollapse: () => void;
}

const Ctx = createContext<MenuCtx>({
  isOpen: false, isCollapsed: false,
  toggle: () => {}, close: () => {}, open: () => {}, toggleCollapse: () => {},
});

export function MobileMenuProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const toggle = useCallback(() => setIsOpen(p => !p), []);
  const close = useCallback(() => setIsOpen(false), []);
  const open = useCallback(() => setIsOpen(true), []);
  const toggleCollapse = useCallback(() => setIsCollapsed(p => !p), []);
  return (
    <Ctx.Provider value={{ isOpen, isCollapsed, toggle, close, open, toggleCollapse }}>
      {children}
    </Ctx.Provider>
  );
}

export function useMobileMenu() { return useContext(Ctx); }