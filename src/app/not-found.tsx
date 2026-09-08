'use strict';
import Link from 'next/link';

/** Exported function default */
export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 gap-4">
      <h2 className="text-4xl font-semibold text-slate-800">404</h2>
      <p className="text-slate-500 text-center max-w-md">The page you are looking for does not exist or has been moved.</p>
      <Link 
        href="/"
        className="bg-indigo-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-indigo-700 transition-colors"
      >
        Return Home
      </Link>
    </div>
  );
}
