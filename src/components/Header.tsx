import { Link, useLocation } from 'react-router-dom';
import { Button } from './Button';
import { useEthers } from '../hooks/useEthers';
import { truncateAddress } from '../utils/formatters';

export function Header() {
  const { address, connect } = useEthers();
  const loc = useLocation();

  return (
    <header className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4">
      <Link to="/" className="font-bold text-lg">MonSphere</Link>
      <div className="flex items-center gap-2">
        <nav className="hidden sm:flex gap-2 mr-2 text-sm">
          {['/','/chats','/forums','/friends','/history','/settings'].map(p => (
            <Link key={p} to={p} className={`px-3 py-1 rounded-md ${loc.pathname===p?'bg-indigo-600 text-white':'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>{p.replace('/','')||'home'}</Link>
          ))}
        </nav>
        {address ? (
          <span className="px-3 py-1 rounded bg-gray-100 dark:bg-gray-800 text-sm font-mono">{truncateAddress(address)}</span>
        ) : (
          <Button onClick={connect}>Connect Wallet</Button>
        )}
      </div>
    </header>
  );
}
