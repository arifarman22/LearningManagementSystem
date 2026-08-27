'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Menu, X, LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuth } from '@/store/auth';
import { useSidebar } from './Sidebar';
import { Avatar } from '@/components/ui/Avatar';
import {
  Dropdown, DropdownTrigger, DropdownContent,
  DropdownItem, DropdownSeparator, DropdownLabel,
} from '@/components/ui/Dropdown';

interface TopNavProps {
  mobileMenuOpen: boolean;
  onMobileMenuToggle: () => void;
}

export function TopNav({ mobileMenuOpen, onMobileMenuToggle }: TopNavProps) {
  const { user, logout } = useAuth();
  const { collapsed } = useSidebar();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-20 flex h-[3.75rem] items-center justify-between',
        'border-b border-neutral-200 bg-white/95 backdrop-blur-sm px-4 gap-4',
        'transition-all duration-250 ease-smooth',
        // Offset for sidebar on desktop
        'left-0 md:left-64',
        collapsed && 'md:left-[4.5rem]',
      )}
    >
      {/* Mobile menu toggle */}
      <button
        onClick={onMobileMenuToggle}
        className="flex md:hidden items-center justify-center w-9 h-9 rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors"
        aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={mobileMenuOpen}
      >
        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Notifications (placeholder) */}
        <button
          className="relative flex items-center justify-center w-9 h-9 rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>

        {/* User menu */}
        {user && (
          <Dropdown>
            <DropdownTrigger asChild>
              <button
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-neutral-100 transition-colors"
                aria-label="User menu"
              >
                <Avatar name={user.username} size="sm" />
                <span className="hidden sm:block text-sm font-medium text-neutral-700 max-w-[120px] truncate">
                  {user.username}
                </span>
                <ChevronDown size={14} className="text-neutral-400 hidden sm:block" />
              </button>
            </DropdownTrigger>
            <DropdownContent align="end" className="w-52">
              <DropdownLabel>
                <div>
                  <p className="text-sm font-medium text-neutral-900 normal-case tracking-normal">{user.username}</p>
                  <p className="text-xs text-neutral-400 font-normal normal-case tracking-normal truncate">{user.email}</p>
                </div>
              </DropdownLabel>
              <DropdownSeparator />
              <DropdownItem asChild>
                <Link href="/profile" className="flex items-center gap-2">
                  <User size={15} />
                  Profile
                </Link>
              </DropdownItem>
              <DropdownItem asChild>
                <Link href="/settings" className="flex items-center gap-2">
                  <Settings size={15} />
                  Settings
                </Link>
              </DropdownItem>
              <DropdownSeparator />
              <DropdownItem danger onClick={handleLogout} className="flex items-center gap-2">
                <LogOut size={15} />
                Sign out
              </DropdownItem>
            </DropdownContent>
          </Dropdown>
        )}
      </div>
    </header>
  );
}
