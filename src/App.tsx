import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import JSZip from 'jszip';
import {
  Camera,
  Clipboard,
  FileCode2,
  Image as ImageIcon,
  Inbox,
  Keyboard,
  LayoutGrid,
  Lock,
  NotebookPen,
  Pipette,
  Sliders,
  Sparkles,
  SunMoon,
  Terminal,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { CheatsheetModal } from './components/CheatsheetModal';
import { ClipboardModal } from './components/ClipboardModal';
import { ColorPickerOverlay } from './components/ColorPickerOverlay';
import { ControlCenter } from './components/ControlCenter';
import { DesktopStage } from './components/DesktopStage';
import { Lockscreen } from './components/Lockscreen';
import { MixieIsland } from './components/MixieIsland';
import { OverviewModal } from './components/OverviewModal';
import { ScreenshotOverlay } from './components/ScreenshotOverlay';
import { ShellBar } from './components/ShellBar';
import { ShellDock } from './components/ShellDock';
import { WallpaperPickerModal } from './components/WallpaperPickerModal';
import { WindowSwitcherModal } from './components/WindowSwitcherModal';
import {
  BEZIER_PRESETS,
  DEFAULT_KEYBINDS,
  DEFAULT_SHELL_CONFIG,
  generateM3Palette,
  getTotalRamMb,
  hexToRgba,
  INITIAL_CLIPBOARD,
  WALLPAPERS,
} from './lib/m3Engine';
import { generateRustShellFiles } from './lib/rustShellGenerator';
import { getSurfaceStyles } from './lib/surfaceMaterial';
import {
  AppWindowId,
  ClipboardItem,
  DesktopWindow,
  KeybindEntry,
  MediaTrack,
  MixieView,
  RicePreset,
  ShellConfig,
  ShellNotification,
  WallpaperPreset,
} from './types/shell';

const STORAGE_KEY = 'myx_nyx_config_v4';
const CLIPBOARD_STORAGE_KEY = 'myx_clipboard_v1';

const INITIAL_WINDOWS: DesktopWindow[] = [
  {
    id: 'customizer',
    title: 'Myx + Nyx Settings',
    appClass: 'myx-ctl',
    workspace: 1,
    isOpen: true,
    isMinimized: false,
    isFloating: false,
    isMaximized: false,
    zOrder: 1,
  },
  {
    id: 'terminal',
    title: 'nyx-term — zsh',
    appClass: 'nyx-term',
    workspace: 1,
    isOpen: true,
    isMinimized: false,
    isFloating: false,
    isMaximized: false,
    zOrder: 2,
  },
  {
    id: 'code_export',
    title: 'Nyx + Myx Rust Source & Dotfiles',
    appClass: 'nyx-src',
    workspace: 2,
    isOpen: true,
    isMinimized: false,
    isFloating: false,
    isMaximized: false,
    zOrder: 3,
  },
  {
    id: 'notes',
    title: 'Scratchpad Notes',
    appClass: 'myx-notes',
    workspace: 2,
    isOpen: true,
    isMinimized: false,
    isFloating: false,
    isMaximized: false,
    zOrder: 4,
  },
  {
    id: 'telemetry',
    title: 'Nyx + Myx RAM Telemetry',
    appClass: 'btop-rs',
    workspace: 3,
    isOpen: true,
    isMinimized: false,
    isFloating: false,
    isMaximized: false,
    zOrder: 5,
  },
];

const TRACKS: MediaTrack[] = [
  {
    title: 'Midnight Glass',
    artist: 'Kiasmos',
    album: 'II',
    durationSec: 254,
    positionSec: 88,
    isPlaying: true,
  },
  {
    title: 'Weightless Telemetry',
    artist: 'Rival Consoles',
    album: 'Now Is',
    durationSec: 238,
    positionSec: 42,
    isPlaying: true,
  },
  {
    title: 'Aether Drift',
    artist: 'Ólafur Arnalds',
    album: 're:member',
    durationSec: 215,
    positionSec: 112,
    isPlaying: true,
  },
];

const INITIAL_NOTIFICATIONS: ShellNotification[] = [
  {
    id: 'notif-1',
    app: 'nyx-compositor',
    title: 'Smithay + Calloop Wayland session ready',
    body: 'hyprctl IPC socket bound. Active layout: Dwindle.',
    timestamp: 'Just now',
    urgency: 'normal',
  },
  {
    id: 'notif-2',
    app: 'myx-daemon',
    title: 'Material 3 palette synchronized',
    body: 'Tonal tokens compiled from active wallpaper in 0.4ms.',
    timestamp: '1m ago',
    urgency: 'low',
  },
];

function loadSavedConfig(): ShellConfig {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SHELL_CONFIG;
    const parsed = JSON.parse(raw) as Partial<ShellConfig>;
    return {
      ...DEFAULT_SHELL_CONFIG,
      ...parsed,
      customWallpapers: Array.isArray(parsed.customWallpapers)
        ? parsed.customWallpapers
        : DEFAULT_SHELL_CONFIG.customWallpapers,
      displays:
        Array.isArray(parsed.displays) && parsed.displays.length > 0
          ? parsed.displays
          : DEFAULT_SHELL_CONFIG.displays,
      windowRules: Array.isArray(parsed.windowRules)
        ? parsed.windowRules
        : DEFAULT_SHELL_CONFIG.windowRules,
      keybinds:
        Array.isArray(parsed.keybinds) && parsed.keybinds.length > 0
          ? DEFAULT_KEYBINDS.map(
              (def) => parsed.keybinds?.find((k) => k.id === def.id) ?? def
            )
          : DEFAULT_KEYBINDS,
      modules:
        Array.isArray(parsed.modules) && parsed.modules.length > 0
          ? parsed.modules
          : DEFAULT_SHELL_CONFIG.modules,
    };
  } catch {
    return DEFAULT_SHELL_CONFIG;
  }
}

function loadSavedClipboard(): ClipboardItem[] {
  try {
    const raw = window.localStorage.getItem(CLIPBOARD_STORAGE_KEY);
    if (!raw) return INITIAL_CLIPBOARD;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_CLIPBOARD;
  } catch {
    return INITIAL_CLIPBOARD;
  }
}

