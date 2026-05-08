import { useEffect, useState } from 'react';
import { Pie, Line } from 'react-chartjs-2';
import { TrendingUp, TrendingDown, Wallet, AlertTriangle } from 'lucide-react';
import {
  PageHeader, Card, CardHeader, StatCard, CenteredSpinner, EmptyState,
} from '../components/ui.jsx';
import { CHART_COLORS, themedOptions, borderColorForTheme } from '../components/charts.js';
import { useTheme } from '../theme.jsx';
import { analytics } from '../api';

export default function Dashboard() {
  const { theme } = useTheme();
  const [summary, setSummary] = useState(null);
  const [byCat, setByCat] = useState([]);
  const [trend, setTrend] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, c, t, a] = await Promise.all([
          analytics.summary(), analytics.byCategory(),
          analytics.monthlyTrend(), analytics.anomalies(),
        ]);
        setSummary(s.data); setByCat(c.data);
        setTrend(t.data); setAnomalies(a.data);
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <CenteredSpinner />;

  const pieData = {
    labels: byCat.map((x) => x.category),
    datasets: [{
      data: byCat.map((x) => x.total),
      backgroundColor: CHART_COLORS,
      borderWidth: 2,
      borderColor: borderColorForTheme(theme),
    }],
  };

  const months = [...new Set(trend.map((x) => `${x.year}-${String(x.month).padStart(2, '0')}`))];
  const findT = (m, t) => trend.find((x) => `${x.year}-${String(x.month).padStart(2, '0')}` === m && x.type === t)?.total || 0;

  const trendData = {
    labels: months,
    datasets: [
      { label: 'Income', data: months.map((m) => findT(m, 'income')),
        borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)',
        tension: 0.35, fill: true },
      { label: 'Expense', data: months.map((m) => findT(m, 'expense')),
        borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)',
        tension: 0.35, fill: true },
    ],
  };

  const opts = themedOptions(theme);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Your financial overview at a glance" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={TrendingUp} label="Total Income" value={summary?.income || 0}
                  color="bg-gradient-to-br from-emerald-500 to-emerald-600" />
        <StatCard icon={TrendingDown} label="Total Expense" value={summary?.expense || 0}
                  color="bg-gradient-to-br from-red-500 to-red-600" />
        <StatCard icon={Wallet} label="Balance" value={summary?.balance || 0}
                  color="bg-gradient-to-br from-brand-500 to-brand-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Spending by Category" />
          {byCat.length
            ? <div className="h-72"><Pie data={pieData} options={opts} /></div>
            : <EmptyState title="No data yet" description="Add some transactions to see the breakdown" />}
        </Card>
        <Card>
          <CardHeader title="Monthly Trend" />
          {trend.length
            ? <div className="h-72"><Line data={trendData} options={opts} /></div>
            : <EmptyState title="No data yet" description="Need at least 1 month of data" />}
        </Card>
      </div>

      {anomalies.length > 0 && (
        <Card className="border-amber-300/60 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader
            icon={AlertTriangle}
            title={`${anomalies.length} Flagged Transaction${anomalies.length > 1 ? 's' : ''}`}
            subtitle="Unusual patterns detected by the ML model"
          />
          <ul className="space-y-2">
            {anomalies.map((a) => (
              <li key={a.txn_id}
                  className="flex items-center justify-between text-sm p-3 rounded-lg bg-white dark:bg-slate-900">
                <span className="text-slate-600 dark:text-slate-300">
                  {a.txn_date} — {a.description || 'No description'}
                </span>
                <span className="font-semibold text-amber-700 dark:text-amber-400">
                  ₹{a.amount.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
