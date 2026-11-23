import React, { useEffect, useState } from 'react';
import { ArrowRight, Lock, Pause, Play } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { hexToRgba, USER_AVATAR_SRC, WALLPAPERS } from '../lib/m3Engine';
import { M3Palette, MediaTrack, ShellConfig } from '../types/shell';

interface LockscreenProps {
  locked: boolean;
  config: ShellConfig;
  palette: M3Palette;
  media: MediaTrack;
  bezierPoints: [number, number, number, number];
  onUnlock: () => void;
  onToggleMediaPlay: () => void;
}

export const Lockscreen: React.FC<LockscreenProps> = ({
  locked,
  config,
  palette,
  media,
  bezierPoints,
  onUnlock,
  onToggleMediaPlay,
}) => {
  const [now, setNow] = useState(() => new Date());
  const [password, setPassword] = useState('');

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 5000);
    return () => window.clearInterval(id);
  }, []);

  const allWallpapers = [...WALLPAPERS, ...config.customWallpapers];
  const wp = allWallpapers.find((w) => w.id === config.wallpaperId) ?? WALLPAPERS[0];
  const hours = now.toLocaleTimeString([], { hour: '2-digit', hour12: false });
  const minutes = now.toLocaleTimeString([], { minute: '2-digit' }).padStart(2, '0');
  const fullDate = now.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <AnimatePresence>
      {locked && (
        <motion.div
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 0.35 * config.animSpeed, ease: bezierPoints }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-between py-14 px-6 select-none overflow-hidden"
          style={{ color: '#F4F4F5' }}
        >
          <img
            src={wp.src}
            alt={wp.name}
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover scale-105 blur-xl brightness-50"
          />

          {/* Top Lock Status */}
          <div className="relative z-10 flex items-center gap-2 text-xs font-medium tracking-wide opacity-80">
            <Lock className="w-3.5 h-3.5" />
            <span>ext-session-lock · myx-lock</span>
          </div>

          {/* Center M3 Expressive Clock & Media */}
          <div className="relative z-10 flex flex-col items-center text-center gap-4">
            <div className="text-sm font-medium opacity-85">{fullDate}</div>
            <div
              className="font-display font-bold leading-none tracking-tight tabular-nums flex items-baseline gap-2"
              style={{ fontSize: 'clamp(4.5rem, 11vw, 8.5rem)' }}
            >
              <span>{hours}</span>
              <span style={{ color: palette.primary }}>:</span>
              <span>{minutes}</span>
            </div>

            {/* Lockscreen Media Widget */}
            <div
              className="flex items-center gap-3.5 px-4 py-2.5 rounded-full backdrop-blur-xl mt-2"
              style={{
                backgroundColor: hexToRgba(palette.surfaceContainerHigh, 0.72),
                border: `1px solid ${hexToRgba(palette.outlineVariant, 0.5)}`,
                color: palette.onSurface,
              }}
            >
              <button
                type="button"
                onClick={onToggleMediaPlay}
                aria-label={media.isPlaying ? 'Pause' : 'Play'}
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: palette.primary, color: palette.onPrimary }}
              >
                {media.isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <div className="text-left pr-2">
                <div className="text-xs font-semibold">{media.title}</div>
                <div className="text-[11px] opacity-75">{media.artist}</div>
              </div>
            </div>
          </div>

          {/* Bottom User Unlock Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPassword('');
              onUnlock();
            }}
            className="relative z-10 flex flex-col items-center gap-3 w-full max-w-xs"
          >
            <div className="flex items-center gap-2.5">
              <img
                src={USER_AVATAR_SRC}
                alt="ammar avatar"
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full object-cover border border-white/25"
              />
              <span className="text-sm font-medium">ammar@nyx-desktop</span>
            </div>

            <div
              className="flex items-center gap-2 w-full p-1.5 pl-4 rounded-full backdrop-blur-xl"
              style={{
                backgroundColor: hexToRgba(palette.surfaceContainerLow, 0.8),
                border: `1px solid ${hexToRgba(palette.outlineVariant, 0.6)}`,
                color: palette.onSurface,
              }}
            >
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Press Enter or click Unlock..."
                className="bg-transparent text-xs outline-none flex-1 placeholder:opacity-65"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
                style={{
                  backgroundColor: palette.primary,
                  color: palette.onPrimary,
                }}
              >
                <span>Unlock</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
