import { Link, useLocation } from 'react-router-dom';

const items = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/chats', label: 'Chats', icon: '💬' },
  { to: '/forums', label: 'Forums', icon: '🧵' },
  { to: '/friends', label: 'Friends', icon: '👥' },
  { to: '/history', label: 'History', icon: '📜' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export function Sidebar() {
  const loc = useLocation();
  return (
    <aside className="hidden md:block w-64 border-r border-gray-200 dark:border-gray-800 p-4 space-y-2">
      {items.map(i => (
        <Link key={i.to} to={i.to} className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${loc.pathname===i.to? 'bg-indigo-600 text-white':'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
          <span>{i.icon}</span>
          <span className="font-medium">{i.label}</span>
        </Link>
      ))}
    </aside>
  );
}
