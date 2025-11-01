import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useEthers } from '../hooks/useEthers';
import { useContracts } from '../hooks/useContracts';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Textarea } from '../components/Textarea';
import { Loader } from '../components/Loader';
import { truncateAddress, formatDate } from '../utils/formatters';
import { useInterval } from '../utils/useInterval';

interface SessionRow {
  id: bigint;
  a: string;
  b: string;
  closed: boolean;
  lastCid: string;
  createdAt: bigint;
}

export function Chats() {
  const { address } = useEthers();
  const contracts = useContracts();

  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [active, setActive] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(true);
  const [newPeer, setNewPeer] = useState('');
  const [msg, setMsg] = useState('');

  // Group state
  const [groupName, setGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState(''); // comma-separated addresses
  const [groupId, setGroupId] = useState('');
  const [memberAddr, setMemberAddr] = useState('');
  const [groupMsg, setGroupMsg] = useState('');

  const activeSession = useMemo(() => sessions.find(s => s.id === active) || null, [sessions, active]);

  const loadSessions = async () => {
    if (!contracts?.chats || !address) return;
    try {
      setLoading(true);
      const ids: bigint[] = await contracts.chats.getMySessions(address);
      const rows: SessionRow[] = [];
      for (const id of ids) {
        const s = await contracts.chats.sessions(id);
        rows.push({
          id,
          a: s.a,
          b: s.b,
          closed: s.closed,
          lastCid: s.lastCid,
          createdAt: s.createdAt || BigInt(0),
        });
      }
      rows.sort((x, y) => Number(y.createdAt) - Number(x.createdAt));
      setSessions(rows);
      if (rows.length && !active) setActive(rows[0].id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [contracts, address]);

  useInterval(() => {
    if (!contracts?.chats || !active) return;
    (async () => {
      try {
        const last = await contracts.chats.getLastCid(active);
        setSessions(prev => prev.map(s => (s.id === active ? { ...s, lastCid: last } : s)));
      } catch {}
    })();
  }, 5000);

  const create1to1 = async () => {
    if (!contracts?.chats || !newPeer) return;
    try {
      const tx = await contracts.chats.createSession(newPeer);
      await tx.wait();
      setNewPeer('');
      loadSessions();
    } catch (e: any) {
      alert(e?.message || 'Failed to create session');
    }
  };

  const send = async () => {
    if (!contracts?.chats || !active || !msg.trim()) return;
    try {
      const tx = await contracts.chats.sendMessage(active, msg.trim());
      await tx.wait();
      setMsg('');
      loadSessions();
    } catch (e: any) {
      alert(e?.message || 'Failed to send');
    }
  };

  const end = async () => {
    if (!contracts?.chats || !active) return;
    if (!confirm('End this session?')) return;
    try {
      const tx = await contracts.chats.endSession(active);
      await tx.wait();
      loadSessions();
    } catch (e: any) {
      alert(e?.message || 'Failed to end session');
    }
  };

  // Group helpers (IDs must be known externally; contract has no lister)
  const createGroup = async () => {
    if (!contracts?.chats || !groupName.trim()) return;
    try {
      const members = groupMembers.split(',').map(s => s.trim()).filter(Boolean);
      const tx = await contracts.chats.createGroup(groupName.trim(), members);
      await tx.wait();
      setGroupName('');
      setGroupMembers('');
      alert('Group created');
    } catch (e: any) {
      alert(e?.message || 'Failed to create group');
    }
  };

  const addMember = async () => {
    if (!contracts?.chats || !groupId || !memberAddr) return;
    try {
      const tx = await contracts.chats.addMember(BigInt(groupId), memberAddr);
      await tx.wait();
      setMemberAddr('');
      alert('Member added');
    } catch (e: any) {
      alert(e?.message || 'Failed to add member');
    }
  };

  const removeMember = async () => {
    if (!contracts?.chats || !groupId || !memberAddr) return;
    try {
      const tx = await contracts.chats.removeMember(BigInt(groupId), memberAddr);
      await tx.wait();
      setMemberAddr('');
      alert('Member removed');
    } catch (e: any) {
      alert(e?.message || 'Failed to remove member');
    }
  };

  const sendGroup = async () => {
    if (!contracts?.chats || !groupId || !groupMsg.trim()) return;
    try {
      const tx = await contracts.chats.sendGroupMessage(BigInt(groupId), groupMsg.trim());
      await tx.wait();
      setGroupMsg('');
      alert('Message sent');
    } catch (e: any) {
      alert(e?.message || 'Failed to send message');
    }
  };

  return (
    <div className="grid md:grid-cols-[320px,1fr] gap-4">
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">My Chats</h2>
          <Button variant="secondary" onClick={loadSessions}>Refresh</Button>
        </div>

        <div className="space-y-2">
          <div className="flex gap-2">
            <Input placeholder="0x peer address" value={newPeer} onChange={e=>setNewPeer(e.target.value)} />
            <Button onClick={create1to1}>New</Button>
          </div>
        </div>

        <div className="mt-4 space-y-2 max-h-[60vh] overflow-auto">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500"><Loader /> Loading…</div>
          ) : sessions.length === 0 ? (
            <div className="text-sm text-gray-500">No sessions yet</div>
          ) : (
            sessions.map(s => {
              const other = s.a.toLowerCase() === address?.toLowerCase() ? s.b : s.a;
              return (
                <button key={s.id.toString()} onClick={()=>setActive(s.id)} className={`w-full text-left p-3 rounded-md border ${active===s.id? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950' : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-sm">{truncateAddress(other)}</div>
                    <div className="text-xs text-gray-500">{formatDate(s.createdAt)}</div>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300 truncate">{s.lastCid || 'No messages yet'}</div>
                </button>
              );
            })
          )}
        </div>

        <div className="mt-6">
          <h3 className="font-semibold mb-2">Groups</h3>
          <div className="space-y-2">
            <Input placeholder="Group name" value={groupName} onChange={e=>setGroupName(e.target.value)} />
            <Input placeholder="Members (comma addresses)" value={groupMembers} onChange={e=>setGroupMembers(e.target.value)} />
            <Button onClick={createGroup}>Create Group</Button>
          </div>
          <div className="mt-3 space-y-2">
            <Input placeholder="Group ID" value={groupId} onChange={e=>setGroupId(e.target.value)} />
            <Input placeholder="Member address" value={memberAddr} onChange={e=>setMemberAddr(e.target.value)} />
            <div className="flex gap-2">
              <Button variant="secondary" onClick={addMember}>Add</Button>
              <Button variant="secondary" onClick={removeMember}>Remove</Button>
            </div>
            <Textarea placeholder="Group message (cid/text)" value={groupMsg} onChange={e=>setGroupMsg(e.target.value)} />
            <Button onClick={sendGroup}>Send to Group</Button>
          </div>
        </div>
      </Card>

      <div>
        {activeSession ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Active session</div>
                  <div className="font-mono">{truncateAddress(activeSession.a.toLowerCase()===address?.toLowerCase()? activeSession.b : activeSession.a)}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="danger" onClick={end} disabled={activeSession.closed}>End</Button>
                </div>
              </div>
            </Card>

            <div className="mt-4 space-y-3">
              <Card>
                <div className="text-sm text-gray-500 mb-2">Latest message (from chain lastCid)</div>
                <div className="whitespace-pre-wrap min-h-[120px] font-mono text-sm">{activeSession.lastCid || '—'}</div>
              </Card>

              <Card>
                <div className="space-y-2">
                  <Textarea placeholder="Type message (stored as cid string)" value={msg} onChange={e=>setMsg(e.target.value)} />
                  <div className="flex justify-end">
                    <Button onClick={send}>Send</Button>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>
        ) : (
          <Card>
            <div className="text-gray-500">Select or create a session</div>
          </Card>
        )}
      </div>
    </div>
  );
}
