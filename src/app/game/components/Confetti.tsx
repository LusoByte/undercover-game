'use client';
import type { AnimationItem } from 'lottie-web';
import React, { useEffect, useRef } from 'react';

export default function Confetti({ play }: { play: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const animRef = useRef<AnimationItem | null>(null);
  const pending = useRef(false);

  useEffect(() => {
    let mounted = true;
    import('lottie-web')
      .then((lottie) => {
        if (!mounted || !ref.current) return;
        try {
          animRef.current = lottie.default.loadAnimation({
            container: ref.current!,
            renderer: 'svg',
            loop: false,
            autoplay: false,
            path: '/lottie/confetti.json',
          });

          if (pending.current) {
            animRef.current?.goToAndPlay(0, true);
            pending.current = false;
          }
        } catch (e) {
          console.warn('Lottie failed:', e);
        }
      })
      .catch((e) => console.warn('Failed to import lottie-web', e));

    return () => {
      mounted = false;
      try {
        animRef.current?.destroy();
        animRef.current = null;
      } catch (e) {
        console.warn(e);
      }
    };
  }, []);

  useEffect(() => {
    if (play) {
      if (animRef.current) {
        try {
          animRef.current.goToAndPlay(0, true);
        } catch (e) {
          console.warn('Failed to play lottie', e);
        }
      } else {
        pending.current = true;
      }
    }
  }, [play]);

  return <div ref={ref} className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center" />;
}
