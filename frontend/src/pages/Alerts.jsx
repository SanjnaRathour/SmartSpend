import { useEffect, useState } from 'react';
import { AlertTriangle, Check, Trash2, ShieldAlert, TrendingUp, Percent, Info } from 'lucide-react';
import {
  PageHeader, Card, CardHeader, Badge, CenteredSpinner, EmptyState, Button,
} from '../components/ui.jsx';
import { useToast } from '../components/toast.jsx';
import { analytics, transactions } from '../api';

function StatTile({ icon: Icon, label, value, sub, tone = 'brand' }) {
  const toneCls = {
    brand:  'text-brand-600 bg-brand-50 dark:bg-brand-950/30',
    danger: 'text-red-600 bg-red-50 dark:bg-red-950/30',
    warn:   'text-amber-600 bg-amber-50 dark:bg-amber-950/30',
  }[tone];
  return (
    <Card className="!p-5">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${toneCls}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-xl font-bold tracking-tight">{value}</p>
          {sub && <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>}
        </div>
      </div>
    </Card>
  );
}

export default function Alerts() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await analytics.anomalies();
      setData(r.data);
    } catch {
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const confirmLegit = async (t) => {
    try {
      await transactions.update(t.txn_id, { is_anomaly: false });
      toast.success('Marked as legitimate — model will learn');
      load();
    } catch {
      toast.error('Update failed');
    }
  };

  const del = async (t) => {
    if (!confirm(`Delete transaction of ₹${t.amount.toLocaleString()}?`)) return;
    try {
      await transactions.delete(t.txn_id);
      toast.success('Transaction deleted');
      load();
    } catch {
      toast.error('Delete failed');
    }
  };

  if (loading) return <CenteredSpinner />;

  const stats = data?.stats || {};
  const items = data?.items || [];

  return (
    <div className="space-y-6">
      <PageHeader title="Fraud & Anomaly Alerts"
                  subtitle="Transactions the model has flagged as unusual — review and confirm" />

      <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
        <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-900 dark:text-amber-200">
          <strong>Flags are suggestions, not verdicts.</strong> The model highlights transactions that deviate
          from your usual pattern — legitimate purchases (e.g. a genuine luxury buy) may be flagged.
          Click <strong>"mark as legitimate"</strong> to teach the model; the next retrain will learn from your corrections.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatTile icon={ShieldAlert} label="Flagged transactions"
                  value={stats.count || 0}
                  tone={stats.count ? 'danger' : 'brand'} />
        <StatTile icon={TrendingUp} label="Total amount at risk"
                  value={`₹${Math.round(stats.total_amount || 0).toLocaleString()}`}
                  tone="warn" />
        <StatTile icon={Percent} label="Share of spending"
                  value={`${stats.percent_of_spend || 0}%`}
                  sub="of your total expenses" />
        <StatTile icon={AlertTriangle} label="Typical expense"
                  value={`₹${Math.round(stats.typical_expense || 0).toLocaleString()}`}
                  sub="average daily transaction" />
      </div>

      <Card className="!p-0 overflow-hidden">
        <CardHeader title="Flagged transactions"
                    right={items.length > 0 && <Badge tone="danger">{items.length}</Badge>} />
        {items.length === 0 ? (
          <EmptyState icon={ShieldAlert}
            title="No anomalies detected"
            description="Nothing unusual in your transactions. The ML model continuously scans new entries." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <tr className="text-left">
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold text-right">Amount</th>
                  <th className="px-4 py-3 font-semibold">Description</th>
                  <th className="px-4 py-3 font-semibold">Why flagged</th>
                  <th className="px-4 py-3 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((t) => (
                  <tr key={t.txn_id}
                      className="border-b border-slate-100 dark:border-slate-800 bg-amber-50/40 dark:bg-amber-950/10">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {t.txn_date}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone="brand">{t.category || '—'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold whitespace-nowrap text-red-600 dark:text-red-400">
                      ₹{t.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{t.description || '—'}</td>
                    <td className="px-4 py-3 max-w-sm">
                      <p className="text-xs text-amber-700 dark:text-amber-300 leading-snug">
                        {t.anomaly_reason || 'Flagged by ML model'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => confirmLegit(t)}
                                title="Mark as legitimate"
                                className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 p-2 rounded-lg">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => del(t)}
                                title="Delete"
                                className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 p-2 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="How anomaly detection works" />
        <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
          <p>SmartSpend uses an <strong>Isolation Forest</strong> ML model to detect transactions that deviate from your spending patterns. The model considers:</p>
          <ul className="list-disc ml-5 space-y-1">
            <li><strong>Amount magnitude</strong> — how large the transaction is compared to your typical spend</li>
            <li><strong>Merchant category</strong> — whether the category is unusual for that amount</li>
            <li><strong>Timing</strong> — day-of-week and transaction frequency</li>
          </ul>
          <p>When you mark a transaction as legitimate (<Check className="w-3 h-3 inline text-emerald-600" />), the model learns — the next 12-hourly retrain uses your correction as gold-standard data.</p>
        </div>
      </Card>
    </div>
  );
}
