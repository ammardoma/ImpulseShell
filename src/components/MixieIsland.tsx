import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BellOff,
  Calculator,
  Camera,
  Clipboard,
  Cpu,
  Download,
  FileCode2,
  Image as ImageIcon,
  Keyboard,
  Layers,
  LayoutGrid,
  Lock,
  Minus,
  NotebookPen,
  Pause,
  Play,
  Search,
  SkipBack,
  SkipForward,
  Sliders,
  SlidersHorizontal,
  Sun,
  SunMoon,
  Terminal,
  Video,
  Volume2,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { hexToRgba, WALLPAPERS } from '../lib/m3Engine';
import { getSurfaceStyles } from '../lib/surfaceMaterial';
import {
  AppWindowId,
  DesktopWindow,
  M3Palette,
  MediaTrack,
  MixieView,
  NyxLayoutMode,
  ShellConfig,
} from '../types/shell';

interface MixieIslandProps {
  config: ShellConfig;
  palette: M3Palette;
  view: MixieView;
  activeWorkspace: number;
  workspaceCount: number;
  windows: DesktopWindow[];
  focusedWindowId: AppWindowId | null;
  media: MediaTrack;
  isRecording: boolean;
  ramMb: number;
  bezierPoints: [number, number, number, number];
  onChangeView: (view: MixieView) => void;
  onSelectWorkspace: (ws: number) => void;
  onFocusOrOpenApp: (id: AppWindowId) => void;
  onCloseWindow: (id: AppWindowId) => void;
  onMinimizeWindow: (id: AppWindowId) => void;
  onToggleFloating: (id: AppWindowId) => void;
  onUpdateConfig: (patch: Partial<ShellConfig>, osdLabel?: string) => void;
  onSelectWallpaper: (id: string) => void;
  onToggleSidebar: () => void;
  onOpenWallpaperPicker: () => void;
  onOpenClipboard: () => void;
  onOpenKeybinds: () => void;
  onScreenshotRegion: () => void;
  onToggleRecording: () => void;
  onToggleMediaPlay: () => void;
  onSkipTrack: (dir: 1 | -1) => void;
  onDownloadZip: () => void;
  onLock: () => void;
}

const APP_ITEMS: {
  id: AppWindowId;
  label: string;
  short: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'customizer', label: 'Myx + Nyx Settings', short: 'Settings', icon: Sliders },
  { id: 'terminal', label: 'nyx-term (Zsh)', short: 'nyx-term', icon: Terminal },
  { id: 'code_export', label: 'Nyx + Myx Source', short: 'Source', icon: FileCode2 },
  { id: 'telemetry', label: 'RAM Telemetry', short: 'RAM', icon: Cpu },
  { id: 'notes', label: 'Scratchpad Notes', short: 'Notes', icon: NotebookPen },
];

const APP_ICON_MAP: Record<AppWindowId, React.ComponentType<{ className?: string }>> = {
  customizer: Sliders,
  terminal: Terminal,
  code_export: FileCode2,
  telemetry: Cpu,
  notes: NotebookPen,
};

const LAYOUT_CYCLE: NyxLayoutMode[] = ['dwindle', 'scrolling', 'master'];

