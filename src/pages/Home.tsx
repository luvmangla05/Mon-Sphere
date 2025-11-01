import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useEthers } from '../hooks/useEthers';
import { useContracts } from '../hooks/useContracts';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Loader } from '../components/Loader';

export function Home() {
  const { address, connect, provider } = useEthers();
  const contracts = useContracts();

  const [checking, setChecking] = useState(false);
  const [registered, setRegistered] = useState<boolean | null>(null);
  const [username, setUsername] = useState('');
  const [pubKey, setPubKey] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const check = async () => {
      if (!contracts?.userRegistry || !address) return;
      setChecking(true);
      try {
        // Ensure contract exists at address on current network to prevent BAD_DATA
        const runnerProv: any = (contracts.userRegistry as any).runner?.provider || provider;
        const code = await runnerProv.getCode(contracts.userRegistry.target);
        if (!code || code === '0x') {
          setRegistered(null);
          return;
        }
        const exists = await contracts.userRegistry.isRegistered(address);
        setRegistered(exists);
        if (exists) {
          const prof = await contracts.userRegistry.getProfile(address);
          setUsername(prof.username);
          setPubKey(prof.pubKey);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setChecking(false);
      }
    };
    check();
  }, [contracts, address, provider]);

  const onRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contracts?.userRegistry) return;
    setSubmitting(true);
    try {
      const tx = await contracts.userRegistry.register(username, pubKey || '');
      await tx.wait();
      setRegistered(true);
    } catch (err: any) {
      alert(err?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6 items-center">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">MonSphere — Web3 Social Chat</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Decentralized 1:1 and group chats, forums, and friends — powered by smart contracts.
        </p>
        <div className="flex gap-3">
          {!address ? (
            <Button onClick={connect} size="lg">Connect Wallet</Button>
          ) : (
            <Button onClick={() => (window.location.href = '/chats')} size="lg">Go to Chats</Button>
          )}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Account</h2>
          {!address ? (
            <p className="text-gray-500">Connect your wallet to continue.</p>
          ) : checking ? (
            <div className="flex items-center gap-3"><Loader /> Checking registration…</div>
          ) : registered ? (
            <div className="text-green-600">You are registered. Explore Chats, Forums, Friends.</div>
          ) : (
            <form onSubmit={onRegister} className="space-y-3">
              <Input label="Username" placeholder="e.g. satoshi" value={username} onChange={e=>setUsername(e.target.value)} required />
              <Input label="Public Key (optional)" placeholder="Your messaging public key" value={pubKey} onChange={e=>setPubKey(e.target.value)} />
              <Button type="submit" disabled={submitting || !username}>
                {submitting ? 'Registering…' : 'Register'}
              </Button>
            </form>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
