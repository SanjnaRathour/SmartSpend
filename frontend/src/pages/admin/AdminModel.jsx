import { useEffect, useState } from 'react';
import { Brain, RefreshCw, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  PageHeader, Card, CardHeader, Badge, Button, CenteredSpinner,
} from '../../components/ui.jsx';
import { ConfirmModal } from '../../components/Modal.jsx';
import { useToast } from '../../components/toast.jsx';
import { admin } from '../../api';

const STATUS_TONE = { ok: 'success', failed: 'danger', error: 'danger', running: 'warning', never: 'neutral' };

export default function AdminModel() {
  const toast = useToast();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await admin.modelInfo();
      setInfo(data);
    } catch (e) { toast.error('Failed to load model info'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const retrain = async () => {
    setRetraining(true);
    toast.info('Retraining started — this may take up to 60 seconds');
    try {
      const { data } = await admin.retrain();
      toast.success(`Retrain ${data.status}`);
      load();
    } catch (e) {
      toast.error(e.response?.data?.output || 'Retrain failed');
    } finally { setRetraining(false); }
  };

  if (loading) return <CenteredSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="ML Model"
        subtitle="Retrain pipeline status and manual trigger"
        action={<Badge tone="warning">ADMIN</Badge>}
      />

      <Card>
        <CardHeader title="Auto-retrain scheduler" icon={Clock} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-slate-500 mb-1">Enabled</p>
            <Badge tone={info?.enabled ? 'success' : 'neutral'}>
              {info?.enabled ? 'ON' : 'OFF'}
            </Badge>
          </div>
          <div>
            <p className="text-slate-500 mb-1">Interval</p>
            <p className="font-semibold">Every {info?.interval_hours} hours</p>
          </div>
          <div>
            <p className="text-slate-500 mb-1">Next run</p>
            <p className="font-semibold">
              {info?.next_run ? new Date(info.next_run).toLocaleString() : '—'}
            </p>
          </div>
        </div>
        {!info?.enabled && (
          <p className="mt-4 text-xs text-slate-500">
            Enable by setting <code>SCHEDULER_ENABLED=true</code> in backend <code>.env</code> and restarting.
          </p>
        )}
      </Card>

      <Card>
        <CardHeader title="Last training run" icon={Brain}
          action={
            <Button icon={RefreshCw} onClick={() => setConfirm(true)} disabled={retraining}>
              {retraining ? 'Retraining…' : 'Retrain now'}
            </Button>
          }
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-slate-500 mb-1">Status</p>
            <Badge tone={STATUS_TONE[info?.status] || 'neutral'}>
              {info?.status === 'ok' && <CheckCircle2 className="w-3 h-3" />}
              {(info?.status === 'failed' || info?.status === 'error') && <AlertCircle className="w-3 h-3" />}
              {info?.status}
            </Badge>
          </div>
          <div>
            <p className="text-slate-500 mb-1">Started</p>
            <p>{info?.started_at ? new Date(info.started_at).toLocaleString() : '—'}</p>
          </div>
          <div>
            <p className="text-slate-500 mb-1">Finished</p>
            <p>{info?.finished_at ? new Date(info.finished_at).toLocaleString() : '—'}</p>
          </div>
        </div>
        {info?.output && (
          <pre className="mt-4 p-3 bg-slate-950 text-slate-100 rounded-lg text-xs overflow-x-auto max-h-64">
            {info.output}
          </pre>
        )}
      </Card>

      <Card>
        <CardHeader title="Training data sources" icon={Brain} />
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
            <div><strong>Realistic merchant data</strong> — bundled ISO 18245 MCC patterns (Zomato, Uber, Amazon, etc.) × 10 categories</div>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
            <div><strong>Faker (en_IN)</strong> — adds realistic Indian cities, reference numbers, noise</div>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
            <div><strong>User-confirmed transactions</strong> — gold-standard labels from the live DB (descriptions decrypted on-the-fly)</div>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
            <div><strong>Data augmentation</strong> — token shuffling + noise-word injection (~3× multiplier)</div>
          </li>
        </ul>
      </Card>

      <ConfirmModal
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={retrain}
        title="Retrain ML models now?"
        message="This rebuilds the categoriser & anomaly detector. Takes ~30-60 seconds and runs in the background. The API will briefly use the old models until the new ones are loaded."
        confirmText="Retrain"
        variant="primary"
      />
    </div>
  );
}
