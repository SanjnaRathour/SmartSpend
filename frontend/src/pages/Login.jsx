import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import { AuthShell, Card, Input, Button, Alert } from '../components/ui.jsx';
import { auth } from '../api';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const { data } = await auth.login(form);
      localStorage.setItem('token', data.token);
      nav('/');
    } catch (e) {
      setErr(e.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your SmartSpend account">
      <Card>
        {err && <div className="mb-4"><Alert tone="error">{err}</Alert></div>}
        <form onSubmit={onSubmit} className="space-y-4">
          <Input label="Email" type="email" required icon={Mail}
                 placeholder="you@example.com"
                 value={form.email}
                 onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Password" type="password" required icon={Lock}
                 placeholder="••••••••"
                 value={form.password}
                 onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <Button type="submit" disabled={loading} icon={LogIn} className="w-full">
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <div className="mt-4">
          <Alert tone="info">
            <div className="text-xs space-y-1">
              <div><strong>Demo accounts</strong> (password: <code>Demo@1234</code>)</div>
              <div>• <code>demo@smartspend.local</code> — populated</div>
              <div>• <code>demo2@smartspend.local</code> — empty</div>
              <div>• <code>admin@smartspend.local</code> — admin</div>
            </div>
          </Alert>
        </div>
      </Card>

      <p className="text-center mt-6 text-sm text-slate-500">
        No account?{' '}
        <Link to="/register" className="text-brand-600 hover:text-brand-700 font-semibold">
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}
