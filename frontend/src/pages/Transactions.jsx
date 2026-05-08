import { useEffect, useState } from 'react';
import { Plus, Upload, Trash2, AlertTriangle, Search, FileText, Check } from 'lucide-react';
import {
  PageHeader, Card, Input, Select, Button, Badge,
} from '../components/ui.jsx';
import Modal, { ConfirmModal } from '../components/Modal.jsx';
import { useToast } from '../components/toast.jsx';
import { transactions } from '../api';

function TxnRow({ t, onDelete, onConfirmLegit }) {
  return (
    <tr className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
        t.is_anomaly ? 'bg-amber-50/40 dark:bg-amber-950/10' : ''
      }`}>
      <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">{t.txn_date}</td>
      <td className="px-4 py-3">
        <Badge tone={t.type === 'income' ? 'success' : 'danger'}>{t.type}</Badge>
      </td>
      <td className="px-4 py-3"><Badge tone="brand">{t.category || '—'}</Badge></td>
      <td className="px-4 py-3 font-semibold text-right whitespace-nowrap">
        ₹{t.amount.toLocaleString()}
      </td>
      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{t.description}</td>
      <td className="px-4 py-3 max-w-xs">
        {t.is_anomaly && (
          <div>
            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs cursor-help"
                  title={t.anomaly_reason || 'Flagged as anomalous'}>
              <AlertTriangle className="w-4 h-4" />
              Flagged
            </span>
            {t.anomaly_reason && (
              <div className="mt-1 text-[11px] text-amber-700 dark:text-amber-300 leading-tight">
                {t.anomaly_reason}
              </div>
            )}
            <button onClick={() => onConfirmLegit(t)}
                    className="mt-1 inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline">
              <Check className="w-3 h-3" /> This is legitimate
            </button>
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <button onClick={() => onDelete(t)}
                className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 p-2 rounded-lg">
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}

function AddTxnModal({ open, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({
    amount: '', type: 'expense', description: '',
    txn_date: new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.amount) return;
    setSaving(true);
    try {
      const { data } = await transactions.create({ ...form, amount: parseFloat(form.amount) });
      toast.success(`Added — auto-categorised as ${data.category || 'Other'}`);
      onSaved();
      onClose();
      setForm({ ...form, amount: '', description: '' });
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to add');
    } finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Transaction"
           footer={<>
             <Button variant="secondary" onClick={onClose}>Cancel</Button>
             <Button onClick={submit} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
           </>}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Date" type="date" required value={form.txn_date} onChange={set('txn_date')} />
          <Select label="Type" value={form.type} onChange={set('type')}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </Select>
        </div>
        <Input label="Amount (₹)" type="number" step="0.01" required
               placeholder="0.00" value={form.amount} onChange={set('amount')} />
        <Input label="Description" placeholder="e.g., Zomato dinner"
               value={form.description} onChange={set('description')} />
        <p className="text-xs text-slate-500">
          🤖 ML will auto-categorise based on the description.
        </p>
      </form>
    </Modal>
  );
}

function ImportCsvModal({ open, onClose, onImported }) {
  const toast = useToast();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const upload = async () => {
    if (!file) return toast.error('Choose a CSV file first');
    setUploading(true);
    try {
      const { data } = await transactions.importCsv(file);
      toast.success(`✓ Imported ${data.inserted} rows${data.errors.length ? `, ${data.errors.length} errors` : ''}`);
      onImported();
      onClose();
      setFile(null);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Import failed');
    } finally { setUploading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Import Transactions from CSV"
           footer={<>
             <Button variant="secondary" onClick={onClose}>Cancel</Button>
             <Button onClick={upload} disabled={!file || uploading}>
               {uploading ? 'Uploading…' : 'Upload'}
             </Button>
           </>}>
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
          <p className="text-sm font-medium mb-2">Required columns:</p>
          <code className="text-xs block bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
            txn_date, amount, type, description
          </code>
          <p className="text-xs text-slate-500 mt-2">Example: <code>2026-03-02,350,expense,Zomato biryani</code></p>
        </div>

        <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 cursor-pointer hover:border-brand-500 transition-colors">
          <FileText className="w-10 h-10 text-slate-400 mb-2" />
          <p className="text-sm font-medium">
            {file ? file.name : 'Click to choose CSV file'}
          </p>
          <p className="text-xs text-slate-500 mt-1">Max 5 MB</p>
          <input type="file" accept=".csv" className="hidden"
                 onChange={(e) => setFile(e.target.files[0])} />
        </label>
      </div>
    </Modal>
  );
}

export default function Transactions() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [openImport, setOpenImport] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await transactions.list();
      setItems(data.items);
    } catch (e) {
      toast.error('Failed to load transactions');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const del = async () => {
    try {
      await transactions.delete(toDelete.txn_id);
      toast.success('Transaction deleted');
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Delete failed');
    }
  };

  const confirmLegit = async (t) => {
    try {
      await transactions.update(t.txn_id, { is_anomaly: false });
      toast.success('Marked as legitimate — the model will learn from this');
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Update failed');
    }
  };

  const filtered = items.filter((t) =>
    !query || t.description?.toLowerCase().includes(query.toLowerCase())
           || t.category?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        subtitle="Add, import, and manage your transactions"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" icon={Upload} onClick={() => setOpenImport(true)}>
              Import CSV
            </Button>
            <Button icon={Plus} onClick={() => setOpenAdd(true)}>Add</Button>
          </div>
        }
      />

      <Card className="!p-4">
        <Input icon={Search} placeholder="Search by description or category…"
               value={query} onChange={(e) => setQuery(e.target.value)} />
      </Card>

      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold text-right">Amount</th>
                <th className="px-4 py-3 font-semibold">Description</th>
                <th className="px-4 py-3 font-semibold">Flag</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="7" className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>}
              {!loading && filtered.length === 0 &&
                <tr><td colSpan="7" className="px-4 py-8 text-center text-slate-400">No transactions yet</td></tr>}
              {filtered.map((t) => <TxnRow key={t.txn_id} t={t} onDelete={setToDelete} onConfirmLegit={confirmLegit} />)}
            </tbody>
          </table>
        </div>
      </Card>

      <AddTxnModal open={openAdd} onClose={() => setOpenAdd(false)} onSaved={load} />
      <ImportCsvModal open={openImport} onClose={() => setOpenImport(false)} onImported={load} />
      <ConfirmModal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={del}
        title="Delete transaction?"
        message={toDelete ? `This will permanently delete "${toDelete.description || 'this transaction'}" for ₹${toDelete.amount}.` : ''}
        confirmText="Delete"
      />
    </div>
  );
}
