import React, { useEffect, useState } from 'react';
import { Camera, Maximize, Monitor, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { hexToRgba } from '../lib/m3Engine';
import { M3Palette, ShellConfig } from '../types/shell';

interface ScreenshotOverlayProps {
  open: boolean;
  config: ShellConfig;
  palette: M3Palette;
  onClose: () => void;
  onCompleteCapture: (summary: { mode: string; width: number; height: number; x: number; y: number }) => void;
}

export const ScreenshotOverlay: React.FC<ScreenshotOverlayProps> = ({
  open,
  config,
  palette,
  onClose,
  onCompleteCapture,
}) => {
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!open) {
      setDragStart(null);
      setDragCurrent(null);
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [open, onClose]);

  const rect =
    dragStart && dragCurrent
      ? {
          x: Math.min(dragStart.x, dragCurrent.x),
          y: Math.min(dragStart.y, dragCurrent.y),
          width: Math.abs(dragCurrent.x - dragStart.x),
          height: Math.abs(dragCurrent.y - dragStart.y),
        }
      : null;

  const handleMouseUp = () => {
    if (!rect) {
      setDragStart(null);
      setDragCurrent(null);
      return;
    }
    if (rect.width >= 16 && rect.height >= 16) {
      onCompleteCapture({
        mode: 'region',
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      });
    }
    setDragStart(null);
    setDragCurrent(null);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.14 * config.animSpeed }}
          onMouseDown={(e) => {
            if (e.button !== 0) return;
            setDragStart({ x: e.clientX, y: e.clientY });
            setDragCurrent({ x: e.clientX, y: e.clientY });
          }}
          onMouseMove={(e) => {
            if (!dragStart) return;
            setDragCurrent({ x: e.clientX, y: e.clientY });
          }}
          onMouseUp={handleMouseUp}
          className="fixed inset-0 z-50 cursor-crosshair select-none bg-black/45"
        >
          {/* Selection Rectangle */}
          {rect && rect.width > 2 && rect.height > 2 && (
            <div
              className="fixed pointer-events-none"
              style={{
                left: rect.x,
                top: rect.y,
                width: rect.width,
                height: rect.height,
                border: `2px solid ${palette.primary}`,
                backgroundColor: hexToRgba(palette.primary, 0.12),
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.35)',
              }}
            >
              <div
                className="absolute -top-7 left-0 px-2 py-0.5 rounded-md text-[11px] font-mono-code font-semibold tabular-nums whitespace-nowrap"
                style={{
                  backgroundColor: palette.primary,
                  color: palette.onPrimary,
                }}
              >
                {Math.round(rect.width)} × {Math.round(rect.height)}
              </div>
            </div>
          )}

          {/* Top Action Bar */}
          <div
            onMouseDown={(e) => e.stopPropagation()}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-2 rounded-full shadow-2xl"
            style={{
              backgroundColor: hexToRgba(palette.surfaceContainerHigh, 0.92),
              backdropFilter: 'blur(16px)',
              border: `1px solid ${hexToRgba(palette.outlineVariant, 0.55)}`,
              color: palette.onSurface,
            }}
          >
            <Camera className="w-4 h-4 shrink-0" style={{ color: palette.primary }} />
            <span className="text-xs font-medium whitespace-nowrap">
              Drag anywhere to capture region
            </span>
            <button
              type="button"
              onClick={() =>
                onCompleteCapture({
                  mode: 'fullscreen',
                  x: 0,
                  y: 0,
                  width: window.innerWidth,
                  height: window.innerHeight,
                })
              }
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer"
              style={{
                backgroundColor: palette.primaryContainer,
                color: palette.onPrimaryContainer,
              }}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Full Screen</span>
            </button>
            <button
              type="button"
              onClick={() =>
                onCompleteCapture({
                  mode: 'window',
                  x: 80,
                  y: 64,
                  width: Math.max(480, Math.round(window.innerWidth * 0.65)),
                  height: Math.max(360, Math.round(window.innerHeight * 0.72)),
                })
              }
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer"
              style={{
                backgroundColor: palette.secondaryContainer,
                color: palette.onSecondaryContainer,
              }}
            >
              <Maximize className="w-3.5 h-3.5" />
              <span>Active Window</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cancel screenshot"
              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
