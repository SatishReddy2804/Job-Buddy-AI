import { Link } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
import { classNames } from '@/lib/utils';

export function Logo({ className, showText = true, size = 'md' }: { className?: string; showText?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const iconSize = size === 'sm' ? 'h-6 w-6' : size === 'lg' ? 'h-9 w-9' : 'h-7 w-7';
  const textSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg';
  return (
    <Link to="/" className={classNames('flex items-center gap-2 font-display font-bold', className)}>
      <div className={`${iconSize} rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white shadow-sm`}>
        <Briefcase className="h-4 w-4" strokeWidth={2.5} />
      </div>
      {showText && (
        <span className={classNames('text-secondary-900', textSize)}>
          Job<span className="text-primary-600">Buddy</span>
        </span>
      )}
    </Link>
  );
}
