import React from 'react';

type Tab = { key: string; label: string };

export function Tabs({ tabs, active, onChange }: { tabs: Tab[]; active: string; onChange: (k: string) => void }) {
  return (
    <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-4 py-2 -mb-px border-b-2 transition-colors ${active === t.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
