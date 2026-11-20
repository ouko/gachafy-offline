import { Link, useLocation } from 'react-router-dom';
import { PackageOpen } from 'lucide-react';
import AudioControls from './AudioControls';

export function AppHeader() {
  const { pathname } = useLocation();
  if (pathname === '/' || pathname === '/reveal') return null;

  return (
    <header className="app-header fixed inset-x-0 top-0 z-50">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link to="/open" aria-label="GachaFi home" className="flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-pink-500 text-white shadow-lg shadow-primary/20">
            <PackageOpen className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <span className="truncate text-lg font-extrabold tracking-tight">GachaFi</span>
        </Link>
        <AudioControls />
      </div>
    </header>
  );
}
