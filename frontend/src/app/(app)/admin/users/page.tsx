'use client';

import * as React from 'react';
import { Shield, Search, ChevronDown, Trash2, Ban, CheckCircle, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';
import { PageHeader } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell, TableLoading, TableEmpty } from '@/components/ui/Table';
import type { User, Role, ApiListResponse } from '@/types';

const ROLE_COLORS: Record<string, 'brand' | 'success' | 'warning' | 'danger' | 'default'> = {
  admin: 'danger',
  'content-manager': 'warning',
  instructor: 'brand',
  student: 'success',
  authenticated: 'default',
};

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = React.useState<User[]>([]);
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [actionLoading, setActionLoading] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<User | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get<{ data: User[] }>('/admin-panel/users'),
        api.get<{ data: Role[] }>('/admin-panel/roles'),
      ]);
      setUsers(usersRes.data ?? []);
      setRoles(rolesRes.data ?? []);
    } catch {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const filtered = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()),
  );

  async function changeRole(userId: number, roleId: number) {
    setActionLoading(userId);
    try {
      const res = await api.patch<{ data: User }>(`/admin-panel/users/${userId}/role`, { roleId });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: res.data.role } : u));
    } catch {
      setError('Failed to change role.');
    } finally {
      setActionLoading(null);
    }
  }

  async function toggleBlock(user: User) {
    setActionLoading(user.id);
    try {
      const endpoint = user.blocked
        ? `/admin-panel/users/${user.id}/unblock`
        : `/admin-panel/users/${user.id}/block`;
      const res = await api.patch<{ data: User }>(endpoint, {});
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, blocked: res.data.blocked } : u));
    } catch {
      setError('Failed to update user.');
    } finally {
      setActionLoading(null);
    }
  }

  async function deleteUser(user: User) {
    setActionLoading(user.id);
    setConfirmDelete(null);
    try {
      await api.delete(`/admin-panel/users/${user.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch {
      setError('Failed to delete user.');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description={`${users.length} users on the platform`}
        action={
          <Button variant="secondary" size="sm" onClick={load} leftIcon={<RefreshCw size={14} />}>
            Refresh
          </Button>
        }
      />

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-neutral-200 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-neutral-200/60 bg-white overflow-hidden">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>User</TableHeaderCell>
              <TableHeaderCell>Role</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Joined</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableLoading cols={5} rows={6} />
            ) : filtered.length === 0 ? (
              <TableEmpty cols={5} title="No users found." />
            ) : (
              filtered.map((u) => {
                const isSelf = u.id === me?.id;
                const busy = actionLoading === u.id;
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-neutral-900">{u.username}</p>
                        <p className="text-xs text-neutral-400">{u.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isSelf ? (
                        <Badge variant={ROLE_COLORS[u.role?.type ?? ''] ?? 'default'}>
                          {u.role?.name ?? '—'}
                        </Badge>
                      ) : (
                        <div className="relative inline-block">
                          <select
                            value={u.role?.id ?? ''}
                            disabled={busy}
                            onChange={(e) => changeRole(u.id, Number(e.target.value))}
                            className="appearance-none rounded-lg border border-neutral-200 bg-white py-1 pl-3 pr-7 text-xs font-medium text-neutral-700 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:opacity-50 cursor-pointer"
                          >
                            {roles.map((r) => (
                              <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                          </select>
                          <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {u.blocked ? (
                        <Badge variant="danger" dot>Blocked</Badge>
                      ) : u.confirmed ? (
                        <Badge variant="success" dot>Active</Badge>
                      ) : (
                        <Badge variant="warning" dot>Unconfirmed</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-neutral-500">
                        {new Date(u.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                      </span>
                    </TableCell>
                    <TableCell>
                      {isSelf ? (
                        <span className="flex items-center gap-1 text-xs text-neutral-400">
                          <Shield size={12} /> You
                        </span>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="xs"
                            loading={busy}
                            onClick={() => toggleBlock(u)}
                            title={u.blocked ? 'Unblock user' : 'Block user'}
                          >
                            {u.blocked
                              ? <CheckCircle size={14} className="text-emerald-500" />
                              : <Ban size={14} className="text-amber-500" />
                            }
                          </Button>
                          <Button
                            variant="ghost"
                            size="xs"
                            loading={busy}
                            onClick={() => setConfirmDelete(u)}
                            title="Delete user"
                          >
                            <Trash2 size={14} className="text-rose-500" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete confirm dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-neutral-900">Delete user?</h3>
            <p className="mt-2 text-sm text-neutral-500">
              This will permanently delete <strong>{confirmDelete.username}</strong> and all their data. This cannot be undone.
            </p>
            <div className="mt-5 flex gap-3 justify-end">
              <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(null)}>Cancel</Button>
              <Button variant="danger" size="sm" onClick={() => deleteUser(confirmDelete)}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
