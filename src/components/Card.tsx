import React from 'react';

export function Card({ children, className = '', onClick, hover }: { children: React.ReactNode; className?: string; onClick?: () => void; hover?: boolean }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm ${hover ? 'transition-colors hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
