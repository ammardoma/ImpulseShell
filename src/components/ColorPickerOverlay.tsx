import React, { useEffect, useRef, useState } from 'react';
import { Check, Copy, Pipette, Sparkles, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { hexToRgba } from '../lib/m3Engine';
import { M3Palette, ShellConfig } from '../types/shell';

interface ColorPickerOverlayProps {
  open: boolean;
  config: ShellConfig;
  palette: M3Palette;
  wallpaperSrc: string;
  onClose: () => void;
  onCopyHex: (hex: string) => void;
  onApplySeedHex: (hex: string) => void;
}

export const ColorPickerOverlay: React.FC<ColorPickerOverlayProps> = ({
  open,
  config,
  palette,
  wallpaperSrc,
  onClose,
  onCopyHex,
  onApplySeedHex,
}) => {
  const [cursor, setCursor] = useState<{ x: number; y: number }>({ x: 320, y: 240 });
  const [hoveredHex, setHoveredHex] = useState<string>(palette.primary);
  const [pickedHex, setPickedHex] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!open) {
      setPickedHex(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, window.innerWidth);
      canvas.height = Math.max(1, window.innerHeight);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      // Cover-fit wallpaper into viewport canvas for accurate pixel sampling
      const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
      canvasRef.current = canvas;
    };
    img.src = wallpaperSrc;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [open, wallpaperSrc, onClose]);

  const sampleAt = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    try {
      const px = Math.max(0, Math.min(canvas.width - 1, Math.round(x)));
      const py = Math.max(0, Math.min(canvas.height - 1, Math.round(y)));
      const data = ctx.getImageData(px, py, 1, 1).data;
      const hex =
        '#' +
        [data[0], data[1], data[2]]
          .map((n) => n.toString(16).padStart(2, '0').toUpperCase())
          .join('');
      setHoveredHex(hex);
    } catch {
      // Fallback safely on tainted image origins
    }
  };

  const quickSwatches = [
    palette.primary,
    palette.secondary,
    palette.tertiary,
    palette.primaryContainer,
    palette.surfaceContainerHigh,
  ];

  const activeHex = pickedHex ?? hoveredHex;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.14 * config.animSpeed }}
          onMouseMove={(e) => {
            setCursor({ x: e.clientX, y: e.clientY });
            if (!pickedHex) sampleAt(e.clientX, e.clientY);
          }}
          onClick={() => setPickedHex(hoveredHex)}
          className="fixed inset-0 z-50 cursor-crosshair select-none"
        >
          {/* Floating Magnifier Loupe following cursor before pick */}
          {!pickedHex && (
            <div
              className="fixed pointer-events-none flex items-center gap-2 px-2.5 py-1.5 rounded-full shadow-2xl"
              style={{
                left: Math.min(window.innerWidth - 150, cursor.x + 18),
                top: Math.min(window.innerHeight - 54, cursor.y + 18),
                backgroundColor: hexToRgba(palette.surfaceContainerHighest, 0.94),
                border: `1.5px solid ${hoveredHex}`,
                color: palette.onSurface,
              }}
            >
              <span
                className="w-4 h-4 rounded-full border border-white/40 shrink-0"
                style={{ backgroundColor: hoveredHex }}
              />
              <span className="text-xs font-mono-code font-semibold tabular-nums">
                {hoveredHex}
              </span>
            </div>
          )}

          {/* Hyprpicker Docked Control Pill */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-wrap items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-2xl"
            style={{
              backgroundColor: hexToRgba(palette.surfaceContainerHigh, 0.94),
              backdropFilter: 'blur(18px)',
              border: `1px solid ${hexToRgba(palette.outlineVariant, 0.55)}`,
              color: palette.onSurface,
            }}
          >
            <Pipette className="w-4 h-4 shrink-0" style={{ color: palette.primary }} />
            <span className="text-xs font-display font-semibold">Hyprpicker</span>

            <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl" style={{ backgroundColor: palette.surfaceContainer }}>
              <span
                className="w-4 h-4 rounded-md border border-white/25"
                style={{ backgroundColor: activeHex }}
              />
              <span className="text-xs font-mono-code font-semibold tabular-nums">
                {activeHex}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {quickSwatches.map((sw, idx) => (
                <button
                  key={`${sw}-${idx}`}
                  type="button"
                  onClick={() => setPickedHex(sw.toUpperCase())}
                  title={`Select ${sw}`}
                  className="w-5 h-5 rounded-full border border-white/30 cursor-pointer transition-transform hover:scale-110"
                  style={{ backgroundColor: sw }}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                onCopyHex(activeHex);
                onClose();
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer"
              style={{
                backgroundColor: palette.secondaryContainer,
                color: palette.onSecondaryContainer,
              }}
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Hex</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onApplySeedHex(activeHex);
                onClose();
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer"
              style={{
                backgroundColor: palette.primary,
                color: palette.onPrimary,
              }}
            >
              {pickedHex ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Set M3 Seed</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Hyprpicker"
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
