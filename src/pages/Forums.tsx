import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { useContracts } from '../hooks/useContracts';

export function Forums() {
  const contracts = useContracts();
  const nav = useNavigate();
  const [openId, setOpenId] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contracts?.forums || !title.trim()) return;
    try {
      const tx = await contracts.forums.createForum(title.trim());
      const rc = await tx.wait();
      // Best effort: try to find ForumCreated event id
      const ev = rc.logs?.find((l: any) => (l.eventName === 'ForumCreated')) as any;
      if (ev && ev.args?.forumId) {
        nav(`/forums/${ev.args.forumId}`);
      } else {
        // fallback: ask user to input id
        alert('Forum created. Open it by ID.');
      }
      setShowCreate(false);
      setTitle('');
    } catch (e: any) {
      alert(e?.message || 'Failed to create forum');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Forums</h1>
        <Button onClick={()=>setShowCreate(true)}>+ Create Forum</Button>
      </div>

      <Card>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input label="Open forum by ID" placeholder="e.g. 1" value={openId} onChange={e=>setOpenId(e.target.value)} />
          </div>
          <Button onClick={()=>openId && nav(`/forums/${openId}`)} disabled={!openId.trim()}>Open</Button>
        </div>
      </Card>

      <Modal isOpen={showCreate} onClose={()=>setShowCreate(false)} title="Create Forum">
        <form onSubmit={create} className="space-y-3">
          <Input label="Title" value={title} onChange={e=>setTitle(e.target.value)} required />
          <Button type="submit" className="w-full" disabled={!title.trim()}>Create</Button>
        </form>
      </Modal>
    </div>
  );
}

