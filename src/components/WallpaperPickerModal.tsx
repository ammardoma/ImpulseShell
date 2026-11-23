import React, { useRef } from 'react';
import { Check, ImagePlus, SunMoon, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  extractDominantHexFromImage,
  hexToRgba,
  WALLPAPERS,
} from '../lib/m3Engine';
import { getSurfaceStyles } from '../lib/surfaceMaterial';
import { M3Palette, M3Scheme, ShellConfig, WallpaperPreset } from '../types/shell';

interface WallpaperPickerModalProps {
  open: boolean;
  config: ShellConfig;
  palette: M3Palette;
  bezierPoints: [number, number, number, number];
  onClose: () => void;
  onSelectWallpaper: (id: string) => void;
  onAddCustomWallpaper: (wp: WallpaperPreset) => void;
  onRemoveCustomWallpaper: (id: string) => void;
  onUpdateConfig: (patch: Partial<ShellConfig>, osdLabel?: string) => void;
}

const SCHEMES: { id: M3Scheme; label: string }[] = [
  { id: 'tonal_spot', label: 'Tonal Spot' },
  { id: 'expressive', label: 'Expressive' },
  { id: 'fidelity', label: 'Fidelity' },
  { id: 'monochrome', label: 'Monochrome' },
];

export const WallpaperPickerModal: React.FC<WallpaperPickerModalProps> = ({
  open,
  config,
  palette,
  bezierPoints,
  onClose,
  onSelectWallpaper,
  onAddCustomWallpaper,
  onRemoveCustomWallpaper,
  onUpdateConfig,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const allWallpapers = [...WALLPAPERS, ...config.customWallpapers];

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const seed = await extractDominantHexFromImage(dataUrl);
      const customWp: WallpaperPreset = {
        id: `custom_${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, '').slice(0, 24) || 'Custom Wallpaper',
        subtitle: 'User uploaded image',
        src: dataUrl,
        seedColor: seed,
        defaultScheme: config.m3Scheme,
        isCustom: true,
      };
      onAddCustomWallpaper(customWp);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/45 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 24, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 18, scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.28 * config.animSpeed, ease: bezierPoints }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl p-5 flex flex-col gap-4 max-h-[85vh] overflow-hidden"
            style={{
              borderRadius: Math.max(18, config.rounding + 6),
              color: palette.onSurface,
              ...getSurfaceStyles(
                config.materialType,
                config.transparency,
                palette,
                config.darkMode,
                { elevation: 'overlay', blurPasses: config.blurPasses }
              ),
            }}
          >
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-display font-semibold">
                  Wallpaper & Material You Picker
                </h2>
                <p className="text-xs" style={{ color: palette.onSurfaceVariant }}>
                  Select or upload any wallpaper to recompute Material 3 tonal tokens live
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer"
                  style={{ backgroundColor: palette.primary, color: palette.onPrimary }}
                >
                  <ImagePlus className="w-3.5 h-3.5" />
                  <span>Upload Image</span>
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateConfig({ darkMode: !config.darkMode })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer"
                  style={{
                    backgroundColor: palette.secondaryContainer,
                    color: palette.onSecondaryContainer,
                  }}
                >
                  <SunMoon className="w-3.5 h-3.5" />
                  <span>{config.darkMode ? 'Dark' : 'Light'}</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close wallpaper picker"
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 cursor-pointer"
                  style={{ backgroundColor: palette.surfaceContainerHigh }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* M3 Scheme Selector */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div
                className="flex items-center gap-1 p-1 rounded-xl"
                style={{ backgroundColor: hexToRgba(palette.surfaceContainer, 0.7) }}
              >
                {SCHEMES.map((s) => {
                  const active = config.m3Scheme === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => onUpdateConfig({ m3Scheme: s.id })}
                      className="px-3 py-1 rounded-lg text-xs font-medium cursor-pointer"
                      style={{
                        backgroundColor: active ? palette.primaryContainer : 'transparent',
                        color: active ? palette.onPrimaryContainer : palette.onSurfaceVariant,
                      }}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 text-xs font-mono-code">
                <span style={{ color: palette.onSurfaceVariant }}>Seed:</span>
                <input
                  type="color"
                  value={config.seedColor}
                  onChange={(e) =>
                    onUpdateConfig({ seedColor: e.target.value, useWallpaperSeed: false })
                  }
                  className="w-6 h-6 rounded border-0 bg-transparent cursor-pointer"
                />
                <span>{config.seedColor.toUpperCase()}</span>
              </div>
            </div>

            {/* Wallpaper Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 overflow-y-auto pr-1">
              {allWallpapers.map((wp) => {
                const selected = config.wallpaperId === wp.id;
                return (
                  <div
                    key={wp.id}
                    className="group relative flex flex-col overflow-hidden transition-all"
                    style={{
                      borderRadius: 14,
                      border: selected
                        ? `2px solid ${palette.primary}`
                        : `1px solid ${hexToRgba(palette.outlineVariant, 0.5)}`,
                      backgroundColor: hexToRgba(palette.surfaceContainer, 0.75),
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectWallpaper(wp.id)}
                      className="text-left cursor-pointer"
                    >
                      <div className="relative h-28 w-full overflow-hidden">
                        <img
                          src={wp.src}
                          alt={wp.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {selected && (
                          <span
                            className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center shadow"
                            style={{ backgroundColor: palette.primary, color: palette.onPrimary }}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                      <div className="p-2.5">
                        <div className="text-xs font-semibold truncate">{wp.name}</div>
                        <div
                          className="text-[11px] font-mono-code truncate"
                          style={{ color: palette.onSurfaceVariant }}
                        >
                          {wp.seedColor}
                        </div>
                      </div>
                    </button>
                    {wp.isCustom && (
                      <button
                        type="button"
                        onClick={() => onRemoveCustomWallpaper(wp.id)}
                        title="Remove custom wallpaper"
                        className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center bg-black/55 text-white hover:bg-black/75 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
