'use client';
import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('Service worker registered', reg);
          if (reg.waiting) {
            // Optionally handle update
            console.log('Service worker waiting');
          }
        })
        .catch((err) => console.warn('Service worker registration failed', err));

      // Optional: listen for updates
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('SW message', event.data);
      });
    }
  }, []);

  return null;
}
