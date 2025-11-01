export function Loader({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' } as const;
  return (
    <div className={`animate-spin ${sizes[size]} border-2 border-indigo-500 border-t-transparent rounded-full`} />
  );
}
