import { useState, useEffect } from 'react';

export const useGeolocation = () => {
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      }),
      () => setError('Unable to retrieve your location. Please enable GPS.')
    );
  };

  return { location, error, getLocation };
};