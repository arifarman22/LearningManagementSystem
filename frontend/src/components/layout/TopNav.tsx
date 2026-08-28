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
        'border-b border-neutral-200 bg-white px-4 gap-4',
        'transition-all duration-200',
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
        {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <button
          className="relative flex items-center justify-center w-9 h-9 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={17} />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-brand-500" />
        </button>

        {user && (
          <Dropdown>
            <DropdownTrigger asChild>
              <button
                className="flex items-center gap-2 rounded-lg pl-2 pr-3 py-1.5 hover:bg-neutral-100 transition-colors ml-1"
                aria-label="User menu"
              >
                <Avatar name={user.username} size="sm" />
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-neutral-800 leading-none max-w-[120px] truncate">
                    {user.username}
                  </p>
                  <p className="text-xs text-neutral-400 leading-none mt-0.5 capitalize">
                    {user.role?.name}
                  </p>
                </div>
                <ChevronDown size={13} className="text-neutral-400 hidden sm:block" />
              </button>
            </DropdownTrigger>
            <DropdownContent align="end" className="w-52">
              <DropdownLabel>
                <div>
                  <p className="text-sm font-semibold text-neutral-900 normal-case tracking-normal">{user.username}</p>
                  <p className="text-xs text-neutral-400 font-normal normal-case tracking-normal truncate">{user.email}</p>
                </div>
              </DropdownLabel>
              <DropdownSeparator />
              <DropdownItem asChild>
                <Link href="/profile" className="flex items-center gap-2">
                  <User size={14} /> Profile
                </Link>
              </DropdownItem>
              <DropdownItem asChild>
                <Link href="/settings" className="flex items-center gap-2">
                  <Settings size={14} /> Settings
                </Link>
              </DropdownItem>
              <DropdownSeparator />
              <DropdownItem danger onClick={handleLogout} className="flex items-center gap-2">
                <LogOut size={14} /> Sign out
              </DropdownItem>
            </DropdownContent>
          </Dropdown>
        )}
      </div>
    </header>
  );
}