export const MixieIsland: React.FC<MixieIslandProps> = ({
  config,
  palette,
  view,
  activeWorkspace,
  workspaceCount,
  windows,
  focusedWindowId,
  media,
  isRecording,
  ramMb,
  bezierPoints,
  onChangeView,
  onSelectWorkspace,
  onFocusOrOpenApp,
  onCloseWindow,
  onMinimizeWindow,
  onToggleFloating,
  onUpdateConfig,
  onSelectWallpaper,
  onToggleSidebar,
  onOpenWallpaperPicker,
  onOpenClipboard,
  onOpenKeybinds,
  onScreenshotRegion,
  onToggleRecording,
  onToggleMediaPlay,
  onSkipTrack,
  onDownloadZip,
  onLock,
}) => {
  const [hovered, setHovered] = useState(false);
  const [query, setQuery] = useState('');
  const [now, setNow] = useState(() => new Date());
  const leaveTimerRef = useRef<number | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const isExpanded = view !== 'idle';

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    return () => {
      if (leaveTimerRef.current) window.clearTimeout(leaveTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (view !== 'search') {
      setQuery('');
      return;
    }
    const t = window.setTimeout(() => searchRef.current?.focus(), 70);
    return () => window.clearTimeout(t);
  }, [view]);

  useEffect(() => {
    if (!isExpanded) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onChangeView('idle');
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [isExpanded, onChangeView]);

  const timeStr = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const handleMouseEnter = () => {
    if (leaveTimerRef.current) {
      window.clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    setHovered(true);
  };

  const handleMouseLeave = () => {
    if (leaveTimerRef.current) window.clearTimeout(leaveTimerRef.current);
    leaveTimerRef.current = window.setTimeout(() => setHovered(false), 200);
  };

  const nextLayout =
    LAYOUT_CYCLE[(LAYOUT_CYCLE.indexOf(config.nyxLayout) + 1) % LAYOUT_CYCLE.length];

  const mathResult = useMemo(() => {
    const trimmed = query.trim();
    const expr = trimmed.startsWith('=') ? trimmed.slice(1).trim() : trimmed;
    if (!expr || !/^[0-9+\-*/().\s]+$/.test(expr) || !/[+\-*/]/.test(expr)) return null;
    try {
      const val = Function(`"use strict"; return (${expr});`)();
      if (typeof val === 'number' && Number.isFinite(val)) {
        return Number.isInteger(val) ? String(val) : val.toFixed(4).replace(/\.?0+$/, '');
      }
      return null;
    } catch {
      return null;
    }
  }, [query]);

  const shellActions = useMemo(
    () => [
      {
        id: 'control_center',
        label: 'Control Center',
        subtitle: 'Open Apple-style quick toggles & sliders',
        keywords: 'control center apple sidebar wifi bluetooth notifications',
        icon: SlidersHorizontal,
        active: false,
        onClick: () => {
          onChangeView('idle');
          onToggleSidebar();
        },
      },
      {
        id: 'wallpaper',
        label: 'Wallpaper Picker',
        subtitle: 'Change wallpaper & M3 seed color',
        keywords: 'wallpaper theme seed m3 image',
        icon: ImageIcon,
        active: false,
        onClick: () => {
          onChangeView('idle');
          onOpenWallpaperPicker();
        },
      },
      {
        id: 'clipboard',
        label: 'Clipboard History',
        subtitle: 'Search & paste from myx-clip ring',
        keywords: 'myx-clip history paste copy',
        icon: Clipboard,
        active: false,
        onClick: () => {
          onChangeView('idle');
          onOpenClipboard();
        },
      },
      {
        id: 'keybinds',
        label: 'Keybind Changer',
        subtitle: 'Customize global shortcuts',
        keywords: 'shortcuts keys bindings',
        icon: Keyboard,
        active: false,
        onClick: () => {
          onChangeView('idle');
          onOpenKeybinds();
        },
      },
      {
        id: 'theme',
        label: config.darkMode ? 'Light Appearance' : 'Dark Appearance',
        subtitle: 'Toggle light / dark Material 3 surfaces',
        keywords: 'dark light theme appearance',
        icon: SunMoon,
        active: config.darkMode,
        onClick: () => onUpdateConfig({ darkMode: !config.darkMode }),
      },
      {
        id: 'screenshot',
        label: 'Screenshot Region',
        subtitle: 'Capture screen region to clipboard',
        keywords: 'grim slurp capture screenshot',
        icon: Camera,
        active: false,
        onClick: () => {
          onChangeView('idle');
          onScreenshotRegion();
        },
      },
      {
        id: 'record',
        label: isRecording ? 'Stop Recording' : 'Screen Record',
        subtitle: 'Toggle wf-recorder capture',
        keywords: 'wf-recorder obs video screen record',
        icon: Video,
        active: isRecording,
        onClick: onToggleRecording,
      },
      {
        id: 'layout',
        label: `Layout: ${config.nyxLayout}`,
        subtitle: `Switch Nyx tiling to ${nextLayout}`,
        keywords: 'dwindle scrolling master tiling nyx',
        icon: LayoutGrid,
        active: true,
        onClick: () => onUpdateConfig({ nyxLayout: nextLayout }, `Layout: ${nextLayout}`),
      },
      {
        id: 'switch_m3',
        label: 'Switch to M3 Mode',
        subtitle: 'Enable M3 Top Bar, Dock & Edge Sidebar',
        keywords: 'm3 bar dock sidebar shell mode',
        icon: Layers,
        active: false,
        onClick: () => {
          onChangeView('idle');
          onUpdateConfig({ shellMode: 'm3' }, 'Shell Mode: M3 (Bar + Dock)');
        },
      },
      {
        id: 'dnd',
        label: config.dndEnabled ? 'DND On' : 'DND Off',
        subtitle: 'Toggle Do Not Disturb focus',
        keywords: 'do not disturb focus bell mute',
        icon: BellOff,
        active: config.dndEnabled,
        onClick: () => onUpdateConfig({ dndEnabled: !config.dndEnabled }),
      },
      {
        id: 'export',
        label: 'Export Rust ZIP',
        subtitle: 'Download Nyx + Myx source & dotfiles',
        keywords: 'download rust dotfiles bundle zip',
        icon: Download,
        active: false,
        onClick: () => {
          onChangeView('idle');
          onDownloadZip();
        },
      },
      {
        id: 'lock',
        label: 'Lock Screen',
        subtitle: 'Engage Wayland session lock',
        keywords: 'lock session screen power',
        icon: Lock,
        active: false,
        onClick: () => {
          onChangeView('idle');
          onLock();
        },
      },
    ],
    [
      config.darkMode,
      config.nyxLayout,
      config.dndEnabled,
      isRecording,
      nextLayout,
      onChangeView,
      onToggleSidebar,
      onOpenWallpaperPicker,
      onOpenClipboard,
      onOpenKeybinds,
      onUpdateConfig,
      onScreenshotRegion,
      onToggleRecording,
      onDownloadZip,
      onLock,
    ]
  );

  const q = query.trim().toLowerCase();
  const allWallpapers = useMemo(
    () => [...WALLPAPERS, ...config.customWallpapers],
    [config.customWallpapers]
  );

  const searchResults = useMemo(() => {
    const items: {
      id: string;
      title: string;
      subtitle: string;
      badge: string;
      icon: React.ComponentType<{ className?: string }>;
      run: () => void;
    }[] = [];

    for (const app of APP_ITEMS) {
      const win = windows.find((w) => w.id === app.id);
      items.push({
        id: `app-${app.id}`,
        title: app.label,
        subtitle: win?.isOpen ? `Running on Workspace ${win.workspace} — Click to focus` : 'Launch application',
        badge: win?.isOpen ? 'Active' : 'App',
        icon: app.icon,
        run: () => {
          onFocusOrOpenApp(app.id);
          onChangeView('idle');
        },
      });
    }

    for (const act of shellActions) {
      items.push({
        id: `act-${act.id}`,
        title: act.label,
        subtitle: act.subtitle,
        badge: 'Action',
        icon: act.icon,
        run: act.onClick,
      });
    }

    for (const wp of allWallpapers) {
      items.push({
        id: `wp-${wp.id}`,
        title: `Wallpaper: ${wp.name}`,
        subtitle: `${wp.subtitle} · ${wp.seedColor}`,
        badge: 'Theme',
        icon: ImageIcon,
        run: () => {
          onSelectWallpaper(wp.id);
          onChangeView('idle');
        },
      });
    }

    if (!q) return items.slice(0, 8);
    return items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.subtitle.toLowerCase().includes(q) ||
        i.badge.toLowerCase().includes(q)
    );
  }, [q, windows, shellActions, allWallpapers, onFocusOrOpenApp, onChangeView, onSelectWallpaper]);

  // Only render Mixi in Mixi Mode
  if (config.shellMode !== 'mixi') return null;

  const isRevealed = !config.mixieAutoHide || hovered || isExpanded;
  const surfaceStyles = getSurfaceStyles(
    config.materialType,
    config.transparency,
    palette,
    config.darkMode,
    { elevation: 'overlay', blurPasses: config.blurPasses }
  );

  const openWindows = windows.filter((w) => w.isOpen);
  const pos = config.mixiePosition;
  const isVerticalSide = pos === 'left_center' || pos === 'right_center';

  const anchorContainerStyle: React.CSSProperties = (() => {
    switch (pos) {
      case 'top_left':
        return { top: 14, left: 14, alignItems: 'flex-start', justifyContent: 'flex-start' };
      case 'top_center':
        return { top: 14, left: 0, right: 0, alignItems: 'flex-start', justifyContent: 'center' };
      case 'top_right':
        return { top: 14, right: 14, alignItems: 'flex-start', justifyContent: 'flex-end' };
      case 'left_center':
        return { left: 14, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'flex-start' };
      case 'right_center':
        return { right: 14, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'flex-end' };
      case 'bottom_left':
        return { bottom: 14, left: 14, alignItems: 'flex-end', justifyContent: 'flex-start' };
      case 'bottom_center':
        return { bottom: 14, left: 0, right: 0, alignItems: 'flex-end', justifyContent: 'center' };
      case 'bottom_right':
        return { bottom: 14, right: 14, alignItems: 'flex-end', justifyContent: 'flex-end' };
    }
  })();

  // Generous hover-bridge sensor so Auto-Hide never drops cursor between edge and blob
  const sensorStyle: React.CSSProperties = (() => {
    switch (pos) {
      case 'top_left':
        return { top: 0, left: 0, width: 96, height: 84, alignItems: 'flex-start', justifyContent: 'flex-start', paddingTop: 4, paddingLeft: 20 };
      case 'top_center':
        return { top: 0, left: '50%', transform: 'translateX(-50%)', width: 180, height: 76, alignItems: 'flex-start', justifyContent: 'center', paddingTop: 4 };
      case 'top_right':
        return { top: 0, right: 0, width: 96, height: 84, alignItems: 'flex-start', justifyContent: 'flex-end', paddingTop: 4, paddingRight: 20 };
      case 'left_center':
        return { left: 0, top: '50%', transform: 'translateY(-50%)', width: 78, height: 150, alignItems: 'center', justifyContent: 'flex-start', paddingLeft: 4 };
      case 'right_center':
        return { right: 0, top: '50%', transform: 'translateY(-50%)', width: 78, height: 150, alignItems: 'center', justifyContent: 'flex-end', paddingRight: 4 };
      case 'bottom_left':
        return { bottom: 0, left: 0, width: 96, height: 84, alignItems: 'flex-end', justifyContent: 'flex-start', paddingBottom: 4, paddingLeft: 20 };
      case 'bottom_center':
        return { bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 180, height: 76, alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 4 };
      case 'bottom_right':
        return { bottom: 0, right: 0, width: 96, height: 84, alignItems: 'flex-end', justifyContent: 'flex-end', paddingBottom: 4, paddingRight: 20 };
    }
  })();

  const animSec = 0.26 * config.animSpeed;

  const showHoverChip = hovered && !isExpanded && (config.mixieShowClock || config.mixieShowMedia || config.mixieShowWorkspaces);

  return (
    <>
      {/* Edge Hover Sensor when Mixi Auto-Hide is ON */}
      {config.mixieAutoHide && !isExpanded && (
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          aria-hidden="true"
          className="fixed z-40 flex"
          style={sensorStyle}
        >
          <span
            className="rounded-full transition-opacity duration-200 pointer-events-none"
            style={{
              width: isVerticalSide ? 4 : 38,
              height: isVerticalSide ? 38 : 4,
              backgroundColor: palette.primary,
              opacity: isRevealed ? 0 : 0.78,
              boxShadow: `0 0 12px ${hexToRgba(palette.primary, 0.45)}`,
            }}
          />
        </div>
      )}

      {/* Backdrop when Mixi is open (Tasks or Search) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: animSec * 0.7 }}
            onClick={() => onChangeView('idle')}
            className="fixed inset-0 z-40 bg-black/28 backdrop-blur-[3px]"
          />
        )}
      </AnimatePresence>

      {/* Positioned Anchor Container */}
      <div
        className={`fixed flex pointer-events-none ${isExpanded ? 'z-50' : 'z-40'}`}
        style={anchorContainerStyle}
      >
        <AnimatePresence mode="wait" initial={false}>
          {view === 'idle' && (
            <motion.div
              key="mixie-idle-wrapper"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              initial={{ opacity: 0, scale: 0.75 }}
              animate={{
                opacity: isRevealed ? 1 : 0,
                scale: isRevealed ? 1 : 0.75,
              }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: animSec, ease: bezierPoints }}
              className="flex items-center gap-2"
              style={{ pointerEvents: isRevealed ? 'auto' : 'none' }}
            >
              {/* Cute Circular Blob */}
              <motion.button
                type="button"
                onClick={() => onChangeView('tasks')}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                transition={{ duration: 0.18, ease: bezierPoints }}
                aria-label="Open Mixi Task Manager"
                title="Mixi — Click for Task Manager · Alt+Space for Search"
                className="relative w-12 h-12 rounded-full flex items-center justify-center shadow-2xl cursor-pointer select-none"
                style={{
                  color: palette.onSurface,
                  ...surfaceStyles,
                  boxShadow: `0 10px 28px ${hexToRgba(palette.primary, 0.24)}, inset 0 1px 0 rgba(255,255,255,0.28)`,
                }}
              >
                {/* Inner Organic Core */}
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{
                    background: `radial-gradient(circle at 32% 30%, ${palette.primary}, ${palette.tertiary})`,
                    color: palette.onPrimary,
                  }}
                >
                  {config.mixieShowMedia && media.isPlaying ? (
                    <span className="flex items-end gap-[2px] h-3">
                      {[0.55, 1, 0.65].map((h, i) => (
                        <span
                          key={i}
                          className="w-[2.5px] rounded-full transition-all duration-300"
                          style={{
                            height: `${Math.round(h * 11)}px`,
                            backgroundColor: 'currentColor',
                          }}
                        />
                      ))}
                    </span>
                  ) : (
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: 'rgba(255,255,255,0.92)' }}
                    />
                  )}
                </span>

                {/* Optional Workspace Micro-Badge on Blob Rim */}
                {config.mixieShowWorkspaces && (
                  <span
                    className="absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-mono-code font-bold tabular-nums shadow"
                    style={{
                      backgroundColor: palette.primaryContainer,
                      color: palette.onPrimaryContainer,
                      border: `1.5px solid ${palette.surface}`,
                    }}
                  >
                    {activeWorkspace}
                  </span>
                )}

                {/* Live Recording Indicator */}
                {isRecording && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: palette.error,
                      border: `1.5px solid ${palette.surface}`,
                    }}
                  />
                )}
              </motion.button>

              {/* Quiet Hover Info Chip (shows Clock / Live Media / Tasks hint on hover) */}
              <AnimatePresence>
                {showHoverChip && (
                  <motion.button
                    type="button"
                    onClick={() => onChangeView('tasks')}
                    initial={{ opacity: 0, scale: 0.9, x: pos.includes('right') ? 8 : -8 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.16, ease: bezierPoints }}
                    className="px-3 py-1.5 rounded-full text-[11px] flex items-center gap-2 shadow-xl cursor-pointer whitespace-nowrap"
                    style={{
                      order: pos.includes('right') ? -1 : 1,
                      color: palette.onSurface,
                      ...surfaceStyles,
                    }}
                  >
                    <span className="font-display font-semibold">Mixi</span>
                    {config.mixieShowMedia && (
                      <span className="opacity-80 truncate max-w-[120px]">
                        · {media.title}
                      </span>
                    )}
                    {config.mixieShowClock && (
                      <span className="font-mono-code tabular-nums opacity-75">
                        · {timeStr}
                      </span>
                    )}
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {view === 'tasks' && (
            <motion.section
              key="mixie-tasks"
              aria-label="Mixi Task Manager"
              initial={{ opacity: 0, scale: 0.82 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.88 }}
              transition={{ duration: animSec, ease: bezierPoints }}
              className="pointer-events-auto w-[410px] max-w-[calc(100vw-24px)] max-h-[82vh] flex flex-col overflow-hidden shadow-2xl"
              style={{
                borderRadius: Math.max(24, config.rounding + 10),
                color: palette.onSurface,
                ...surfaceStyles,
              }}
            >
              {/* Task Manager Header */}
              <div
                className="px-4 py-3 border-b flex items-center justify-between gap-2 shrink-0"
                style={{ borderColor: hexToRgba(palette.outlineVariant, 0.38) }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center"
                    style={{
                      background: `radial-gradient(circle at 32% 30%, ${palette.primary}, ${palette.tertiary})`,
                      color: palette.onPrimary,
                    }}
                  >
                    <span className="w-2 h-2 rounded-full bg-white/90" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-display font-semibold flex items-center gap-1.5">
                      <span>Mixi Task Manager</span>
                      {config.mixieShowClock && (
                        <span
                          className="font-mono-code text-[11px] font-normal tabular-nums"
                          style={{ color: palette.onSurfaceVariant }}
                        >
                          · {timeStr}
                        </span>
                      )}
                    </div>
                    <div
                      className="text-[11px] font-mono-code tabular-nums"
                      style={{ color: palette.onSurfaceVariant }}
                    >
                      {openWindows.length} active · {ramMb.toFixed(1)} MB RAM
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onChangeView('search')}
                    title="Search & Launcher (Alt+Space)"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold cursor-pointer transition-transform active:scale-95"
                    style={{
                      backgroundColor: palette.primaryContainer,
                      color: palette.onPrimaryContainer,
                    }}
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Search</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onChangeView('idle');
                      onToggleSidebar();
                    }}
                    title="Apple Control Center (Alt+A)"
                    className="w-7 h-7 rounded-full flex items-center justify-center hover:opacity-85 cursor-pointer"
                    style={{ backgroundColor: palette.surfaceContainerHigh }}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeView('idle')}
                    aria-label="Minimize Mixi back to blob"
                    className="w-7 h-7 rounded-full flex items-center justify-center hover:opacity-85 cursor-pointer"
                    style={{ backgroundColor: palette.surfaceContainerHigh }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-3.5 space-y-3.5 overflow-y-auto">
                {/* Active Running Windows (Task Manager List) */}
                <div className="space-y-1.5">
                  <div
                    className="text-[11px] font-medium px-0.5 flex items-center justify-between"
                    style={{ color: palette.onSurfaceVariant }}
                  >
                    <span>Running Windows</span>
                    <span className="font-mono-code tabular-nums">
                      {openWindows.length} open
                    </span>
                  </div>

                  {openWindows.length === 0 ? (
                    <div
                      className="py-5 px-3 rounded-2xl text-center text-xs"
                      style={{
                        backgroundColor: hexToRgba(palette.surfaceContainer, 0.55),
                        color: palette.onSurfaceVariant,
                      }}
                    >
                      No open windows. Launch an app below or press Alt+Space.
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {openWindows.map((w) => {
                        const Icon = APP_ICON_MAP[w.id];
                        const isFocused = w.id === focusedWindowId && w.workspace === activeWorkspace && !w.isMinimized;
                        return (
                          <div
                            key={w.id}
                            className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-2xl transition-colors"
                            style={{
                              backgroundColor: isFocused
                                ? palette.primaryContainer
                                : hexToRgba(palette.surfaceContainerHigh, 0.68),
                              color: isFocused ? palette.onPrimaryContainer : palette.onSurface,
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                onFocusOrOpenApp(w.id);
                                onChangeView('idle');
                              }}
                              className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
                            >
                              <div
                                className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                                style={{
                                  backgroundColor: isFocused
                                    ? palette.primary
                                    : palette.surfaceContainerHighest,
                                  color: isFocused ? palette.onPrimary : palette.primary,
                                }}
                              >
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-semibold truncate">{w.title}</div>
                                <div className="text-[10px] opacity-75 font-mono-code truncate">
                                  {w.appClass}
                                  {config.mixieShowWorkspaces ? ` · WS${w.workspace}` : ''}
                                  {w.isMinimized ? ' · Minimized' : w.isFloating ? ' · Floating' : ''}
                                </div>
                              </div>
                            </button>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => onToggleFloating(w.id)}
                                title={w.isFloating ? 'Tile window' : 'Float window'}
                                className="px-2 py-1 rounded-lg text-[10px] font-medium hover:bg-black/10 cursor-pointer"
                              >
                                {w.isFloating ? 'Tile' : 'Float'}
                              </button>
                              <button
                                type="button"
                                onClick={() => onMinimizeWindow(w.id)}
                                title="Minimize window"
                                className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-black/10 cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onCloseWindow(w.id)}
                                title="Close task"
                                className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-red-500/20 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Workspaces Strip (Togglable via mixieShowWorkspaces) */}
                {config.mixieShowWorkspaces && (
                  <div className="space-y-1.5">
                    <div
                      className="text-[11px] font-medium px-0.5 flex items-center justify-between"
                      style={{ color: palette.onSurfaceVariant }}
                    >
                      <span>Workspaces</span>
                      {config.nyxInfiniteWorkspaces && (
                        <button
                          type="button"
                          onClick={() => onSelectWorkspace(workspaceCount + 1)}
                          className="text-[10px] font-semibold cursor-pointer"
                          style={{ color: palette.primary }}
                        >
                          + WS {workspaceCount + 1}
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {Array.from({ length: workspaceCount }, (_, idx) => idx + 1).map((ws) => {
                        const active = ws === activeWorkspace;
                        const count = windows.filter((w) => w.isOpen && w.workspace === ws).length;
                        return (
                          <button
                            key={ws}
                            type="button"
                            onClick={() => onSelectWorkspace(ws)}
                            className="py-1.5 px-2 rounded-xl flex items-center justify-between text-xs font-mono-code font-semibold transition-colors cursor-pointer"
                            style={{
                              backgroundColor: active
                                ? palette.primary
                                : hexToRgba(palette.surfaceContainerHigh, 0.72),
                              color: active ? palette.onPrimary : palette.onSurface,
                            }}
                          >
                            <span>{ws}</span>
                            <span className="text-[10px] opacity-75 tabular-nums">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Live Media Capsule (Togglable via mixieShowMedia) */}
                {config.mixieShowMedia && (
                  <div
                    className="p-3 rounded-2xl space-y-2.5"
                    style={{ backgroundColor: hexToRgba(palette.surfaceContainer, 0.72) }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate">{media.title}</div>
                        <div
                          className="text-[11px] truncate"
                          style={{ color: palette.onSurfaceVariant }}
                        >
                          {media.artist}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => onSkipTrack(-1)}
                          aria-label="Previous track"
                          className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 cursor-pointer"
                        >
                          <SkipBack className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={onToggleMediaPlay}
                          aria-label={media.isPlaying ? 'Pause' : 'Play'}
                          className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
                          style={{ backgroundColor: palette.primary, color: palette.onPrimary }}
                        >
                          {media.isPlaying ? (
                            <Pause className="w-3.5 h-3.5" />
                          ) : (
                            <Play className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => onSkipTrack(1)}
                          aria-label="Next track"
                          className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 cursor-pointer"
                        >
                          <SkipForward className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-0.5">
                      <label className="flex items-center gap-2 text-[11px]">
                        <Volume2 className="w-3.5 h-3.5 shrink-0" style={{ color: palette.primary }} />
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={config.volume}
                          onChange={(e) => onUpdateConfig({ volume: Number(e.target.value) })}
                          className="w-full accent-current cursor-pointer"
                          style={{ color: palette.primary }}
                        />
                      </label>
                      <label className="flex items-center gap-2 text-[11px]">
                        <Sun className="w-3.5 h-3.5 shrink-0" style={{ color: palette.primary }} />
                        <input
                          type="range"
                          min={15}
                          max={100}
                          value={config.brightness}
                          onChange={(e) => onUpdateConfig({ brightness: Number(e.target.value) })}
                          className="w-full accent-current cursor-pointer"
                          style={{ color: palette.primary }}
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* Launch Apps Strip */}
                <div className="space-y-1.5">
                  <div
                    className="text-[11px] font-medium px-0.5"
                    style={{ color: palette.onSurfaceVariant }}
                  >
                    Applications
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {APP_ITEMS.map((app) => {
                      const Icon = app.icon;
                      const win = windows.find((w) => w.id === app.id);
                      const isOpen = Boolean(win?.isOpen);
                      return (
                        <button
                          key={app.id}
                          type="button"
                          onClick={() => {
                            onFocusOrOpenApp(app.id);
                            onChangeView('idle');
                          }}
                          title={app.label}
                          className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-2xl text-[11px] font-medium transition-transform active:scale-95 cursor-pointer"
                          style={{
                            backgroundColor: isOpen
                              ? palette.primaryContainer
                              : hexToRgba(palette.surfaceContainerHigh, 0.7),
                            color: isOpen ? palette.onPrimaryContainer : palette.onSurface,
                          }}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="truncate max-w-full">{app.short}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Visual Actions */}
                <div className="grid grid-cols-3 gap-1.5">
                  {shellActions.slice(1, 10).map((act) => {
                    const Icon = act.icon;
                    return (
                      <button
                        key={act.id}
                        type="button"
                        onClick={act.onClick}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-[11px] font-medium text-left transition-colors cursor-pointer"
                        style={{
                          backgroundColor: act.active
                            ? palette.secondaryContainer
                            : hexToRgba(palette.surfaceContainerHigh, 0.65),
                          color: act.active ? palette.onSecondaryContainer : palette.onSurface,
                        }}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{act.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.section>
          )}

          {view === 'search' && (
            <motion.section
              key="mixie-search"
              aria-label="Mixi Custom Alt+Space Search"
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: animSec, ease: bezierPoints }}
              className="pointer-events-auto w-[450px] max-w-[calc(100vw-24px)] max-h-[82vh] flex flex-col overflow-hidden shadow-2xl"
              style={{
                borderRadius: Math.max(24, config.rounding + 10),
                color: palette.onSurface,
                ...surfaceStyles,
              }}
            >
              {/* Search Bar */}
              <div
                className="flex items-center gap-2.5 px-3.5 py-3 border-b"
                style={{ borderColor: hexToRgba(palette.outlineVariant, 0.4) }}
              >
                <button
                  type="button"
                  onClick={() => onChangeView('tasks')}
                  title="Back to Task Manager"
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:opacity-85 shrink-0 cursor-pointer"
                  style={{ backgroundColor: palette.surfaceContainerHigh }}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <Search className="w-4 h-4 shrink-0" style={{ color: palette.primary }} />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchResults.length > 0) {
                      searchResults[0].run();
                    }
                  }}
                  placeholder="Mixi Search · Apps, windows, wallpapers, or math..."
                  className="w-full bg-transparent text-xs outline-none placeholder:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => onChangeView('idle')}
                  className="text-[10px] font-mono-code px-2 py-1 rounded-full shrink-0 cursor-pointer"
                  style={{
                    backgroundColor: palette.surfaceContainerHigh,
                    color: palette.onSurfaceVariant,
                  }}
                >
                  ESC
                </button>
              </div>

              {mathResult && (
                <div
                  className="flex items-center justify-between px-4 py-2.5 border-b"
                  style={{
                    backgroundColor: palette.secondaryContainer,
                    color: palette.onSecondaryContainer,
                    borderColor: hexToRgba(palette.outlineVariant, 0.35),
                  }}
                >
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <Calculator className="w-3.5 h-3.5" />
                    <span>Calculator</span>
                  </div>
                  <span className="text-sm font-mono-code font-semibold tabular-nums">
                    = {mathResult}
                  </span>
                </div>
              )}

              {/* Search Results */}
              <div className="p-2 overflow-y-auto space-y-1 max-h-80">
                {searchResults.length === 0 ? (
                  <div
                    className="py-8 text-center text-xs"
                    style={{ color: palette.onSurfaceVariant }}
                  >
                    No matching apps, tasks, or commands.
                  </div>
                ) : (
                  searchResults.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={item.run}
                        className="w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-2xl text-left transition-colors cursor-pointer"
                        style={{
                          backgroundColor:
                            idx === 0
                              ? hexToRgba(palette.primaryContainer, 0.72)
                              : 'transparent',
                        }}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: hexToRgba(palette.surfaceContainerHigh, 0.8),
                              color: palette.primary,
                            }}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold truncate">{item.title}</div>
                            <div
                              className="text-[11px] truncate"
                              style={{ color: palette.onSurfaceVariant }}
                            >
                              {item.subtitle}
                            </div>
                          </div>
                        </div>
                        <span
                          className="text-[10px] font-mono-code shrink-0"
                          style={{ color: palette.onSurfaceVariant }}
                        >
                          {item.badge}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};
