import { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useEthers } from '../hooks/useEthers';
import { useContracts } from '../hooks/useContracts';

export function Settings() {
  const { disconnect } = useEthers();
  const contracts = useContracts();
  const [dark, setDark] = useState<boolean>(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const isDark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const deleteAccount = async () => {
    if (!contracts?.userRegistry) return;
    if (!confirm('Permanently delete your account? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const tx = await contracts.userRegistry.deleteAccount();
      await tx.wait();
      alert('Account deleted.');
    } catch (e: any) {
      alert(e?.message || 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">Theme</div>
            <div className="text-sm text-gray-500">Light / Dark</div>
          </div>
          <Button variant="secondary" onClick={toggleTheme}>{dark ? 'Switch to Light' : 'Switch to Dark'}</Button>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">Disconnect Wallet</div>
            <div className="text-sm text-gray-500">Clear local connection state</div>
          </div>
          <Button variant="secondary" onClick={disconnect}>Disconnect</Button>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-red-600">Delete Account</div>
            <div className="text-sm text-gray-500">This action is irreversible</div>
          </div>
          <Button variant="danger" onClick={deleteAccount} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete Account'}</Button>
        </div>
      </Card>
    </div>
  );
}
