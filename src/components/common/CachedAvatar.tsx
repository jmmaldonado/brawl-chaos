import React, { useState, useEffect } from 'react';
import { getAvatar } from '../../utils/avatarCache';

interface CachedAvatarProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  name: string;
}

export const CachedAvatar: React.FC<CachedAvatarProps> = ({ name, ...props }) => {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    getAvatar(name).then(url => {
      if (isMounted) setSrc(url);
    });

    return () => {
      isMounted = false;
    };
  }, [name]);

  if (!src) {
    // Fallback while loading, could be a spinner or just an empty div with the background
    return <div className={`animate-pulse bg-slate-800 ${props.className}`} style={props.style} />;
  }

  return <img src={src} {...props} />;
};
