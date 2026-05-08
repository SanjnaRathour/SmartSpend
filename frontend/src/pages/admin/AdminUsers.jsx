import { useEffect, useState } from 'react';
import { Users, Ban, Check, Trash2, Search } from 'lucide-react';
import {
  PageHeader, Card, CardHeader, Input, Badge, CenteredSpinner,
} from '../../components/ui.jsx';
import { ConfirmModal } from '../../components/Modal.jsx';
import { useToast } from '../../components/toast.jsx';
import { admin, getJwtPayload } from '../../api';

export default function AdminUsers() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirmToggle, setConfirmToggle] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const currentUid = Number(getJwtPayload()?.sub);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await admin.users();
      setUsers(data);
    } catch (e) { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggle = async (user) => {
    try {
      await admin.toggleUser(user.user_id);
      toast.success(`${user.email} ${user.is_active ? 'disabled' : 'enabled'}`);
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Action failed');
    }
  };

  const remove = async (user) => {
    try {
      await admin.deleteUser(user.user_id);
      toast.success(`${user.email} deleted`);
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Delete failed');
    }
  };

  const filtered = users.filter((u) =>
    !query || u.email.toLowerCase().includes(query.toLowerCase())
           || u.name?.toLowerCase().includes(query.toLowerCase())
  );

  if (loading) return <CenteredSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        subtitle={`${users.length} users · ${users.filter((u) => u.is_active).length} active · ${users.filter((u) => u.role === 'admin').length} admins`}
        action={<Badge tone="warning">ADMIN</Badge>}
      />

      <Card className="!p-4">
        <Input icon={Search} placeholder="Search users…"
               value={query} onChange={(e) => setQuery(e.target.value)} />
      </Card>

      <Card className="!p-0 overflow-hidden">
        <div className="p-6 pb-4"><CardHeader title="All users" icon={Users} /></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-y border-slate-200 dark:border-slate-800">
              <tr className="text-left">
                <th className="px-6 py-3 font-semibold">Email</th>
                <th className="px-6 py-3 font-semibold">Name</th>
                <th className="px-6 py-3 font-semibold">Role</th>
                <th className="px-6 py-3 font-semibold">Txns</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-400">No users match</td></tr>
              ) : filtered.map((u) => {
                const isSelf = u.user_id === currentUid;
                return (
                  <tr key={u.user_id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="px-6 py-3">
                      {u.email}
                      {isSelf && <span className="ml-2 text-xs text-slate-400">(you)</span>}
                    </td>
                    <td className="px-6 py-3">{u.name}</td>
                    <td className="px-6 py-3">
                      <Badge tone={u.role === 'admin' ? 'warning' : 'brand'}>{u.role}</Badge>
                    </td>
                    <td className="px-6 py-3">{u.txn_count}</td>
                    <td className="px-6 py-3">
                      <Badge tone={u.is_active ? 'success' : 'danger'}>
                        {u.is_active ? 'Active' : 'Disabled'}
                      </Badge>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setConfirmToggle(u)}
                          disabled={isSelf && u.is_active}
                          title={isSelf && u.is_active ? "You can't disable yourself" : ''}
                          className={`btn ${u.is_active ? 'btn-danger' : 'btn-primary'} !py-1.5 !px-3 text-xs ${isSelf && u.is_active ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          {u.is_active ? <><Ban className="w-3 h-3" /> Disable</>
                                       : <><Check className="w-3 h-3" /> Enable</>}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(u)}
                          disabled={isSelf}
                          title={isSelf ? "You can't delete yourself" : ''}
                          className={`btn btn-ghost !py-1.5 !px-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 ${isSelf ? 'opacity-30 cursor-not-allowed' : ''}`}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmModal
        open={!!confirmToggle}
        onClose={() => setConfirmToggle(null)}
        onConfirm={() => toggle(confirmToggle)}
        title={confirmToggle?.is_active ? 'Disable user?' : 'Enable user?'}
        message={confirmToggle ? `${confirmToggle.is_active ? 'Disable' : 'Enable'} ${confirmToggle.email}?` : ''}
        confirmText={confirmToggle?.is_active ? 'Disable' : 'Enable'}
        variant={confirmToggle?.is_active ? 'danger' : 'primary'}
      />
      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => remove(confirmDelete)}
        title="Delete user permanently?"
        message={confirmDelete ? `This will permanently delete ${confirmDelete.email} and ALL their transactions. This cannot be undone.` : ''}
        confirmText="Delete forever"
      />
    </div>
  );
}
