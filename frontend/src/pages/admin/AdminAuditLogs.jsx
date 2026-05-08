import { useEffect, useMemo, useState } from 'react';
import { ScrollText, Search, Download } from 'lucide-react';
import {
  PageHeader, Card, CardHeader, Input, Badge, CenteredSpinner,
} from '../../components/ui.jsx';
import { useToast } from '../../components/toast.jsx';
import { admin } from '../../api';

const ACTION_TONES = {
  login: 'success',
  register: 'brand',
  logout: 'neutral',
  password_change: 'warning',
  profile_update: 'brand',
};

export default function AdminAuditLogs() {
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => {
    admin.auditLogs()
      .then((r) => setLogs(r.data))
      .catch(() => toast.error('Failed to load logs'))
      .finally(() => setLoading(false));
  }, []);

  const actions = useMemo(() => {
    return Array.from(new Set(logs.map((l) => l.action))).sort();
  }, [logs]);

  const filtered = logs.filter((l) => {
    if (actionFilter !== 'all' && l.action !== actionFilter) return false;
    if (query) {
      const hay = `${l.action} ${l.ip_address} ${l.user_id}`.toLowerCase();
      if (!hay.includes(query.toLowerCase())) return false;
    }
    return true;
  });

  const exportCsv = () => {
    const header = 'timestamp,user_id,action,ip_address\n';
    const body = filtered.map((l) =>
      `"${l.timestamp}",${l.user_id ?? ''},${l.action},${l.ip_address ?? ''}`).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported');
  };

  if (loading) return <CenteredSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        subtitle={`${logs.length} events recorded · last ${filtered.length} matching`}
        action={
          <button onClick={exportCsv}
                  className="btn btn-secondary">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        }
      />

      <Card className="!p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <Input icon={Search} placeholder="Search by user, action, IP…"
                   value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <select className="input" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
            <option value="all">All actions</option>
            {actions.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </Card>

      <Card className="!p-0 overflow-hidden">
        <div className="p-6 pb-4"><CardHeader title="Event log" icon={ScrollText} /></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-y border-slate-200 dark:border-slate-800">
              <tr className="text-left">
                <th className="px-6 py-3 font-semibold">When</th>
                <th className="px-6 py-3 font-semibold">User ID</th>
                <th className="px-6 py-3 font-semibold">Action</th>
                <th className="px-6 py-3 font-semibold">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-400">No events match</td></tr>
              ) : filtered.map((l) => (
                <tr key={l.log_id} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="px-6 py-3 whitespace-nowrap text-slate-500">
                    {new Date(l.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-3">#{l.user_id ?? '—'}</td>
                  <td className="px-6 py-3">
                    <Badge tone={ACTION_TONES[l.action] || 'neutral'}>{l.action}</Badge>
                  </td>
                  <td className="px-6 py-3 font-mono text-xs">{l.ip_address || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
