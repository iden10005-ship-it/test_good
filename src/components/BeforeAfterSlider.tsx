import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MoveHorizontal, Sparkles } from 'lucide-react';
import { resolveAssetUrl } from '@/src/utils/assetUrl';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  aspectRatio?: string;
  className?: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeImage,
  afterImage,
  beforeLabel = '청소 전',
  afterLabel = '청소 후',
  aspectRatio = 'aspect-[16/10] sm:aspect-[16/9] md:aspect-[21/9]',
  className = '',
}) => {
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const [beforeError, setBeforeError] = useState(false);
  const [afterError, setAfterError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const updateFromClientX = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(pct);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updateFromClientX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) updateFromClientX(e.clientX);
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    if (e.touches.length > 0) updateFromClientX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) updateFromClientX(e.touches[0].clientX);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setPosition((prev) => Math.max(0, prev - 5));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setPosition((prev) => Math.min(100, prev + 5));
    }
  };

  return (
    <div
      ref={containerRef}
      role="slider"
      tabIndex={0}
      aria-label="청소 전후 비교 슬라이더"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(position)}
      onKeyDown={handleKeyDown}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
      className={`relative select-none overflow-hidden rounded-2xl shadow-2xl border border-white/20 group cursor-ew-resize touch-pan-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${aspectRatio} ${className}`}
    >
      {/* After Image (Right / Base Layer) */}
      {afterError ? (
        <div className="absolute inset-0 bg-gradient-to-br from-sky-50 to-blue-100 flex flex-col items-center justify-center text-blue-700 p-4">
          <Sparkles className="w-8 h-8 mb-2" />
          <span className="text-sm font-bold">{afterLabel}</span>
        </div>
      ) : (
        <img
          src={resolveAssetUrl(afterImage)}
          alt="청소 후 깨끗하고 투명해진 유리창"
          referrerPolicy="no-referrer"
          onError={() => setAfterError(true)}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
      )}

      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-emerald-600/90 text-white text-[11px] sm:text-xs font-bold backdrop-blur-md shadow-lg pointer-events-none tracking-wide">
        <Sparkles className="w-3.5 h-3.5 shrink-0" />
        <span>{afterLabel}</span>
      </div>

      {/* Before Image (Left / Clipped Layer) */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ width: `${position}%` }}
      >
        {beforeError ? (
          <div
            className="h-full bg-gradient-to-br from-slate-700 to-slate-800 flex flex-col items-center justify-center text-slate-200 p-4"
            style={{ width: containerWidth ? `${containerWidth}px` : '100%' }}
          >
            <span className="text-sm font-bold">{beforeLabel}</span>
          </div>
        ) : (
          <img
            src={resolveAssetUrl(beforeImage)}
            alt="청소 전 물때와 먼지가 쌓인 유리창"
            referrerPolicy="no-referrer"
            onError={() => setBeforeError(true)}
            className="absolute inset-0 h-full object-cover max-w-none"
            style={{
              width: containerWidth ? `${containerWidth}px` : '100%',
              height: '100%',
            }}
          />
        )}
        <div className="absolute inset-0 bg-amber-950/15 pointer-events-none" />
      </div>

      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-slate-900/80 text-slate-100 text-[11px] sm:text-xs font-bold backdrop-blur-md shadow-lg pointer-events-none tracking-wide">
        {beforeLabel}
      </div>

      {/* Divider Line & Handle */}
      <div
        className="absolute top-0 bottom-0 z-20 w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,0.5)] pointer-events-none"
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white shadow-xl flex items-center justify-center border-2 border-blue-500 text-blue-600 transition-transform group-hover:scale-105">
          <MoveHorizontal className="w-5 h-5 md:w-6 md:h-6" />
        </div>
      </div>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-black/65 text-white/95 text-[11px] font-medium backdrop-blur-md pointer-events-none whitespace-nowrap">
        ↔ 좌우로 드래그하여 전후 효과를 확인하세요
      </div>
    </div>
  );
};
