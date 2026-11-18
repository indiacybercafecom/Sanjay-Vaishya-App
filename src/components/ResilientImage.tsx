import React, { useState } from 'react';
import { Server } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  fallbackSrc?: string;
  alt: string;
  className?: string;
}

export default function ResilientImage({
  src,
  fallbackSrc,
  alt,
  className = 'w-full h-full object-cover',
}: ResilientImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    } else {
      setHasError(true);
    }
  };

  if (hasError) {
    return (
      <div
        className="w-full h-full bg-[#13161D] border border-[#262B38] flex flex-col items-center justify-center p-6 text-center"
        role="img"
        aria-label={alt}
      >
        <div className="w-12 h-12 rounded-lg bg-[#1A1E28] border border-[#2E3545] flex items-center justify-center text-[#1FA8D6] mb-3">
          <Server className="w-6 h-6" />
        </div>
        <p className="text-xs font-mono text-[#CCCCCC] max-w-[24ch] truncate">{alt}</p>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={handleError}
      className={className}
    />
  );
}
