import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { TrendingUp, Calendar, Activity, Zap, Info } from 'lucide-react';
import {
  PageHeader, Card, CardHeader, CenteredSpinner, EmptyState, Badge,
} from '../components/ui.jsx';

function MetricCard({ icon: Icon, label, value, sub, tone }) {
  const toneCls = {
    brand: 'text-brand-600 bg-brand-50 dark:bg-brand-950/30',
    warn:  'text-amber-600 bg-amber-50 dark:bg-amber-950/30',
    danger:'text-red-600 bg-red-50 dark:bg-red-950/30',
    success:'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30',
  }[tone] || 'text-slate-600 bg-slate-100 dark:bg-slate-800';
  return (
    <Card className="!p-5">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${toneCls}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-xl font-bold tracking-tight truncate">{value}</p>
          {sub && <p className="text-[11px] text-slate-500 mt-0.5 truncate">{sub}</p>}
        </div>
      </div>
    </Card>
  );
}
import { themedOptions } from '../components/charts.js';
import { useTheme } from '../theme.jsx';
import { analytics } from '../api';

export default function Forecast() {
  const { theme } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analytics.forecast()
      .then((r) => setData(r.data))
      .catch((e) => setData({ error: e.response?.data?.error || 'Forecast unavailable' }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <CenteredSpinner />;

  if (!data || data.error || !Array.isArray(data.forecast) || data.forecast.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Forecast" />
        <Card>
          <EmptyState icon={Calendar}
            title={data?.error || 'No forecast yet'}
            description="Add at least 14 days of expense data to enable forecasting" />
        </Card>
      </div>
    );
  }

  const history = data.history || [];
  const forecast = data.forecast;

  const historyVsForecast = forecast[0]?.predicted && history.length
    ? ((forecast.reduce((s, f) => s + f.predicted, 0) / forecast.length) /
       (history.reduce((s, h) => s + h.amount, 0) / history.length) - 1) * 100
    : 0;

  const labels = [
    ...history.map((h) => h.date),
    ...forecast.map((f) => f.date),
  ];
  const historyLen = history.length;

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Actual (last 30 days)',
        data: [...history.map((h) => h.amount), ...Array(forecast.length).fill(null)],
        borderColor: '#64748b',
        backgroundColor: 'rgba(100,116,139,0.15)',
        fill: true, tension: 0.3, borderWidth: 2, pointRadius: 2,
      },
      {
        label: 'Predicted',
        data: [...Array(historyLen).fill(null), ...forecast.map((f) => f.predicted)],
        borderColor: '#3a5dff',
        backgroundColor: 'rgba(58,93,255,0.15)',
        fill: true, tension: 0.35, borderWidth: 2, pointRadius: 2,
      },
      {
        label: 'Upper bound',
        data: [...Array(historyLen).fill(null), ...forecast.map((f) => f.upper)],
        borderColor: '#f59e0b', borderDash: [6, 4], fill: false, pointRadius: 0, borderWidth: 1,
      },
      {
        label: 'Lower bound',
        data: [...Array(historyLen).fill(null), ...forecast.map((f) => f.lower)],
        borderColor: '#10b981', borderDash: [6, 4], fill: false, pointRadius: 0, borderWidth: 1,
      },
    ],
  };

  const peak = forecast.reduce((m, f) => (f.predicted > m.predicted ? f : m), forecast[0]);

  return (
    <div className="space-y-6">
      <PageHeader title="30-Day Forecast"
                  subtitle={`Model: ${data.model === 'prophet' ? 'Facebook Prophet' : 'Trend-aware moving average'}`} />

      <div className="flex items-start gap-3 p-4 rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-900 dark:text-blue-200">
          <strong>Forecasts are estimates, not guarantees.</strong> Accuracy improves with more transaction
          history — with under 30 days of data, predictions should be treated as rough guidance. The upper/lower
          bands on the chart show the confidence range.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={TrendingUp} label="Next 30 days"
                  value={`₹${Math.round(data.total_predicted).toLocaleString()}`}
                  tone="brand" />
        <MetricCard icon={Activity} label="Daily average"
                  value={`₹${Math.round(data.daily_avg).toLocaleString()}`} />
        <MetricCard icon={Zap} label="Peak day"
                  value={`₹${Math.round(peak.predicted).toLocaleString()}`}
                  sub={peak.date} />
        <MetricCard icon={Calendar}
                  label="Trend vs last 30"
                  value={`${historyVsForecast >= 0 ? '+' : ''}${historyVsForecast.toFixed(1)}%`}
                  tone={historyVsForecast > 10 ? 'danger' : historyVsForecast > 0 ? 'warn' : 'success'} />
      </div>

      <Card>
        <CardHeader title="History & Forecast"
                    right={<Badge tone="brand">{forecast.length} days ahead</Badge>} />
        <div className="h-96">
          <Line data={chartData} options={themedOptions(theme)} />
        </div>
      </Card>

      <Card>
        <CardHeader title="How to read this chart" />
        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc ml-5">
          <li><span className="text-slate-500 font-medium">Grey line</span> — your actual daily expenses over the last 30 days</li>
          <li><span className="text-brand-600 font-medium">Blue line</span> — predicted daily spend for the next 30 days</li>
          <li><span className="text-amber-600 font-medium">Amber dashes</span> — upper confidence bound (worst case)</li>
          <li><span className="text-emerald-600 font-medium">Green dashes</span> — lower confidence bound (best case)</li>
        </ul>
      </Card>
    </div>
  );
}
