import React, { useEffect, useState } from 'react';
import {
  Cpu,
  FileCode2,
  FolderKanban,
  Inbox,
  Layers,
  NotebookPen,
  Pin,
  Sliders,
  Terminal,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { hexToRgba } from '../lib/m3Engine';
import { getSurfaceStyles } from '../lib/surfaceMaterial';
import { AppWindowId, DesktopWindow, M3Palette, ShellConfig } from '../types/shell';

interface WindowSwitcherModalProps {
  open: boolean;
  config: ShellConfig;
  palette: M3Palette;
  windows: DesktopWindow[];
  focusedWindowId: AppWindowId | null;
  bezierPoints: [number, number, number, number];
  onClose: () => void;
  onSelectWindow: (win: DesktopWindow) => void;
}

const APP_ICONS: Record<AppWindowId, React.ComponentType<{ className?: string }>> = {
  customizer: Sliders,
  terminal: Terminal,
  code_export: FileCode2,
  telemetry: Cpu,
  notes: NotebookPen,
};

export const WindowSwitcherModal: React.FC<WindowSwitcherModalProps> = ({
  open,
  config,
  palette,
  windows,
  focusedWindowId,
  bezierPoints,
  onClose,
  onSelectWindow,
}) => {
  const openWindows = windows
    .filter((w) => w.isOpen)
    .sort((a, b) => b.zOrder - a.zOrder);

  const [selectedIdx, setSelectedIdx] = useState(0);

  useEffect(() => {
    if (!open) return;
    const focusedPos = openWindows.findIndex((w) => w.id === focusedWindowId);
    if (openWindows.length > 1) {
      setSelectedIdx(focusedPos >= 0 ? (focusedPos + 1) % openWindows.length : 0);
    } else {
      setSelectedIdx(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'Enter' && openWindows[selectedIdx]) {
        e.preventDefault();
        onSelectWindow(openWindows[selectedIdx]);
        onClose();
        return;
      }
      if (e.key === 'ArrowRight' || (e.key === 'Tab' && !e.shiftKey)) {
        e.preventDefault();
        if (openWindows.length > 0) {
          setSelectedIdx((i) => (i + 1) % openWindows.length);
        }
      } else if (e.key === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey)) {
        e.preventDefault();
        if (openWindows.length > 0) {
          setSelectedIdx((i) => (i - 1 + openWindows.length) % openWindows.length);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [open, openWindows, selectedIdx, onSelectWindow, onClose]);

  const surfaceStyles = getSurfaceStyles(
    config.materialType,
    config.transparency,
    palette,
    config.darkMode,
    { elevation: 'overlay', blurPasses: config.blurPasses }
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 * config.animSpeed }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.93, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 8 }}
            transition={{ duration: 0.22 * config.animSpeed, ease: bezierPoints }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl p-4 flex flex-col gap-3 shadow-2xl"
            style={{
              borderRadius: Math.max(20, config.rounding + 6),
              color: palette.onSurface,
              ...surfaceStyles,
            }}
          >
            <div className="flex items-center justify-between px-1">
              <div className="text-xs font-display font-semibold">
                Nyx Window Switcher
              </div>
              <div className="text-[11px] font-mono-code" style={{ color: palette.onSurfaceVariant }}>
                Tab / ← → to cycle · Enter to focus · Esc to close
              </div>
            </div>

            {openWindows.length === 0 ? (
              <div className="py-10 text-center text-xs" style={{ color: palette.onSurfaceVariant }}>
                No open windows across workspaces.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                {openWindows.map((win, idx) => {
                  const Icon = APP_ICONS[win.id] ?? Terminal;
                  const isSelected = idx === selectedIdx;
                  return (
                    <button
                      key={win.id}
                      type="button"
                      onMouseEnter={() => setSelectedIdx(idx)}
                      onClick={() => {
                        onSelectWindow(win);
                        onClose();
                      }}
                      className="flex flex-col justify-between gap-2.5 p-3 text-left transition-all cursor-pointer"
                      style={{
                        borderRadius: Math.max(14, config.rounding),
                        backgroundColor: isSelected
                          ? palette.primaryContainer
                          : hexToRgba(palette.surfaceContainerHigh, 0.7),
                        color: isSelected ? palette.onPrimaryContainer : palette.onSurface,
                        border: isSelected
                          ? `2px solid ${palette.primary}`
                          : `1px solid ${hexToRgba(palette.outlineVariant, 0.35)}`,
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: isSelected
                              ? palette.primary
                              : hexToRgba(palette.surfaceContainerHighest, 0.9),
                            color: isSelected ? palette.onPrimary : palette.primary,
                          }}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span
                          className="text-[10px] font-mono-code px-1.5 py-0.5 rounded-md tabular-nums"
                          style={{
                            backgroundColor: isSelected
                              ? hexToRgba(palette.primary, 0.16)
                              : palette.surfaceContainerHighest,
                          }}
                        >
                          {win.isSpecial ? 'magic' : `WS ${win.workspace}`}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate">{win.title}</div>
                        <div className="text-[10px] font-mono-code opacity-75 truncate mt-0.5">
                          {win.appClass}
                          {win.isMinimized ? ' · min' : ''}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 opacity-80 h-3.5">
                        {win.isFloating && (
                          <span title="Floating">
                            <Layers className="w-3 h-3" />
                          </span>
                        )}
                        {win.isPinned && (
                          <span title="Pinned">
                            <Pin className="w-3 h-3" />
                          </span>
                        )}
                        {win.isGrouped && (
                          <span title="Grouped Tab">
                            <FolderKanban className="w-3 h-3" />
                          </span>
                        )}
                        {win.isSpecial && (
                          <span title="Special Scratchpad">
                            <Inbox className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
