import clsx from 'clsx';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={clsx("bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return (
    <div className={clsx("px-6 py-5 border-b border-slate-100", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: CardProps) {
  return (
    <h3 className={clsx("text-lg font-semibold text-slate-800", className)}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className }: CardProps) {
  return (
    <div className={clsx("px-6 py-5", className)}>
      {children}
    </div>
  );
}
