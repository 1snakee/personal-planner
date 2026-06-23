import { useState, useRef, useCallback } from 'react';

type Point = { x: number; y: number };

export const usePanZoom = () => {
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const isDragging = useRef(false);
  const startPan = useRef<Point>({ x: 0, y: 0 });
  const initialPinchDist = useRef<number | null>(null);

  const zoomIn = useCallback(() => {
    setTransform(prev => ({ ...prev, scale: Math.min(prev.scale * 1.2, 5) }));
  }, []);

  const zoomOut = useCallback(() => {
    setTransform(prev => ({ ...prev, scale: Math.max(prev.scale / 1.2, 0.2) }));
  }, []);

  const resetView = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 });
  }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    // Only zoom if not scrolling an internal element, or we can just capture it
    // SVG blocks scroll natively if it's the target.
    const scaleAdjust = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(prev => ({
      ...prev,
      scale: Math.min(Math.max(prev.scale * scaleAdjust, 0.2), 5)
    }));
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    startPan.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
  }, [transform]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    setTransform(prev => ({
      ...prev,
      x: e.clientX - startPan.current.x,
      y: e.clientY - startPan.current.y
    }));
  }, []);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDragging.current = true;
      startPan.current = { x: e.touches[0].clientX - transform.x, y: e.touches[0].clientY - transform.y };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialPinchDist.current = Math.sqrt(dx * dx + dy * dy);
    }
  }, [transform]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging.current) {
      setTransform(prev => ({
        ...prev,
        x: e.touches[0].clientX - startPan.current.x,
        y: e.touches[0].clientY - startPan.current.y
      }));
    } else if (e.touches.length === 2 && initialPinchDist.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const scaleAdjust = dist / initialPinchDist.current;
      
      setTransform(prev => ({
        ...prev,
        scale: Math.min(Math.max(prev.scale * scaleAdjust, 0.2), 5)
      }));
      initialPinchDist.current = dist;
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    isDragging.current = false;
    initialPinchDist.current = null;
  }, []);

  return {
    transform,
    isDragging: isDragging.current,
    handlers: {
      onWheel,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave: onMouseUp,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel: onTouchEnd,
    },
    actions: {
      zoomIn,
      zoomOut,
      resetView
    }
  };
};
