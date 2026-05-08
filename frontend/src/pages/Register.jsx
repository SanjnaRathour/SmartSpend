import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, UserPlus } from 'lucide-react';
import { AuthShell, Card, Input, Button, Alert } from '../components/ui.jsx';
import { auth } from '../api';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      await auth.register(form);
      nav('/login');
    } catch (e) {
      setErr(e.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <AuthShell title="Create account" subtitle="Start managing your finances smartly">
      <Card>
        {err && <div className="mb-4"><Alert tone="error">{err}</Alert></div>}
        <form onSubmit={onSubmit} className="space-y-4">
          <Input label="Full Name" required icon={User} placeholder="John Doe"
                 value={form.name}
                 onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Email" type="email" required icon={Mail}
                 placeholder="you@example.com"
                 value={form.email}
                 onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Password" type="password" required icon={Lock}
                 placeholder="8+ chars, 1 uppercase, 1 digit"
                 value={form.password}
                 onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <Button type="submit" disabled={loading} icon={UserPlus} className="w-full">
            {loading ? 'Creating…' : 'Create account'}
          </Button>
        </form>
      </Card>

      <p className="text-center mt-6 text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="text-brand-600 hover:text-brand-700 font-semibold">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
