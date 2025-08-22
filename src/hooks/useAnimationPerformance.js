import { useEffect, useRef } from 'react';

export function useAnimationPerformance(animationName) {
  const frameTimesRef = useRef([]);
  const startTimeRef = useRef(0);
  const rafIdRef = useRef(null);

  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'frame' && frameTimesRef.current.length < 60) {
          frameTimesRef.current.push(entry.duration);
        }
      }
    });

    observer.observe({ entryTypes: ['frame'] });

    const measureFrame = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      
      if (frameTimesRef.current.length >= 60) {
        const avgFrameTime = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
        const jankFrames = frameTimesRef.current.filter(t => t > 16.67).length;
        
        console.log(`[Animation Performance: ${animationName}]
          Average frame time: ${avgFrameTime.toFixed(2)}ms
          Jank frames: ${jankFrames}
          FPS: ${(1000 / avgFrameTime).toFixed(1)}
        `);
        
        observer.disconnect();
        return;
      }

      rafIdRef.current = requestAnimationFrame(measureFrame);
    };

    rafIdRef.current = requestAnimationFrame(measureFrame);

    return () => {
      observer.disconnect();
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [animationName]);
}
