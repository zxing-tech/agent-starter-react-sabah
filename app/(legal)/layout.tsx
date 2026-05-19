import Link from 'next/link';

interface LegalLayoutProps {
  children: React.ReactNode;
}

export default function LegalLayout({ children }: LegalLayoutProps) {
  return (
    <div className="flex min-h-screen items-start justify-center bg-slate-900 px-4 py-12">
      <div className="w-full max-w-2xl">
        <Link
          href="/register"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-300 transition-colors"
        >
          &larr; Back to Register
        </Link>
        <div className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-slate-300 prose-li:text-slate-300 prose-a:text-blue-400 prose-strong:text-white">
          {children}
        </div>
      </div>
    </div>
  );
}
