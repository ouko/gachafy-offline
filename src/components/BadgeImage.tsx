import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface BadgeImageProps {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
}

export function BadgeImage({ src, alt, className, eager = false }: BadgeImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = failedSrc === src;
  const resolvedSrc = failed || !src ? '/icon-512.png' : src;

  useEffect(() => {
    setFailedSrc(null);
  }, [src]);

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={cn('object-contain', className)}
      loading={eager ? 'eager' : 'lazy'}
      onError={() => {
        if (!failed) setFailedSrc(src);
      }}
    />
  );
}
