import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEthers } from '../hooks/useEthers';
import { truncateAddress } from '../utils/formatters';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/chats', label: 'Chats', icon: '💬' },
  { path: '/forums', label: 'Forums', icon: '📝' },
  { path: '/friends', label: 'Friends', icon: '👥' },
  { path: '/history', label: 'History', icon: '📜' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { address, connect } = useEthers();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
            MonSphere
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Web3 Social Platform</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {address ? (
            <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Connected</p>
              <p className="text-sm font-mono text-gray-900 dark:text-gray-100">
                {truncateAddress(address)}
              </p>
            </div>
          ) : (
            <button
              onClick={connect}
              className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

