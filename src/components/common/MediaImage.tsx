import React, { useState } from 'react';
import { resolveMediaUrl } from '../../services/api';
import { Music, User, Building2, Disc, Images } from 'lucide-react';

interface MediaImageProps {
  src?: string | null;
  alt: string;
  type?: 'album' | 'singer' | 'organization' | 'track' | 'hero';
  className?: string;
}

export const MediaImage: React.FC<MediaImageProps> = ({
  src,
  alt,
  type = 'album',
  className = 'w-12 h-12 rounded-lg object-cover',
}) => {
  const [error, setError] = useState(false);
  const resolvedUrl = resolveMediaUrl(src);

  if (!src || error) {
    const iconClass = 'w-1/2 h-1/2 text-slate-400';
    return (
      <div
        className={`bg-slate-800 border border-slate-700/60 flex items-center justify-center overflow-hidden shrink-0 ${className}`}
        title={alt}
      >
        {type === 'singer' && <User className={iconClass} />}
        {type === 'organization' && <Building2 className={iconClass} />}
        {type === 'album' && <Disc className={iconClass} />}
        {type === 'track' && <Music className={iconClass} />}
        {type === 'hero' && <Images className={iconClass} />}
      </div>
    );
  }

  return (
    <img
      src={resolvedUrl}
      alt={alt}
      onError={() => setError(true)}
      className={`object-cover shrink-0 border border-slate-700/50 ${className}`}
      referrerPolicy="no-referrer"
    />
  );
};
