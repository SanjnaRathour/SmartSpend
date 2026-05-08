import { useEffect, useState } from 'react';
import { Target, Plus, Trash2 } from 'lucide-react';
import {
  PageHeader, Card, CardHeader, Input, Select, Button, Badge, CenteredSpinner, EmptyState,
} from '../components/ui.jsx';
import Modal, { ConfirmModal } from '../components/Modal.jsx';
import { useToast } from '../components/toast.jsx';
import { budgets } from '../api';

function BudgetCard({ b, onDelete }) {
  const pct = Math.min((b.spent / b.limit_amt) * 100, 999);
  const over = b.spent > b.limit_amt;
  const barColor = over ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <Card>
      <div className="flex items-start justify-between mb-3">
        <div>
          <Badge tone="brand">{b.category}</Badge>
          <p className="text-2xl font-bold mt-2">
            ₹{b.spent.toLocaleString()}
            <span className="text-sm font-normal text-slate-500"> / ₹{b.limit_amt.toLocaleString()}</span>
          </p>
        </div>
        <button onClick={() => onDelete(b)}
                className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 p-2 rounded-lg">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <p className={`text-xs mt-2 ${over ? 'text-red-600' : 'text-slate-500'}`}>
        {over ? `Over by ₹${(b.spent - b.limit_amt).toLocaleString()}` : `${pct.toFixed(0)}% used`}
      </p>
    </Card>
  );
}

function AddBudgetModal({ open, onClose, onSaved, categories, month }) {
  const toast = useToast();
  const [cat_id, setCatId] = useState('');
  const [limit_amt, setLimit] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!cat_id || !limit_amt) return;
    try {
      await budgets.upsert({ cat_id, limit_amt: parseFloat(limit_amt), month });
      toast.success('Budget set');
      onSaved(); onClose();
      setCatId(''); setLimit('');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Set budget for this month"
           footer={<>
             <Button variant="secondary" onClick={onClose}>Cancel</Button>
             <Button onClick={submit}>Save budget</Button>
           </>}>
      <form onSubmit={submit} className="space-y-4">
        <Select label="Category" value={cat_id} onChange={(e) => setCatId(e.target.value)}>
          <option value="">Choose…</option>
          {categories.map((c) => <option key={c.cat_id} value={c.cat_id}>{c.name}</option>)}
        </Select>
        <Input label="Monthly limit (₹)" type="number" step="0.01" required
               placeholder="5000" value={limit_amt}
               onChange={(e) => setLimit(e.target.value)} />
      </form>
    </Modal>
  );
}

export default function Budgets() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const currentMonth = new Date().toISOString().slice(0, 7); // "2026-04"

  const load = async () => {
    setLoading(true);
    try {
      const [b, c] = await Promise.all([
        budgets.list(currentMonth), budgets.categories(),
      ]);
      setItems(b.data); setCategories(c.data);
    } catch (e) { toast.error('Failed to load budgets'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const del = async () => {
    try {
      await budgets.delete(toDelete.budget_id);
      toast.success('Budget deleted');
      load();
    } catch (e) { toast.error('Delete failed'); }
  };

  if (loading) return <CenteredSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budgets"
        subtitle={`Set & track monthly limits for ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`}
        action={<Button icon={Plus} onClick={() => setOpenAdd(true)}>Set Budget</Button>}
      />

      {items.length === 0 ? (
        <Card>
          <EmptyState icon={Target} title="No budgets yet"
                      description="Set your first budget to track spending against goals" />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((b) => <BudgetCard key={b.budget_id} b={b} onDelete={setToDelete} />)}
        </div>
      )}

      <AddBudgetModal open={openAdd} onClose={() => setOpenAdd(false)}
                      onSaved={load} categories={categories} month={currentMonth} />
      <ConfirmModal open={!!toDelete} onClose={() => setToDelete(null)}
                    onConfirm={del} title="Delete budget?"
                    message={toDelete ? `Remove budget for ${toDelete.category}?` : ''}
                    confirmText="Delete" />
    </div>
  );
}
