import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calculator,
  Clipboard,
  Cpu,
  Download,
  FileCode2,
  Image as ImageIcon,
  Keyboard,
  Lock,
  Moon,
  NotebookPen,
  Search,
  Sliders,
  Sun,
  Terminal,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { hexToRgba, WALLPAPERS } from '../lib/m3Engine';
import { getSurfaceStyles } from '../lib/surfaceMaterial';
import { AppWindowId, DesktopWindow, M3Palette, ShellConfig } from '../types/shell';

interface OverviewModalProps {
  open: boolean;
  config: ShellConfig;
  palette: M3Palette;
  activeWorkspace: number;
  workspaceCount: number;
  windows: DesktopWindow[];
  bezierPoints: [number, number, number, number];
  onClose: () => void;
  onSelectWorkspace: (ws: number) => void;
  onMoveWindowWorkspace: (id: AppWindowId, ws: number) => void;
  onFocusOrOpenApp: (id: AppWindowId) => void;
  onSelectWallpaper: (id: string) => void;
  onOpenWallpaperPicker: () => void;
  onOpenClipboard: () => void;
  onOpenKeybinds: () => void;
  onToggleDarkMode: () => void;
  onLock: () => void;
  onDownloadZip: () => void;
  onRunCommand?: (cmd: string) => void;
}

