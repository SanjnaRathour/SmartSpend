import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserCheck, Activity, AlertTriangle, ArrowRight, ScrollText } from 'lucide-react';
import {
  PageHeader, Card, CardHeader, StatCard, Badge, CenteredSpinner,
} from '../../components/ui.jsx';
import { useToast } from '../../components/toast.jsx';
import { admin } from '../../api';

export default function AdminOverview() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, l] = await Promise.all([admin.stats(), admin.auditLogs()]);
        setStats(s.data);
        setRecentLogs(l.data.slice(0, 5));
      } catch (e) {
        toast.error('Failed to load admin data');
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <CenteredSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Overview"
        subtitle="System-wide stats and recent activity"
        action={<Badge tone="warning">ADMIN MODE</Badge>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={stats?.total_users ?? 0} currency={false}
                  color="bg-gradient-to-br from-brand-500 to-brand-700" />
        <StatCard icon={UserCheck} label="Active Users" value={stats?.active_users ?? 0} currency={false}
                  color="bg-gradient-to-br from-emerald-500 to-emerald-600" />
        <StatCard icon={Activity} label="Transactions" value={stats?.total_transactions ?? 0} currency={false}
                  color="bg-gradient-to-br from-violet-500 to-violet-600" />
        <StatCard icon={AlertTriangle} label="Flagged" value={stats?.flagged_transactions ?? 0} currency={false}
                  color="bg-gradient-to-br from-amber-500 to-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Quick actions" icon={Users} />
          <div className="flex flex-col gap-2">
            <Link to="/admin/users"
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <span className="flex items-center gap-2"><Users className="w-4 h-4 text-brand-500" /> Manage Users</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>
            <Link to="/admin/audit"
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <span className="flex items-center gap-2"><ScrollText className="w-4 h-4 text-brand-500" /> View Audit Logs</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>
        </Card>

        <Card>
          <CardHeader title="Recent activity" icon={ScrollText}
            action={<Link to="/admin/audit" className="text-xs text-brand-600 hover:underline">View all →</Link>} />
          {recentLogs.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No recent activity</p>
          ) : (
            <ul className="space-y-2">
              {recentLogs.map((l) => (
                <li key={l.log_id} className="flex items-center justify-between text-sm py-1.5">
                  <div className="flex items-center gap-2">
                    <Badge tone="neutral">{l.action}</Badge>
                    <span className="text-slate-500 text-xs">user #{l.user_id ?? '—'}</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(l.timestamp).toLocaleTimeString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