export default function App() {
  const [config, setConfig] = useState<ShellConfig>(loadSavedConfig);
  const [activeWorkspace, setActiveWorkspace] = useState<number>(1);
  const [windows, setWindows] = useState<DesktopWindow[]>(INITIAL_WINDOWS);
  const [focusedWindowId, setFocusedWindowId] = useState<AppWindowId | null>('customizer');
  const zCounterRef = useRef(10);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [screenshotOpen, setScreenshotOpen] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [specialOpen, setSpecialOpen] = useState(false);
  const [mixieView, setMixieView] = useState<MixieView>('idle');
  const [cheatsheetOpen, setCheatsheetOpen] = useState(false);
  const [wallpaperPickerOpen, setWallpaperPickerOpen] = useState(false);
  const [clipboardOpen, setClipboardOpen] = useState(false);
  const [locked, setLocked] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [clipboardItems, setClipboardItems] = useState<ClipboardItem[]>(loadSavedClipboard);

  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [notifications, setNotifications] = useState<ShellNotification[]>(INITIAL_NOTIFICATIONS);
  const [osdMessage, setOsdMessage] = useState<string | null>(null);
  const osdTimerRef = useRef<number | null>(null);

  const palette = useMemo(
    () => generateM3Palette(config.seedColor, config.m3Scheme, config.darkMode),
    [config.seedColor, config.m3Scheme, config.darkMode]
  );

  const bezier = useMemo(
    () => BEZIER_PRESETS.find((b) => b.id === config.bezierPreset) ?? BEZIER_PRESETS[0],
    [config.bezierPreset]
  );

  const allWallpapers = useMemo(
    () => [...WALLPAPERS, ...config.customWallpapers],
    [config.customWallpapers]
  );

  const wallpaper = useMemo(
    () => allWallpapers.find((w) => w.id === config.wallpaperId) ?? WALLPAPERS[0],
    [allWallpapers, config.wallpaperId]
  );

  const ram = useMemo(() => getTotalRamMb(config), [config]);

  const workspaceCount = useMemo(() => {
    const highestWinWs = windows.reduce(
      (max, w) => (w.isOpen ? Math.max(max, w.workspace) : max),
      5
    );
    return config.nyxInfiniteWorkspaces ? Math.max(5, activeWorkspace, highestWinWs) : 5;
  }, [config.nyxInfiniteWorkspaces, activeWorkspace, windows]);

  const currentMedia: MediaTrack = useMemo(
    () => ({
      ...TRACKS[trackIndex],
      isPlaying,
    }),
    [trackIndex, isPlaying]
  );

  useEffect(() => {
    const root = document.documentElement;
    if (config.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [config.darkMode]);

  useEffect(() => {
    if (config.shellMode === 'm3') {
      setMixieView('idle');
    } else {
      setOverviewOpen(false);
    }
  }, [config.shellMode]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // Ignore quota errors cleanly
    }
  }, [config]);

  useEffect(() => {
    try {
      window.localStorage.setItem(CLIPBOARD_STORAGE_KEY, JSON.stringify(clipboardItems));
    } catch {
      // Ignore quota errors cleanly
    }
  }, [clipboardItems]);

  // Hypridle auto-lock inactivity timer (suppressed when Caffeine is ON)
  useEffect(() => {
    if (locked || config.caffeineEnabled || config.idleLockMinutes <= 0) return;
    let timer = window.setTimeout(() => setLocked(true), config.idleLockMinutes * 60_000);
    const resetTimer = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setLocked(true), config.idleLockMinutes * 60_000);
    };
    window.addEventListener('pointerdown', resetTimer);
    window.addEventListener('keydown', resetTimer);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('pointerdown', resetTimer);
      window.removeEventListener('keydown', resetTimer);
    };
  }, [locked, config.caffeineEnabled, config.idleLockMinutes]);

  const triggerOsd = useCallback((msg: string) => {
    setOsdMessage(msg);
    if (osdTimerRef.current) {
      window.clearTimeout(osdTimerRef.current);
    }
    osdTimerRef.current = window.setTimeout(() => setOsdMessage(null), 1600);
  }, []);

  const handleUpdateConfig = useCallback(
    (patch: Partial<ShellConfig>, osdLabel?: string) => {
      setConfig((prev) => ({ ...prev, ...patch }));
      if (osdLabel) triggerOsd(osdLabel);
    },
    [triggerOsd]
  );

  const handleApplyPreset = useCallback(
    (preset: RicePreset) => {
      setConfig((prev) => ({ ...prev, ...preset.patch }));
      triggerOsd(`Preset: ${preset.name}`);
    },
    [triggerOsd]
  );

  const handleSelectWallpaper = useCallback(
    (id: string) => {
      const wp = allWallpapers.find((w) => w.id === id);
      if (!wp) return;
      setConfig((prev) => ({
        ...prev,
        wallpaperId: wp.id,
        seedColor: wp.seedColor,
        m3Scheme: wp.defaultScheme,
        useWallpaperSeed: true,
      }));
      triggerOsd(`Wallpaper: ${wp.name}`);
    },
    [allWallpapers, triggerOsd]
  );

  const handleAddCustomWallpaper = useCallback(
    (wp: WallpaperPreset) => {
      setConfig((prev) => ({
        ...prev,
        customWallpapers: [wp, ...prev.customWallpapers],
        wallpaperId: wp.id,
        seedColor: wp.seedColor,
        m3Scheme: wp.defaultScheme,
        useWallpaperSeed: true,
      }));
      triggerOsd(`Wallpaper added: ${wp.name}`);
    },
    [triggerOsd]
  );

  const handleRemoveCustomWallpaper = useCallback(
    (id: string) => {
      setConfig((prev) => {
        const remaining = prev.customWallpapers.filter((w) => w.id !== id);
        if (prev.wallpaperId === id) {
          return {
            ...prev,
            customWallpapers: remaining,
            wallpaperId: WALLPAPERS[0].id,
            seedColor: WALLPAPERS[0].seedColor,
            m3Scheme: WALLPAPERS[0].defaultScheme,
            useWallpaperSeed: true,
          };
        }
        return { ...prev, customWallpapers: remaining };
      });
      triggerOsd('Removed custom wallpaper');
    },
    [triggerOsd]
  );

  const handlePushClipboard = useCallback((text: string, source: string) => {
    const cleaned = text.trim();
    if (!cleaned) return;
    setClipboardItems((prev) => {
      const existing = prev.find((item) => item.text === cleaned);
      const nextItem: ClipboardItem = {
        id: existing ? existing.id : `clip-${Date.now()}`,
        text: cleaned,
        source,
        timestamp: 'Just now',
        pinned: existing ? existing.pinned : false,
      };
      const rest = prev.filter((item) => item.text !== cleaned);
      return [nextItem, ...rest].slice(0, 30);
    });
  }, []);

  const handleCopyClipboardItem = useCallback(
    async (item: ClipboardItem) => {
      try {
        await navigator.clipboard.writeText(item.text);
      } catch {
        // Ignore clipboard permissions cleanly
      }
      triggerOsd('Copied from myx-clip');
    },
    [triggerOsd]
  );

  const handleAddClipboardItem = useCallback(
    (text: string) => {
      handlePushClipboard(text, 'myx-clip');
      triggerOsd('Saved to myx-clip');
    },
    [handlePushClipboard, triggerOsd]
  );

  const handleTogglePinClip = useCallback((id: string) => {
    setClipboardItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, pinned: !item.pinned } : item))
    );
  }, []);

  const handleDeleteClip = useCallback((id: string) => {
    setClipboardItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleClearUnpinnedClips = useCallback(() => {
    setClipboardItems((prev) => prev.filter((item) => item.pinned));
    triggerOsd('Cleared unpinned clipboard entries');
  }, [triggerOsd]);

  const handleUpdateKeybinds = useCallback(
    (keybinds: KeybindEntry[]) => {
      setConfig((prev) => ({ ...prev, keybinds }));
      triggerOsd('Updated keybinds');
    },
    [triggerOsd]
  );

  const handleCycleWallpaper = useCallback(() => {
    const idx = allWallpapers.findIndex((w) => w.id === config.wallpaperId);
    const next = allWallpapers[(idx + 1) % allWallpapers.length];
    handleSelectWallpaper(next.id);
  }, [allWallpapers, config.wallpaperId, handleSelectWallpaper]);

  const handleToggleModule = useCallback((id: string) => {
    setConfig((prev) => ({
      ...prev,
      modules: prev.modules.map((m) =>
        m.id === id && !m.essential ? { ...m, enabled: !m.enabled } : m
      ),
    }));
  }, []);

  const handleResetDefaults = useCallback(() => {
    setConfig(DEFAULT_SHELL_CONFIG);
    triggerOsd('Restored default Myx + Nyx config');
  }, [triggerOsd]);

  const handleFocusWindow = useCallback((id: AppWindowId) => {
    setFocusedWindowId((prevFocused) => (prevFocused === id ? prevFocused : id));
    setWindows((prev) => {
      const target = prev.find((w) => w.id === id);
      const maxZ = prev.reduce((m, w) => Math.max(m, w.zOrder), 0);
      if (target && target.zOrder === maxZ) return prev;
      const nextZ = Math.max(zCounterRef.current + 1, maxZ + 1);
      zCounterRef.current = nextZ;
      return prev.map((w) => (w.id === id ? { ...w, zOrder: nextZ } : w));
    });
  }, []);

  const handleFocusOrOpenApp = useCallback(
    (id: AppWindowId) => {
      const nextZ = ++zCounterRef.current;
      const existing = windows.find((w) => w.id === id);
      if (!existing) return;

      const rule = config.windowRules.find(
        (r) => r.appClass.toLowerCase() === existing.appClass.toLowerCase()
      );

      if (!existing.isOpen) {
        const targetWs = rule?.defaultWorkspace ?? activeWorkspace;
        setWindows((prev) =>
          prev.map((w) =>
            w.id === id
              ? {
                  ...w,
                  isOpen: true,
                  isMinimized: false,
                  isFloating: rule?.forceFloating ?? w.isFloating,
                  isPinned: rule?.pin ?? w.isPinned,
                  workspace: targetWs,
                  zOrder: nextZ,
                }
              : w
          )
        );
        setActiveWorkspace(targetWs);
      } else {
        setWindows((prev) =>
          prev.map((w) =>
            w.id === id ? { ...w, isMinimized: false, zOrder: nextZ } : w
          )
        );
        setActiveWorkspace(existing.workspace);
      }
      setFocusedWindowId(id);
    },
    [windows, activeWorkspace, config.windowRules]
  );

  const transferFocusAfterHide = useCallback(
    (hiddenId: AppWindowId, list: DesktopWindow[]) => {
      if (focusedWindowId !== hiddenId) return;
      const fallback = list.find(
        (w) => w.id !== hiddenId && w.isOpen && !w.isMinimized && w.workspace === activeWorkspace
      );
      setFocusedWindowId(fallback ? fallback.id : null);
    },
    [focusedWindowId, activeWorkspace]
  );

  const handleCloseWindow = useCallback(
    (id: AppWindowId) => {
      setWindows((prev) => {
        transferFocusAfterHide(id, prev);
        return prev.map((w) =>
          w.id === id ? { ...w, isOpen: false, isMinimized: false, isMaximized: false } : w
        );
      });
    },
    [transferFocusAfterHide]
  );

  const handleMinimizeWindow = useCallback(
    (id: AppWindowId) => {
      setWindows((prev) => {
        transferFocusAfterHide(id, prev);
        return prev.map((w) =>
          w.id === id ? { ...w, isMinimized: true, isMaximized: false } : w
        );
      });
    },
    [transferFocusAfterHide]
  );

  const handleToggleMaximize = useCallback((id: AppWindowId) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, isMaximized: !w.isMaximized, isTrueFullscreen: false } : w
      )
    );
  }, []);

  const handleToggleTrueFullscreen = useCallback(
    (id: AppWindowId) => {
      setWindows((prev) =>
        prev.map((w) => {
          if (w.id !== id) return w;
          const next = !w.isTrueFullscreen;
          triggerOsd(next ? `Fullscreen: ${w.appClass}` : 'Restored tiling');
          return { ...w, isTrueFullscreen: next, isMaximized: false };
        })
      );
    },
    [triggerOsd]
  );

  const handleToggleGroupWindow = useCallback(
    (id: AppWindowId) => {
      setWindows((prev) =>
        prev.map((w) => {
          if (w.id !== id) return w;
          const next = !w.isGrouped;
          triggerOsd(next ? `Grouped ${w.appClass}` : `Ungrouped ${w.appClass}`);
          return { ...w, isGrouped: next, isFloating: false };
        })
      );
    },
    [triggerOsd]
  );

  const handleTogglePseudoWindow = useCallback(
    (id: AppWindowId) => {
      setWindows((prev) =>
        prev.map((w) => {
          if (w.id !== id) return w;
          const next = !w.isPseudo;
          triggerOsd(next ? `Pseudotile ON: ${w.appClass}` : `Pseudotile OFF: ${w.appClass}`);
          return { ...w, isPseudo: next };
        })
      );
    },
    [triggerOsd]
  );

  const handleToggleFloating = useCallback((id: AppWindowId) => {
    const nextZ = ++zCounterRef.current;
    setWindows((prev) =>
      prev.map((w) =>
        w.id === id
          ? {
              ...w,
              isFloating: !w.isFloating,
              isMaximized: false,
              isTrueFullscreen: false,
              isGrouped: false,
              zOrder: nextZ,
            }
          : w
      )
    );
  }, []);

  const handleMoveWindowWorkspace = useCallback(
    (id: AppWindowId, ws: number) => {
      const nextZ = ++zCounterRef.current;
      setWindows((prev) =>
        prev.map((w) =>
          w.id === id
            ? { ...w, workspace: ws, isMinimized: false, isSpecial: false, zOrder: nextZ }
            : w
        )
      );
      setActiveWorkspace(ws);
      setFocusedWindowId(id);
      triggerOsd(`Moved window to Workspace ${ws}`);
    },
    [triggerOsd]
  );

  const handleTogglePinWindow = useCallback(
    (id: AppWindowId) => {
      setWindows((prev) =>
        prev.map((w) => {
          if (w.id !== id) return w;
          const next = !w.isPinned;
          triggerOsd(next ? `Pinned ${w.appClass} across workspaces` : `Unpinned ${w.appClass}`);
          return { ...w, isPinned: next };
        })
      );
    },
    [triggerOsd]
  );

  const handleToggleSpecialWindow = useCallback(
    (id: AppWindowId) => {
      setWindows((prev) =>
        prev.map((w) => {
          if (w.id !== id) return w;
          const next = !w.isSpecial;
          if (next) setSpecialOpen(true);
          triggerOsd(next ? `Stashed ${w.appClass} to special:magic` : `Restored ${w.appClass}`);
          return { ...w, isSpecial: next, isMinimized: false, isMaximized: false };
        })
      );
    },
    [triggerOsd]
  );

  const handleCycleColWidth = useCallback(
    (id: AppWindowId) => {
      const steps = [38, 52, 68, 98];
      setWindows((prev) =>
        prev.map((w) => {
          if (w.id !== id) return w;
          const cur = w.colWidthPct ?? config.nyxScrollColWidth;
          const next = steps.find((s) => s > cur + 2) ?? steps[0];
          triggerOsd(`Column width: ${next}%`);
          return { ...w, colWidthPct: next };
        })
      );
    },
    [config.nyxScrollColWidth, triggerOsd]
  );

  const handleSwapWindow = useCallback(
    (id: AppWindowId, dir: -1 | 1) => {
      setWindows((prev) => {
        const tiled = prev.filter(
          (w) =>
            w.isOpen &&
            !w.isMinimized &&
            !w.isFloating &&
            !w.isSpecial &&
            (w.isPinned || w.workspace === activeWorkspace)
        );
        const pos = tiled.findIndex((w) => w.id === id);
        if (pos === -1) return prev;
        const swapPos = pos + dir;
        if (swapPos < 0 || swapPos >= tiled.length) return prev;
        const aId = tiled[pos].id;
        const bId = tiled[swapPos].id;
        const idxA = prev.findIndex((w) => w.id === aId);
        const idxB = prev.findIndex((w) => w.id === bId);
        if (idxA === -1 || idxB === -1) return prev;
        const next = [...prev];
        [next[idxA], next[idxB]] = [next[idxB], next[idxA]];
        return next;
      });
    },
    [activeWorkspace]
  );

  const handleFocusAdjacentWindow = useCallback(
    (dir: -1 | 1) => {
      const visible = windows.filter(
        (w) =>
          w.isOpen &&
          !w.isMinimized &&
          !w.isSpecial &&
          (w.isPinned || w.workspace === activeWorkspace)
      );
      if (visible.length === 0) return;
      const idx = visible.findIndex((w) => w.id === focusedWindowId);
      const nextIdx = idx === -1 ? 0 : (idx + dir + visible.length) % visible.length;
      handleFocusWindow(visible[nextIdx].id);
    },
    [windows, activeWorkspace, focusedWindowId, handleFocusWindow]
  );

  const handleDownloadZip = useCallback(async () => {
    const files = generateRustShellFiles(config, palette);
    const zip = new JSZip();
    for (const file of files) {
      zip.file(file.path, file.content);
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `nyx-myx-rust-${config.nyxConfigFormat}.zip`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    triggerOsd('Exported Nyx + Myx Rust bundle (.zip)');
  }, [config, palette, triggerOsd]);

  const handleDesktopContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const menuW = 228;
    const menuH = 430;
    const clampedX = Math.min(e.clientX, window.innerWidth - menuW - 12);
    const clampedY = Math.min(e.clientY, window.innerHeight - menuH - 12);
    setContextMenu({ x: Math.max(12, clampedX), y: Math.max(12, clampedY) });
  }, []);

  const handleScreenshotRegion = useCallback(() => {
    setScreenshotOpen(true);
  }, []);

  const handleCompleteScreenshot = useCallback(
    (summary: { mode: string; width: number; height: number; x: number; y: number }) => {
      setScreenshotOpen(false);
      const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const shotPath = `~/Pictures/Screenshots/nyx-${summary.mode}-${summary.width}x${summary.height}-${stamp}.png`;
      handlePushClipboard(shotPath, `grim (${summary.mode})`);
      if (!config.dndEnabled) {
        setNotifications((prev) => [
          {
            id: `notif-${Date.now()}`,
            app: 'grim + slurp',
            title: `Captured ${summary.mode} (${summary.width}×${summary.height})`,
            body: `Copied ${shotPath} to myx-clip.`,
            timestamp: 'Just now',
            urgency: 'normal',
          },
          ...prev.slice(0, 7),
        ]);
      }
      triggerOsd(`Captured ${summary.width}×${summary.height} -> myx-clip`);
    },
    [config.dndEnabled, handlePushClipboard, triggerOsd]
  );

  const handleRunLauncherCommand = useCallback(
    (cmd: string) => {
      const parts = cmd.trim().split(/\s+/);
      if (parts[0] === 'hyprctl' || parts[0] === 'nyxctl') {
        if (parts[1] === 'keyword' && parts[2] === 'general:layout' && parts[3]) {
          const layout = parts[3] === 'niri' ? 'scrolling' : parts[3] === 'mango' ? 'master' : parts[3];
          if (layout === 'dwindle' || layout === 'scrolling' || layout === 'master') {
            handleUpdateConfig({ nyxLayout: layout }, `Layout: ${layout}`);
            return;
          }
        }
        if (parts[1] === 'dispatch' && parts[2] === 'workspace' && parts[3]) {
          const n = Number(parts[3]);
          if (n >= 1) setActiveWorkspace(n);
          return;
        }
      }
      handleFocusOrOpenApp('terminal');
      triggerOsd(`Launcher -> ${cmd}`);
    },
    [handleUpdateConfig, handleFocusOrOpenApp, triggerOsd]
  );

  const handleToggleRecording = useCallback(() => {
    setIsRecording((prev) => {
      const next = !prev;
      if (!next && !config.dndEnabled) {
        setNotifications((n) => [
          {
            id: `notif-${Date.now()}`,
            app: 'wf-recorder',
            title: 'Screen recording saved',
            body: 'Saved MP4 capture to ~/Videos/nyx-recording.mp4',
            timestamp: 'Just now',
            urgency: 'normal',
          },
          ...n.slice(0, 7),
        ]);
      }
      triggerOsd(next ? 'wf-recorder: Recording started' : 'wf-recorder: Saved to ~/Videos');
      return next;
    });
  }, [config.dndEnabled, triggerOsd]);

  const handleToggleDnd = useCallback(() => {
    setConfig((prev) => {
      const next = !prev.dndEnabled;
      triggerOsd(next ? 'Do Not Disturb ON' : 'Notifications Active');
      return { ...prev, dndEnabled: next };
    });
  }, [triggerOsd]);

  const handleNotifyTrayApp = useCallback(
    (appName: string) => {
      triggerOsd(`${appName} · Background SNI applet active`);
    },
    [triggerOsd]
  );

  // Dynamic keyboard shortcuts driven by config.keybinds
  useEffect(() => {
    const matchMod = (mod: KeybindEntry['mod'], e: KeyboardEvent) => {
      if (mod === 'Alt') return e.altKey && !e.ctrlKey && !e.shiftKey;
      if (mod === 'Ctrl+Alt') return e.altKey && e.ctrlKey && !e.shiftKey;
      return e.altKey && e.shiftKey && !e.ctrlKey;
    };

    const matchKey = (targetKey: string, e: KeyboardEvent) => {
      if (targetKey === 'Space') return e.code === 'Space';
      return e.key.toLowerCase() === targetKey.toLowerCase();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (locked || e.defaultPrevented) return;
      if (e.key === 'Escape') {
        setOverviewOpen(false);
        setSwitcherOpen(false);
        setScreenshotOpen(false);
        setColorPickerOpen(false);
        setSidebarOpen(false);
        setSpecialOpen(false);
        setCheatsheetOpen(false);
        setWallpaperPickerOpen(false);
        setClipboardOpen(false);
        setContextMenu(null);
        return;
      }

      if (!e.altKey) return;

      // Alt+ArrowLeft / Alt+ArrowRight focus & Shift+Alt+ArrowLeft/Right swap columns
      if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !e.ctrlKey) {
        e.preventDefault();
        const dir: -1 | 1 = e.key === 'ArrowLeft' ? -1 : 1;
        if (e.shiftKey && focusedWindowId) {
          handleSwapWindow(focusedWindowId, dir);
        } else {
          handleFocusAdjacentWindow(dir);
        }
        return;
      }

      for (const kb of config.keybinds) {
        if (matchMod(kb.mod, e) && matchKey(kb.key, e)) {
          e.preventDefault();
          switch (kb.id) {
            case 'toggle_overview':
              if (config.shellMode === 'mixi') {
                setMixieView((v) => (v === 'search' ? 'idle' : 'search'));
              } else {
                setOverviewOpen((v) => !v);
              }
              return;
            case 'window_switcher':
              setSwitcherOpen((v) => !v);
              return;
            case 'toggle_sidebar':
              setSidebarOpen((v) => !v);
              return;
            case 'close_window':
              if (focusedWindowId) {
                handleCloseWindow(focusedWindowId);
                triggerOsd('Closed active window');
              }
              return;
            case 'toggle_floating':
              if (focusedWindowId) {
                handleToggleFloating(focusedWindowId);
                triggerOsd('Toggled floating');
              }
              return;
            case 'toggle_fullscreen':
              if (focusedWindowId) {
                handleToggleTrueFullscreen(focusedWindowId);
              }
              return;
            case 'toggle_group':
              if (focusedWindowId) {
                handleToggleGroupWindow(focusedWindowId);
              }
              return;
            case 'pin_window':
              if (focusedWindowId) {
                handleTogglePinWindow(focusedWindowId);
              }
              return;
            case 'toggle_special_workspace':
              setSpecialOpen((v) => !v);
              return;
            case 'workspace_prev':
              setActiveWorkspace((ws) => (ws === 1 ? workspaceCount : ws - 1));
              return;
            case 'workspace_next':
              setActiveWorkspace((ws) =>
                ws >= workspaceCount
                  ? config.nyxInfiniteWorkspaces
                    ? workspaceCount + 1
                    : 1
                  : ws + 1
              );
              return;
            case 'move_window_next_ws':
              if (focusedWindowId) {
                const nextWs =
                  activeWorkspace >= workspaceCount
                    ? config.nyxInfiniteWorkspaces
                      ? workspaceCount + 1
                      : 1
                    : activeWorkspace + 1;
                handleMoveWindowWorkspace(focusedWindowId, nextWs);
              }
              return;
            case 'open_wallpaper_picker':
              setWallpaperPickerOpen((v) => !v);
              return;
            case 'open_clipboard':
              setClipboardOpen((v) => !v);
              return;
            case 'screenshot_region':
              handleScreenshotRegion();
              return;
            case 'screen_record':
              handleToggleRecording();
              return;
            case 'color_picker':
              setColorPickerOpen((v) => !v);
              return;
            case 'open_terminal':
              handleFocusOrOpenApp('terminal');
              return;
            case 'open_files':
              handleFocusOrOpenApp('code_export');
              return;
            case 'open_cheatsheet':
              setCheatsheetOpen((v) => !v);
              return;
            case 'lock_screen':
              setLocked(true);
              return;
          }
        }
      }

      const digitMatch = e.code.match(/^Digit([1-9])$/);
      if (digitMatch && !e.ctrlKey) {
        const ws = Number(digitMatch[1]);
        if (!config.nyxInfiniteWorkspaces && ws > 5) return;
        e.preventDefault();
        if (e.shiftKey) {
          if (focusedWindowId) handleMoveWindowWorkspace(focusedWindowId, ws);
        } else {
          setActiveWorkspace(ws);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    locked,
    config.keybinds,
    config.shellMode,
    config.nyxInfiniteWorkspaces,
    focusedWindowId,
    activeWorkspace,
    workspaceCount,
    handleFocusOrOpenApp,
    handleCloseWindow,
    handleToggleFloating,
    handleToggleTrueFullscreen,
    handleToggleGroupWindow,
    handleTogglePinWindow,
    handleSwapWindow,
    handleFocusAdjacentWindow,
    handleMoveWindowWorkspace,
    handleScreenshotRegion,
    handleToggleRecording,
    triggerOsd,
  ]);

  const brightnessFilter = `brightness(${(config.brightness / 100) * 0.6 + 0.4})`;
  const nightSepiaAmount = Math.max(0.05, Math.min(0.42, (6500 - config.nightTempK) / 9500));
  const nightFilter = config.nightLightEnabled
    ? ` sepia(${nightSepiaAmount.toFixed(2)}) saturate(0.92)`
    : '';

  return (
    <div
      onClick={() => setContextMenu(null)}
      className="relative w-screen h-screen overflow-hidden select-none"
      style={{
        backgroundColor: palette.surface,
        filter: `${brightnessFilter}${nightFilter}`,
      }}
    >
      {/* Dynamic Wallpaper Layer */}
      <div
        className="absolute inset-0 transition-all overflow-hidden"
        style={{
          transform: overviewOpen ? 'scale(1.04)' : 'scale(1)',
          filter: overviewOpen ? 'blur(12px) brightness(0.75)' : 'none',
          transitionDuration: `${Math.round(350 * config.animSpeed)}ms`,
          transitionTimingFunction: bezier.cssCurve,
        }}
      >
        <img
          src={wallpaper.src}
          alt={wallpaper.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-opacity duration-500"
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: config.darkMode
              ? 'radial-gradient(circle at 50% 25%, rgba(0,0,0,0.08), rgba(0,0,0,0.34))'
              : 'radial-gradient(circle at 50% 25%, rgba(255,255,255,0.06), rgba(0,0,0,0.16))',
          }}
        />
      </div>

      {/* Myx Status Bar (M3 Mode only) */}
      {config.shellMode === 'm3' && (
        <ShellBar
          config={config}
          palette={palette}
          activeWorkspace={activeWorkspace}
          workspaceCount={workspaceCount}
          windows={windows}
          focusedWindowId={focusedWindowId}
          media={currentMedia}
          ramMb={ram.totalMb}
          notificationsCount={notifications.length}
          isRecording={isRecording}
          sidebarOpen={sidebarOpen}
          overviewOpen={overviewOpen}
          bezierCss={bezier.cssCurve}
          onSelectWorkspace={setActiveWorkspace}
          onToggleOverview={() => setOverviewOpen((v) => !v)}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          onToggleDnd={handleToggleDnd}
          onToggleRecording={handleToggleRecording}
          onOpenClipboard={() => setClipboardOpen(true)}
          onNotifyTrayApp={handleNotifyTrayApp}
          onToggleMediaPlay={() => setIsPlaying((v) => !v)}
          onSkipTrack={(dir) =>
            setTrackIndex((idx) => (idx + dir + TRACKS.length) % TRACKS.length)
          }
          onLock={() => setLocked(true)}
          onOpenTelemetry={() => handleFocusOrOpenApp('telemetry')}
        />
      )}

      {/* Nyx Compositor Window Stage */}
      <DesktopStage
        config={config}
        palette={palette}
        activeWorkspace={activeWorkspace}
        workspaceCount={workspaceCount}
        specialOpen={specialOpen}
        windows={windows}
        focusedWindowId={focusedWindowId}
        bezierPoints={bezier.points}
        onFocusWindow={handleFocusWindow}
        onCloseWindow={handleCloseWindow}
        onMinimizeWindow={handleMinimizeWindow}
        onToggleMaximize={handleToggleMaximize}
        onToggleTrueFullscreen={handleToggleTrueFullscreen}
        onToggleFloating={handleToggleFloating}
        onToggleGroupWindow={handleToggleGroupWindow}
        onTogglePseudoWindow={handleTogglePseudoWindow}
        onTogglePinWindow={handleTogglePinWindow}
        onToggleSpecialWindow={handleToggleSpecialWindow}
        onCycleColWidth={handleCycleColWidth}
        onSwapWindow={handleSwapWindow}
        onFocusAdjacentWindow={handleFocusAdjacentWindow}
        onMoveWindowWorkspace={handleMoveWindowWorkspace}
        onSelectWorkspace={setActiveWorkspace}
        onCloseSpecialWorkspace={() => setSpecialOpen(false)}
        onFocusOrOpenApp={handleFocusOrOpenApp}
        onUpdateConfig={handleUpdateConfig}
        onSelectWallpaper={handleSelectWallpaper}
        onToggleModule={handleToggleModule}
        onApplyPreset={handleApplyPreset}
        onResetDefaults={handleResetDefaults}
        onDownloadZip={handleDownloadZip}
        onDesktopContextMenu={handleDesktopContextMenu}
        onOpenWallpaperPicker={() => setWallpaperPickerOpen(true)}
        onOpenClipboard={() => setClipboardOpen(true)}
        onOpenKeybinds={() => setCheatsheetOpen(true)}
        onOpenColorPicker={() => setColorPickerOpen(true)}
        onPushClipboard={handlePushClipboard}
      />

      {/* Myx Active-Apps Dock (M3 Mode only) */}
      {config.shellMode === 'm3' && (
        <ShellDock
          config={config}
          palette={palette}
          windows={windows}
          activeWorkspace={activeWorkspace}
          bezierPoints={bezier.points}
          onFocusOrOpenApp={handleFocusOrOpenApp}
          onToggleOverview={() => setOverviewOpen((v) => !v)}
          onOpenCheatsheet={() => setCheatsheetOpen(true)}
        />
      )}

      {/* Mixi Cute Blob + Task Manager + Search (Mixi Mode only) */}
      <MixieIsland
        config={config}
        palette={palette}
        view={mixieView}
        activeWorkspace={activeWorkspace}
        workspaceCount={workspaceCount}
        windows={windows}
        focusedWindowId={focusedWindowId}
        media={currentMedia}
        isRecording={isRecording}
        ramMb={ram.totalMb}
        bezierPoints={bezier.points}
        onChangeView={setMixieView}
        onSelectWorkspace={setActiveWorkspace}
        onFocusOrOpenApp={handleFocusOrOpenApp}
        onCloseWindow={handleCloseWindow}
        onMinimizeWindow={handleMinimizeWindow}
        onToggleFloating={handleToggleFloating}
        onUpdateConfig={handleUpdateConfig}
        onSelectWallpaper={handleSelectWallpaper}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        onOpenWallpaperPicker={() => setWallpaperPickerOpen(true)}
        onOpenClipboard={() => setClipboardOpen(true)}
        onOpenKeybinds={() => setCheatsheetOpen(true)}
        onScreenshotRegion={handleScreenshotRegion}
        onToggleRecording={handleToggleRecording}
        onToggleMediaPlay={() => setIsPlaying((v) => !v)}
        onSkipTrack={(dir) =>
          setTrackIndex((idx) => (idx + dir + TRACKS.length) % TRACKS.length)
        }
        onDownloadZip={handleDownloadZip}
        onLock={() => setLocked(true)}
      />

      {/* Desktop Right-Click Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.16 * config.animSpeed, ease: bezier.points }}
            onClick={(e) => e.stopPropagation()}
            className="fixed z-50 w-56 p-1.5 flex flex-col gap-0.5 shadow-2xl"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
              borderRadius: Math.max(14, config.rounding),
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
            {[
              {
                label: 'Open nyx-term (Zsh)',
                icon: Terminal,
                action: () => handleFocusOrOpenApp('terminal'),
              },
              {
                label: 'Scratchpad Notes',
                icon: NotebookPen,
                action: () => handleFocusOrOpenApp('notes'),
              },
              {
                label: 'Myx + Nyx Settings',
                icon: Sliders,
                action: () => handleFocusOrOpenApp('customizer'),
              },
              {
                label: 'Nyx + Myx Source',
                icon: FileCode2,
                action: () => handleFocusOrOpenApp('code_export'),
              },
              {
                label: config.shellMode === 'mixi' ? 'Mixi Search (Alt+Space)' : 'App Launcher',
                icon: LayoutGrid,
                action: () => {
                  if (config.shellMode === 'mixi') {
                    setMixieView('search');
                  } else {
                    setOverviewOpen(true);
                  }
                },
              },
              {
                label: 'Wallpaper Picker',
                icon: ImageIcon,
                action: () => setWallpaperPickerOpen(true),
              },
              {
                label: 'Next Wallpaper',
                icon: ImageIcon,
                action: handleCycleWallpaper,
              },
              {
                label: 'Special Scratchpad (Alt+`)',
                icon: Inbox,
                action: () => setSpecialOpen((v) => !v),
              },
              {
                label: 'Region Screenshot (Shift+Alt+S)',
                icon: Camera,
                action: handleScreenshotRegion,
              },
              {
                label: 'Hyprpicker Color (Shift+Alt+P)',
                icon: Pipette,
                action: () => setColorPickerOpen(true),
              },
              {
                label: 'Clipboard History',
                icon: Clipboard,
                action: () => setClipboardOpen(true),
              },
              {
                label: 'Keybind Changer',
                icon: Keyboard,
                action: () => setCheatsheetOpen(true),
              },
              {
                label:
                  config.shellMode === 'mixi'
                    ? 'Switch to M3 Mode (Bar + Dock)'
                    : 'Switch to Mixi Mode (Blob)',
                icon: Sparkles,
                action: () =>
                  handleUpdateConfig(
                    config.shellMode === 'mixi'
                      ? { shellMode: 'm3', showBar: true, showDock: true }
                      : { shellMode: 'mixi', showMixie: true },
                    config.shellMode === 'mixi'
                      ? 'Shell Mode: M3 (Top Bar + Dock)'
                      : 'Shell Mode: Mixi (Blob + Apple CC)'
                  ),
              },
              {
                label: config.darkMode ? 'Light M3 Mode' : 'Dark M3 Mode',
                icon: SunMoon,
                action: () => handleUpdateConfig({ darkMode: !config.darkMode }),
              },
              {
                label: 'Lock Screen',
                icon: Lock,
                action: () => setLocked(true),
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setContextMenu(null);
                    item.action();
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-left hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: palette.primary }} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Escape Hatch when in M3 Mode with both Bar and Dock hidden */}
      {config.shellMode === 'm3' && !config.showBar && !config.showDock && (
        <div
          className="fixed bottom-3 right-3 z-30 flex items-center gap-1.5 p-1.5 rounded-full"
          style={getSurfaceStyles(
            config.materialType,
            config.transparency,
            palette,
            config.darkMode,
            { elevation: 'bar', blurPasses: config.blurPasses }
          )}
        >
          <button
            type="button"
            onClick={() => setOverviewOpen(true)}
            title="Open App Launcher (Alt+Space)"
            className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
            style={{ backgroundColor: palette.primaryContainer, color: palette.onPrimaryContainer }}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleFocusOrOpenApp('customizer')}
            title="Myx + Nyx Settings"
            className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
            style={{ backgroundColor: palette.secondaryContainer, color: palette.onSecondaryContainer }}
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Quick Settings & Notifications */}
      <ControlCenter
        open={sidebarOpen}
        config={config}
        palette={palette}
        media={currentMedia}
        notifications={notifications}
        ramMb={ram.totalMb}
        bezierPoints={bezier.points}
        onClose={() => setSidebarOpen(false)}
        onUpdateConfig={handleUpdateConfig}
        onSelectWallpaper={handleSelectWallpaper}
        onOpenWallpaperPicker={() => setWallpaperPickerOpen(true)}
        onOpenClipboard={() => setClipboardOpen(true)}
        onOpenColorPicker={() => setColorPickerOpen(true)}
        onCustomizeSidebar={() => handleFocusOrOpenApp('customizer')}
        onToggleMediaPlay={() => setIsPlaying((v) => !v)}
        onSkipTrack={(dir) =>
          setTrackIndex((idx) => (idx + dir + TRACKS.length) % TRACKS.length)
        }
        onDismissNotification={(id) =>
          setNotifications((prev) => prev.filter((n) => n.id !== id))
        }
        onClearNotifications={() => setNotifications([])}
        onLock={() => {
          setSidebarOpen(false);
          setLocked(true);
        }}
        onReloadShell={() =>
          triggerOsd(`Nyx (${config.nyxConfigFormat}) + Myx reloaded`)
        }
      />

      {/* Overview & Fuzzy Launcher */}
      <OverviewModal
        open={overviewOpen}
        config={config}
        palette={palette}
        activeWorkspace={activeWorkspace}
        workspaceCount={workspaceCount}
        windows={windows}
        bezierPoints={bezier.points}
        onClose={() => setOverviewOpen(false)}
        onSelectWorkspace={setActiveWorkspace}
        onMoveWindowWorkspace={handleMoveWindowWorkspace}
        onFocusOrOpenApp={handleFocusOrOpenApp}
        onSelectWallpaper={handleSelectWallpaper}
        onOpenWallpaperPicker={() => setWallpaperPickerOpen(true)}
        onOpenClipboard={() => setClipboardOpen(true)}
        onOpenKeybinds={() => setCheatsheetOpen(true)}
        onToggleDarkMode={() => handleUpdateConfig({ darkMode: !config.darkMode })}
        onLock={() => setLocked(true)}
        onDownloadZip={handleDownloadZip}
        onRunCommand={handleRunLauncherCommand}
      />

      {/* Alt+Tab Interactive Window Switcher HUD */}
      <WindowSwitcherModal
        open={switcherOpen}
        config={config}
        palette={palette}
        windows={windows}
        focusedWindowId={focusedWindowId}
        bezierPoints={bezier.points}
        onClose={() => setSwitcherOpen(false)}
        onSelectWindow={(win) => handleFocusOrOpenApp(win.id)}
      />

      {/* grim + slurp Region Screenshot Snipper */}
      <ScreenshotOverlay
        open={screenshotOpen}
        config={config}
        palette={palette}
        onClose={() => setScreenshotOpen(false)}
        onCompleteCapture={handleCompleteScreenshot}
      />

      {/* Hyprpicker Screen Color Sampler */}
      <ColorPickerOverlay
        open={colorPickerOpen}
        config={config}
        palette={palette}
        wallpaperSrc={wallpaper.src}
        onClose={() => setColorPickerOpen(false)}
        onCopyHex={(hex) => {
          navigator.clipboard?.writeText(hex).catch(() => {});
          handlePushClipboard(hex, 'hyprpicker');
          triggerOsd(`Copied ${hex} to myx-clip`);
        }}
        onApplySeedHex={(hex) => {
          handleUpdateConfig({ seedColor: hex, useWallpaperSeed: false }, `M3 Seed -> ${hex}`);
        }}
      />

      {/* Wallpaper Picker Modal */}
      <WallpaperPickerModal
        open={wallpaperPickerOpen}
        config={config}
        palette={palette}
        bezierPoints={bezier.points}
        onClose={() => setWallpaperPickerOpen(false)}
        onSelectWallpaper={handleSelectWallpaper}
        onAddCustomWallpaper={handleAddCustomWallpaper}
        onRemoveCustomWallpaper={handleRemoveCustomWallpaper}
        onUpdateConfig={handleUpdateConfig}
      />

      {/* Clipboard Ring Modal */}
      <ClipboardModal
        open={clipboardOpen}
        config={config}
        palette={palette}
        items={clipboardItems}
        bezierPoints={bezier.points}
        onClose={() => setClipboardOpen(false)}
        onCopyItem={handleCopyClipboardItem}
        onAddItem={handleAddClipboardItem}
        onTogglePin={handleTogglePinClip}
        onDeleteItem={handleDeleteClip}
        onClearUnpinned={handleClearUnpinnedClips}
      />

      {/* Keybinds Changer */}
      <CheatsheetModal
        open={cheatsheetOpen}
        config={config}
        palette={palette}
        bezierPoints={bezier.points}
        onClose={() => setCheatsheetOpen(false)}
        onUpdateKeybinds={handleUpdateKeybinds}
      />

      {/* Floating M3 Hardware OSD */}
      <AnimatePresence>
        {osdMessage && (
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 * config.animSpeed, ease: bezier.points }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-xs font-semibold backdrop-blur-xl shadow-xl pointer-events-none"
            style={{
              backgroundColor: palette.primaryContainer,
              color: palette.onPrimaryContainer,
              border: `1px solid ${hexToRgba(palette.outlineVariant, 0.5)}`,
            }}
          >
            {osdMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session Lockscreen */}
      <Lockscreen
        locked={locked}
        config={config}
        palette={palette}
        media={currentMedia}
        bezierPoints={bezier.points}
        onUnlock={() => setLocked(false)}
        onToggleMediaPlay={() => setIsPlaying((v) => !v)}
      />
    </div>
  );
}