export const OverviewModal: React.FC<OverviewModalProps> = ({
  open,
  config,
  palette,
  activeWorkspace,
  workspaceCount,
  windows,
  bezierPoints,
  onClose,
  onSelectWorkspace,
  onMoveWindowWorkspace,
  onFocusOrOpenApp,
  onSelectWallpaper,
  onOpenWallpaperPicker,
  onOpenClipboard,
  onOpenKeybinds,
  onToggleDarkMode,
  onLock,
  onDownloadZip,
  onRunCommand,
}) => {
  const [query, setQuery] = useState('');
  const [dragOverWs, setDragOverWs] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      const timer = window.setTimeout(() => inputRef.current?.focus(), 60);
      return () => window.clearTimeout(timer);
    }
  }, [open]);

  const mathResult = useMemo(() => {
    if (!config.launcherShowCalculator) return null;
    const trimmed = query.trim();
    const expr = trimmed.startsWith('=') ? trimmed.slice(1).trim() : trimmed;
    if (!expr || !/^[0-9+\-*/().\s]+$/.test(expr)) return null;
    if (!/[+\-*/]/.test(expr)) return null;
    try {
      const val = Function(`"use strict"; return (${expr});`)();
      if (typeof val === 'number' && Number.isFinite(val)) {
        return Number.isInteger(val) ? String(val) : val.toFixed(4).replace(/\.?0+$/, '');
      }
      return null;
    } catch {
      return null;
    }
  }, [query, config.launcherShowCalculator]);

  const entries = useMemo(() => {
    const allWallpapers = [...WALLPAPERS, ...config.customWallpapers];
    const base = [
      {
        id: 'app-customizer',
        title: 'Myx + Nyx Settings',
        subtitle: 'Configure Nyx engine, sidebar, glass, bar, dock & keybinds',
        category: 'Application',
        icon: Sliders,
        action: () => {
          onFocusOrOpenApp('customizer');
          onClose();
        },
      },
      {
        id: 'app-terminal',
        title: 'nyx-term (Zsh)',
        subtitle: 'Custom Rust Wayland Zsh terminal with live Nyx & Mixi IPC',
        category: 'Application',
        icon: Terminal,
        action: () => {
          onFocusOrOpenApp('terminal');
          onClose();
        },
      },
      {
        id: 'util-wallpaper',
        title: 'Wallpaper Picker',
        subtitle: 'Browse wallpapers or upload custom image with M3 extraction',
        category: 'Utility',
        icon: ImageIcon,
        action: () => {
          onClose();
          onOpenWallpaperPicker();
        },
      },
      {
        id: 'util-clipboard',
        title: 'Clipboard History (myx-clip)',
        subtitle: 'Search, pin, and copy snippets from clipboard ring',
        category: 'Utility',
        icon: Clipboard,
        action: () => {
          onClose();
          onOpenClipboard();
        },
      },
      {
        id: 'util-keybinds',
        title: 'Keybind Changer',
        subtitle: 'Remap shell, window & utility keyboard shortcuts live',
        category: 'Utility',
        icon: Keyboard,
        action: () => {
          onClose();
          onOpenKeybinds();
        },
      },
      {
        id: 'app-notes',
        title: 'Scratchpad Notes',
        subtitle: 'Persistent Material 3 markdown scratchpad',
        category: 'Application',
        icon: NotebookPen,
        action: () => {
          onFocusOrOpenApp('notes');
          onClose();
        },
      },
      {
        id: 'app-code',
        title: 'Nyx + Myx Rust Source',
        subtitle: 'Browse Smithay crates, nyx.conf, init.lua & export ZIP',
        category: 'Application',
        icon: FileCode2,
        action: () => {
          onFocusOrOpenApp('code_export');
          onClose();
        },
      },
      {
        id: 'app-telemetry',
        title: 'RAM & Daemon Telemetry',
        subtitle: 'Inspect Nyx compositor & Myx shell memory footprint',
        category: 'Application',
        icon: Cpu,
        action: () => {
          onFocusOrOpenApp('telemetry');
          onClose();
        },
      },
      {
        id: 'act-theme',
        title: config.darkMode ? 'Switch to Light M3 Mode' : 'Switch to Dark M3 Mode',
        subtitle: 'Regenerate Material 3 tonal tokens immediately',
        category: 'Shell Action',
        icon: config.darkMode ? Sun : Moon,
        action: () => {
          onToggleDarkMode();
          onClose();
        },
      },
      {
        id: 'act-zip',
        title: 'Export Nyx + Myx Dotfiles (.zip)',
        subtitle: 'Download complete Cargo workspace + ~/.config/nyx + ~/.config/myx',
        category: 'Shell Action',
        icon: Download,
        action: () => {
          onDownloadZip();
          onClose();
        },
      },
      {
        id: 'act-lock',
        title: 'Lock Session',
        subtitle: 'Activate ext-session-lock screen',
        category: 'System',
        icon: Lock,
        action: () => {
          onClose();
          onLock();
        },
      },
      ...(config.launcherShowWallpapers
        ? allWallpapers.map((wp) => ({
            id: `wp-${wp.id}`,
            title: `Wallpaper: ${wp.name}`,
            subtitle: `${wp.subtitle} · Seed ${wp.seedColor}`,
            category: 'Theme',
            icon: ImageIcon,
            action: () => {
              onSelectWallpaper(wp.id);
              onClose();
            },
          }))
        : []),
    ];

    const trimmed = query.trim();
    const q = trimmed.toLowerCase();
    if (trimmed.startsWith('>') && trimmed.length > 1) {
      const shellCmd = trimmed.slice(1).trim();
      return [
        {
          id: 'run-shell-cmd',
          title: `Run: ${shellCmd}`,
          subtitle: 'Execute directly in Nyx + Myx IPC or open in nyx-term',
          category: 'Shell Exec',
          icon: Terminal,
          action: () => {
            onRunCommand?.(shellCmd);
            onClose();
          },
        },
        ...base.slice(0, 4),
      ];
    }
    if (!q) return config.launcherCompact ? base.slice(0, 6) : base.slice(0, 9);
    return base.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.subtitle.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
    );
  }, [
    query,
    config.darkMode,
    config.customWallpapers,
    config.launcherShowWallpapers,
    config.launcherCompact,
    onFocusOrOpenApp,
    onClose,
    onOpenWallpaperPicker,
    onOpenClipboard,
    onOpenKeybinds,
    onToggleDarkMode,
    onDownloadZip,
    onLock,
    onSelectWallpaper,
    onRunCommand,
  ]);

  const durationSec = 0.28 * config.animSpeed;
  const surfaceStyles = getSurfaceStyles(
    config.materialType,
    config.transparency,
    palette,
    config.darkMode,
    { elevation: 'overlay', blurPasses: config.blurPasses }
  );

  const alignClass =
    config.launcherPosition === 'top'
      ? 'justify-start pt-14'
      : config.launcherPosition === 'bottom'
        ? 'justify-end pb-14'
        : 'justify-center';

  const initialY = config.launcherPosition === 'bottom' ? 24 : -18;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: durationSec * 0.8 }}
          onClick={onClose}
          className={`fixed inset-0 z-50 flex flex-col items-center px-4 backdrop-blur-md bg-black/40 ${alignClass}`}
        >
          <motion.div
            initial={{ y: initialY, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: initialY * 0.7, scale: 0.97, opacity: 0 }}
            transition={{ duration: durationSec, ease: bezierPoints }}
            onClick={(e) => e.stopPropagation()}
            className={`w-full flex flex-col gap-3.5 ${
              config.launcherCompact ? 'max-w-xl' : 'max-w-3xl'
            }`}
          >
            {config.launcherShowWorkspaces && (
              <div
                className="grid gap-2 p-2.5 overflow-x-auto"
                style={{
                  gridTemplateColumns: `repeat(${Math.min(8, workspaceCount + (config.nyxInfiniteWorkspaces ? 1 : 0))}, minmax(105px, 1fr))`,
                  borderRadius: Math.max(16, config.rounding + 4),
                  ...surfaceStyles,
                }}
              >
                {Array.from({ length: workspaceCount }, (_, idx) => idx + 1).map((ws) => {
                  const wsWindows = windows.filter((w) => w.isOpen && w.workspace === ws);
                  const isActive = ws === activeWorkspace;
                  const isDropTarget = dragOverWs === ws;
                  return (
                    <div
                      key={ws}
                      role="button"
                      tabIndex={0}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverWs(ws);
                      }}
                      onDragLeave={() => setDragOverWs((curr) => (curr === ws ? null : curr))}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOverWs(null);
                        const winId = e.dataTransfer.getData('text/myx-win') as AppWindowId;
                        if (winId) onMoveWindowWorkspace(winId, ws);
                      }}
                      onClick={() => {
                        onSelectWorkspace(ws);
                        onClose();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onSelectWorkspace(ws);
                          onClose();
                        }
                      }}
                      className="flex flex-col justify-between p-2.5 h-20 text-left transition-all cursor-pointer"
                      style={{
                        backgroundColor: isDropTarget
                          ? palette.secondaryContainer
                          : isActive
                            ? palette.primaryContainer
                            : hexToRgba(palette.surfaceContainerHigh, 0.72),
                        color: isActive ? palette.onPrimaryContainer : palette.onSurface,
                        borderRadius: Math.max(10, config.rounding - 2),
                        border: isDropTarget
                          ? `2px dashed ${palette.primary}`
                          : isActive
                            ? `1.5px solid ${palette.primary}`
                            : `1px solid ${hexToRgba(palette.outlineVariant, 0.35)}`,
                      }}
                    >
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="font-mono-code tabular-nums">WS {ws}</span>
                        <span className="text-[11px] opacity-75 tabular-nums">
                          {wsWindows.length}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 overflow-hidden">
                        {wsWindows.map((w) => (
                          <span
                            key={w.id}
                            draggable
                            onClick={(e) => {
                              e.stopPropagation();
                              onFocusOrOpenApp(w.id);
                              onClose();
                            }}
                            onDragStart={(e) => {
                              e.stopPropagation();
                              e.dataTransfer.setData('text/myx-win', w.id);
                            }}
                            title="Drag chip to another workspace, or click to focus"
                            className="text-[10px] truncate max-w-full px-1.5 py-0.5 rounded cursor-grab active:cursor-grabbing hover:opacity-85"
                            style={{
                              backgroundColor: isActive
                                ? hexToRgba(palette.primary, 0.18)
                                : palette.surfaceContainerHighest,
                            }}
                          >
                            {w.appClass}
                          </span>
                        ))}
                        {wsWindows.length === 0 && (
                          <span className="text-[11px] opacity-50">Drop here</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {config.nyxInfiniteWorkspaces && (
                  <button
                    type="button"
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverWs(workspaceCount + 1);
                    }}
                    onDragLeave={() => setDragOverWs(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverWs(null);
                      const winId = e.dataTransfer.getData('text/myx-win') as AppWindowId;
                      if (winId) onMoveWindowWorkspace(winId, workspaceCount + 1);
                    }}
                    onClick={() => {
                      onSelectWorkspace(workspaceCount + 1);
                      onClose();
                    }}
                    className="flex flex-col items-center justify-center p-2.5 h-20 text-xs font-semibold transition-all cursor-pointer"
                    style={{
                      backgroundColor:
                        dragOverWs === workspaceCount + 1
                          ? palette.primaryContainer
                          : hexToRgba(palette.surfaceContainerHigh, 0.45),
                      color: palette.primary,
                      borderRadius: Math.max(10, config.rounding - 2),
                      border: `1.5px dashed ${hexToRgba(palette.primary, 0.45)}`,
                    }}
                  >
                    + New WS {workspaceCount + 1}
                  </button>
                )}
              </div>
            )}

            <div
              className="overflow-hidden"
              style={{
                borderRadius: Math.max(18, config.rounding + 6),
                color: palette.onSurface,
                ...surfaceStyles,
              }}
            >
              <div
                className="flex items-center gap-3 px-4 py-3.5 border-b"
                style={{ borderColor: hexToRgba(palette.outlineVariant, 0.45) }}
              >
                <Search className="w-4 h-4 shrink-0" style={{ color: palette.primary }} />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && entries.length > 0) {
                      entries[0].action();
                    } else if (e.key === 'Escape') {
                      onClose();
                    }
                  }}
                  placeholder="Search apps, wallpapers, clipboard, keybinds, or calculate..."
                  className="w-full bg-transparent text-sm outline-none placeholder:opacity-55"
                />
                <span
                  className="text-[11px] font-mono-code shrink-0"
                  style={{ color: palette.onSurfaceVariant }}
                >
                  ESC
                </span>
              </div>

              {mathResult && (
                <div
                  className="flex items-center justify-between px-4 py-3 border-b"
                  style={{
                    backgroundColor: palette.secondaryContainer,
                    color: palette.onSecondaryContainer,
                    borderColor: hexToRgba(palette.outlineVariant, 0.35),
                  }}
                >
                  <div className="flex items-center gap-2.5 text-sm">
                    <Calculator className="w-4 h-4" />
                    <span className="font-medium">Inline Evaluator</span>
                  </div>
                  <span className="text-base font-mono-code font-semibold tabular-nums">
                    = {mathResult}
                  </span>
                </div>
              )}

              <div className="max-h-72 overflow-y-auto p-2 flex flex-col gap-1">
                {entries.length === 0 ? (
                  <div className="py-8 text-center text-xs" style={{ color: palette.onSurfaceVariant }}>
                    No matching applications or shell commands.
                  </div>
                ) : (
                  entries.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={item.action}
                        className={`flex items-center justify-between gap-3 px-3 rounded-xl text-left transition-colors cursor-pointer ${
                          config.launcherCompact ? 'py-2' : 'py-2.5'
                        }`}
                        style={{
                          backgroundColor:
                            idx === 0 ? hexToRgba(palette.primaryContainer, 0.65) : 'transparent',
                        }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
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
                            <div className="text-sm font-medium truncate">{item.title}</div>
                            {!config.launcherCompact && (
                              <div
                                className="text-xs truncate"
                                style={{ color: palette.onSurfaceVariant }}
                              >
                                {item.subtitle}
                              </div>
                            )}
                          </div>
                        </div>
                        <span
                          className="text-[11px] shrink-0"
                          style={{ color: palette.onSurfaceVariant }}
                        >
                          {item.category}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
