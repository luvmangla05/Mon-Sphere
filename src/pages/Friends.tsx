import { useState } from 'react';
import { useEthers } from '../hooks/useEthers';
import { useContracts } from '../hooks/useContracts';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { truncateAddress } from '../utils/formatters';

// FriendSystem.RequestStatus: 0 NONE, 1 SENT, 2 RECEIVED, 3 FRIENDS
const STATUS = { NONE: 0, SENT: 1, RECEIVED: 2, FRIENDS: 3 } as const;

export function Friends() {
  const { address } = useEthers();
  const contracts = useContracts();

  const [username, setUsername] = useState('');
  const [found, setFound] = useState<string>('');
  const [relation, setRelation] = useState<number>(STATUS.NONE);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const lookup = async () => {
    if (!contracts?.userRegistry || !username.trim()) return;
    setLoading(true);
    try {
      const addr: string = await contracts.userRegistry.addressOfUsername(username.trim());
      if (!addr || addr === '0x0000000000000000000000000000000000000000') {
        setFound('');
        setRelation(STATUS.NONE);
        return;
      }
      setFound(addr);
      if (address && contracts.friendSystem) {
        const rel: number = await contracts.friendSystem.getRelation(address, addr);
        setRelation(Number(rel));
      }
    } catch (e) {
      setFound('');
      setRelation(STATUS.NONE);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async () => {
    if (!contracts?.friendSystem || !found) return;
    setActionLoading(true);
    try {
      const tx = await contracts.friendSystem.sendFriendRequest(found);
      await tx.wait();
      setRelation(STATUS.SENT);
    } catch (e: any) {
      alert(e?.message || 'Failed to send request');
    } finally {
      setActionLoading(false);
    }
  };

  const accept = async () => {
    if (!contracts?.friendSystem || !found) return;
    setActionLoading(true);
    try {
      const tx = await contracts.friendSystem.acceptFriendRequest(found);
      await tx.wait();
      setRelation(STATUS.FRIENDS);
    } catch (e: any) {
      alert(e?.message || 'Failed to accept');
    } finally {
      setActionLoading(false);
    }
  };

  const decline = async () => {
    if (!contracts?.friendSystem || !found) return;
    setActionLoading(true);
    try {
      const tx = await contracts.friendSystem.declineFriendRequest(found);
      await tx.wait();
      setRelation(STATUS.NONE);
    } catch (e: any) {
      alert(e?.message || 'Failed to decline');
    } finally {
      setActionLoading(false);
    }
  };

  const remove = async () => {
    if (!contracts?.friendSystem || !found) return;
    if (!confirm('Remove this friend?')) return;
    setActionLoading(true);
    try {
      const tx = await contracts.friendSystem.removeFriend(found);
      await tx.wait();
      setRelation(STATUS.NONE);
    } catch (e: any) {
      alert(e?.message || 'Failed to remove');
    } finally {
      setActionLoading(false);
    }
  };

  const isSelf = found && address && found.toLowerCase() === address.toLowerCase();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Friends</h1>

      <Card>
        <div className="space-y-3">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Input label="Search by username" value={username} onChange={e=>setUsername(e.target.value)} placeholder="e.g. satoshi" />
            </div>
            <Button onClick={lookup} disabled={!username.trim() || loading}>{loading ? 'Searching…' : 'Search'}</Button>
          </div>

          {found ? (
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">User</div>
                  <div className="font-mono">{truncateAddress(found)}{isSelf && ' (you)'}</div>
                </div>
                <div className="flex gap-2">
                  {isSelf ? (
                    <span className="text-gray-500 text-sm">This is you</span>
                  ) : relation === STATUS.NONE ? (
                    <Button onClick={sendRequest} disabled={actionLoading}>Send Request</Button>
                  ) : relation === STATUS.SENT ? (
                    <span className="text-sm text-gray-500">Request sent</span>
                  ) : relation === STATUS.RECEIVED ? (
                    <><Button onClick={accept} disabled={actionLoading}>Accept</Button>
                      <Button variant="secondary" onClick={decline} disabled={actionLoading}>Decline</Button>
                    </>
                  ) : (
                    <Button variant="danger" onClick={remove} disabled={actionLoading}>Remove Friend</Button>
                  )}
                </div>
              </div>
            </Card>
          ) : (
            <div className="text-sm text-gray-500">No user selected</div>
          )}
        </div>
      </Card>
    </div>
  );
}
