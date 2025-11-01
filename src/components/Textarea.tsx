import React from 'react';

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string };

export function Textarea({ label, error, className = '', ...rest }: Props) {
  return (
    <label className="block space-y-1">
      {label && <span className="text-sm text-gray-600 dark:text-gray-300">{label}</span>}
      <textarea
        className={`w-full min-h-[100px] p-3 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${className}`}
        {...rest}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </label>
  );
}
