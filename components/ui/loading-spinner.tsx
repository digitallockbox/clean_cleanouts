import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="flex flex-col items-center space-y-2">
        <Loader2 className={cn('animate-spin', sizeClasses[size])} />
        {text && <p className="text-sm text-muted-foreground">{text}</p>}
      </div>
    </div>
  );
}

interface PageLoadingProps {
  text?: string;
}

export function PageLoading({ text = 'Loading...' }: PageLoadingProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}

interface ButtonLoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
}

export function ButtonLoading({ 
  isLoading, 
  children, 
  loadingText = 'Loading...', 
  className 
}: ButtonLoadingProps) {
  return (
    <div className={cn('flex items-center', className)}>
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isLoading ? loadingText : children}
    </div>
  );
}

interface CardLoadingProps {
  lines?: number;
  className?: string;
}

export function CardLoading({ lines = 3, className }: CardLoadingProps) {
  return (
    <div className={cn('animate-pulse space-y-3', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 bg-gray-200 rounded',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}