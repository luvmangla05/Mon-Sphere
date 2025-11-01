import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useEthers } from '../hooks/useEthers';
import { useContracts } from '../hooks/useContracts';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Loader } from '../components/Loader';
import { formatDate, truncateAddress } from '../utils/formatters';

interface Session {
  id: bigint;
  a: string;
  b: string;
  closed: boolean;
  lastCid: string;
  createdAt: bigint;
}

export function History() {
  const { address } = useEthers();
  const contracts = useContracts();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (contracts && address) {
      loadSessions();
      const interval = setInterval(loadSessions, 10000);
      return () => clearInterval(interval);
    }
  }, [contracts, address]);

  const loadSessions = async () => {
    if (!contracts?.chats || !address) return;
    try {
      setLoading(true);
      const list: bigint[] = await contracts.chats.getMySessions(address);
      const data: Session[] = [];

      for (const id of list) {
        try {
          const s = await contracts.chats.sessions(id);
          data.push({
            id,
            a: s.a,
            b: s.b,
            closed: s.closed,
            lastCid: s.lastCid,
            createdAt: s.createdAt || BigInt(0),
          });
        } catch (error) {
          console.error('Error loading session:', error);
        }
      }

      setSessions(
        data.sort((x, y) => Number(y.createdAt) - Number(x.createdAt))
      );
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (sessionId: bigint) => {
    if (!contracts?.chats) return;
    if (!confirm('Are you sure you want to close this session?')) return;

    try {
      const tx = await contracts.chats.endSession(sessionId);
      await tx.wait();
      loadSessions();
    } catch (error: any) {
      console.error('Error closing session:', error);
      alert(error?.message || 'Failed to close session');
    }
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Session History</h1>
      </div>

      {sessions.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-6xl mb-4">📜</div>
          <p className="text-gray-500 dark:text-gray-400">No chat sessions yet</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const otherMember = session.a?.toLowerCase() === address?.toLowerCase()
              ? session.b
              : session.a;
            
            return (
              <motion.div
                key={session.id.toString()}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">💬</span>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {otherMember}
                        </h3>
                      </div>
                      <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
                        <p>1:1 Chat</p>
                        <p>Created: {formatDate(session.createdAt)}</p>
                        {session.closed && (
                          <p className="text-red-600 dark:text-red-400">Closed</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => deleteSession(session.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

