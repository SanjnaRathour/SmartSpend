import { useEffect, useState } from 'react';
import { User, Lock, Save } from 'lucide-react';
import {
  PageHeader, Card, CardHeader, Input, Button, Badge, CenteredSpinner,
} from '../components/ui.jsx';
import { useToast } from '../components/toast.jsx';
import { profile } from '../api';

export default function Profile() {
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    profile.me().then((r) => {
      setUser(r.data); setName(r.data.name);
    });
  }, []);

  const updateName = async () => {
    setSaving(true);
    try {
      const { data } = await profile.updateName(name);
      setUser(data);
      toast.success('Profile updated');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Update failed');
    } finally { setSaving(false); }
  };

  const changePw = async (e) => {
    e.preventDefault();
    if (pw.next !== pw.confirm) return toast.error('Passwords do not match');
    try {
      await profile.changePassword(pw.current, pw.next);
      toast.success('Password changed');
      setPw({ current: '', next: '', confirm: '' });
    } catch (e) {
      toast.error(e.response?.data?.error || 'Change failed');
    }
  };

  if (!user) return <CenteredSpinner />;

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Profile" subtitle="Manage your account" />

      <Card>
        <CardHeader title="Account info" icon={User} />
        <div className="space-y-4">
          <Input label="Email (read-only)" value={user.email} disabled />
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Role:</span>
            <Badge tone={user.role === 'admin' ? 'warning' : 'brand'}>{user.role}</Badge>
          </div>
          <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Button icon={Save} onClick={updateName} disabled={saving || name === user.name}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader title="Change password" icon={Lock} />
        <form onSubmit={changePw} className="space-y-4">
          <Input label="Current password" type="password" required
                 value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
          <Input label="New password" type="password" required
                 placeholder="8+ chars, 1 uppercase, 1 digit"
                 value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
          <Input label="Confirm new password" type="password" required
                 value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
          <Button type="submit" icon={Lock}>Update password</Button>
        </form>
      </Card>
    </div>
  );
}
