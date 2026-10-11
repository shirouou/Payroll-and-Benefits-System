import React, { useEffect, useState } from 'react';
import { profileAPI } from '../services/api';

// Fetches the photo with the auth header; falls back to the user's initial.
export default function Avatar({ user, className = '' }) {
  const [imageUrl, setImageUrl] = useState(null);
  const version = user?.avatarUpdatedAt;

  useEffect(() => {
    if (!version) {
      setImageUrl(null);
      return undefined;
    }

    let cancelled = false;
    let objectUrl = null;
    profileAPI.getAvatar()
      .then(response => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(response.data);
        setImageUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setImageUrl(null);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [version]);

  const initial = (user?.name || 'A').charAt(0).toUpperCase();

  return (
    <div className={`profile-avatar ${className}`}>
      {imageUrl ? <img src={imageUrl} alt={`${user?.name || 'User'} profile`} /> : initial}
    </div>
  );
}
