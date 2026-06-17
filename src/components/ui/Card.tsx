'use strict';
import clsx from 'clsx';
import { ReactNode } from 'react';

/**
 * Props shared by all Card sub-components.
 * @property children   - The content to render inside the card section.
 * @property className  - Optional additional CSS classes to merge in.
 */
interface CardProps {
  children: ReactNode;
  className?: string;
}

/**
 * The root Card container. Renders a white, rounded, shadowed panel with a border.
 * Compose with CardHeader, CardTitle, and CardContent for a full card layout.
 */
export function Card({ children, className }: CardProps) {
  return (
    <div className={clsx("bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden", className)}>
      {children}
    </div>
  );
}

/**
 * The header section of a Card, separated from the body by a bottom border.
 */
export function CardHeader({ children, className }: CardProps) {
  return (
    <div className={clsx("px-6 py-5 border-b border-slate-100", className)}>
      {children}
    </div>
  );
}

/**
 * A styled heading element intended for use inside a CardHeader.
 */
export function CardTitle({ children, className }: CardProps) {
  return (
    <h3 className={clsx("text-lg font-semibold text-slate-800", className)}>
      {children}
    </h3>
  );
}

/**
 * The primary content area of a Card with consistent horizontal and vertical padding.
 */
export function CardContent({ children, className }: CardProps) {
  return (
    <div className={clsx("px-6 py-5", className)}>
      {children}
    </div>
  );
}
