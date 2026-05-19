import { SignOutButton } from '@/components/sign-out-button';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default async function AppLayout({ children }: AppLayoutProps) {
  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <a href="/" className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-white">
              Healthier <span className="text-primary">Sabah</span>
            </span>
          </a>
          <nav className="flex items-center gap-1">
            <a
              href="/"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            >
              Home
            </a>
            <a
              href="/progress"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            >
              Progress
            </a>
            <a
              href="/history"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            >
              History
            </a>
            <div className="ml-2 hidden sm:block">
              <SignOutButton />
            </div>
          </nav>
        </div>
      </header>
      <div className="pt-14">{children}</div>
    </>
  );
}
