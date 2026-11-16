import React, { useState } from 'react';
import { Code2 } from 'lucide-react';

interface SafeImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className = '',
  fallbackLabel,
}) => {
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-[#111631] to-violet-950/60 text-slate-300 select-none ${className}`}
        role="img"
        aria-label={alt}
      >
        <Code2 className="w-8 h-8 text-violet-400/80 mb-2" />
        {fallbackLabel && (
          <span className="text-xs font-medium tracking-wide text-slate-300/90 px-3 text-center line-clamp-1">
            {fallbackLabel}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setErrored(true)}
      className={className}
    />
  );
};
