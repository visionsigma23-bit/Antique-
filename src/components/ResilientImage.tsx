import React, { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { resolveMediaSrc } from '../data/media';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}

export function ResilientImage({
  src,
  alt,
  className = 'w-full h-full object-cover',
  loading = 'lazy',
}: ResilientImageProps) {
  const [hasError, setHasError] = useState(false);
  const resolvedSrc = resolveMediaSrc(src);

  useEffect(() => {
    setHasError(false);
  }, [resolvedSrc]);

  if (!resolvedSrc || hasError) {
    return (
      <div
        className="w-full h-full bg-[#22221F] flex flex-col items-center justify-center p-6 text-center text-[#B9B3A8]"
        role="img"
        aria-label={alt}
      >
        <ImageOff className="w-6 h-6 mb-2 text-[#B9975B]" strokeWidth={1.5} />
        <span className="font-serif text-sm text-[#F5F1E8] line-clamp-2">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      loading={loading}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
