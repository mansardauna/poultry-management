'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 gap-4">
      <h2 className="text-2xl font-semibold text-slate-800">Something went wrong!</h2>
      <p className="text-slate-500 text-center max-w-md">We encountered an unexpected error while processing your request.</p>
      <button
        onClick={() => reset()}
        className="bg-indigo-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-indigo-700 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
