import React, { useEffect, useRef, useState } from 'react';
import {
  Cpu,
  FileCode2,
  Keyboard,
  LayoutGrid,
  NotebookPen,
  Sliders,
  Terminal,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { hexToRgba } from '../lib/m3Engine';
import { getSurfaceStyles } from '../lib/surfaceMaterial';
import { AppWindowId, DesktopWindow, M3Palette, ShellConfig } from '../types/shell';

interface ShellDockProps {
  config: ShellConfig;
  palette: M3Palette;
  windows: DesktopWindow[];
  activeWorkspace: number;
  bezierPoints: [number, number, number, number];
  onFocusOrOpenApp: (id: AppWindowId) => void;
  onToggleOverview: () => void;
  onOpenCheatsheet: () => void;
}

const APP_CATALOG: {
  id: AppWindowId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'customizer', label: 'Myx + Nyx Settings', icon: Sliders },
  { id: 'terminal', label: 'nyx-term (Zsh)', icon: Terminal },
  { id: 'code_export', label: 'Nyx + Myx Source', icon: FileCode2 },
  { id: 'telemetry', label: 'RAM Telemetry', icon: Cpu },
  { id: 'notes', label: 'Scratchpad Notes', icon: NotebookPen },
];

export const ShellDock: React.FC<ShellDockProps> = ({
  config,
  palette,
  windows,
  activeWorkspace,
  bezierPoints,
  onFocusOrOpenApp,
  onToggleOverview,
  onOpenCheatsheet,
}) => {
  const [hovered, setHovered] = useState(false);
  const leaveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (leaveTimerRef.current) window.clearTimeout(leaveTimerRef.current);
    };
  }, []);

  if (!config.showDock) return null;

  const handleMouseEnter = () => {
    if (leaveTimerRef.current) {
      window.clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    setHovered(true);
  };

  const handleMouseLeave = () => {
    if (leaveTimerRef.current) window.clearTimeout(leaveTimerRef.current);
    leaveTimerRef.current = window.setTimeout(() => setHovered(false), 180);
  };

  const isRevealed = !config.dockAutoHide || hovered;
  const isVertical = config.dockPosition === 'left' || config.dockPosition === 'right';
  const surfaceStyles = getSurfaceStyles(
    config.materialType,
    config.transparency,
    palette,
    config.darkMode,
    { elevation: 'bar', blurPasses: config.blurPasses }
  );

  const visibleApps =
    config.dockMode === 'active_only'
      ? APP_CATALOG.filter((app) => windows.some((w) => w.id === app.id && w.isOpen))
      : APP_CATALOG;

  const barExtraOffset =
    config.showBar && !config.barAutoHide && config.barPosition === config.dockPosition
      ? (config.barFloating ? config.barMargin : 0) + config.barHeight + 10
      : 12;

  const positionStyle: React.CSSProperties =
    config.dockPosition === 'bottom'
      ? { bottom: barExtraOffset, left: 0, right: 0 }
      : config.dockPosition === 'top'
        ? { top: barExtraOffset, left: 0, right: 0 }
        : config.dockPosition === 'left'
          ? { left: barExtraOffset, top: 0, bottom: 0 }
          : { right: barExtraOffset, top: 0, bottom: 0 };

  const iconSize = config.dockIconSize;
  const animDuration = 0.24 * config.animSpeed;

  const hiddenOffset =
    config.dockPosition === 'bottom'
      ? { x: 0, y: 96 }
      : config.dockPosition === 'top'
        ? { x: 0, y: -96 }
        : config.dockPosition === 'left'
          ? { x: -96, y: 0 }
          : { x: 96, y: 0 };

  const bridgeSize = isRevealed ? barExtraOffset + 8 : 14;
  const sensorStyle: React.CSSProperties =
    config.dockPosition === 'bottom'
      ? { bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 'min(340px, 72vw)', height: bridgeSize }
      : config.dockPosition === 'top'
        ? { top: 0, left: '50%', transform: 'translateX(-50%)', width: 'min(340px, 72vw)', height: bridgeSize }
        : config.dockPosition === 'left'
          ? { left: 0, top: '50%', transform: 'translateY(-50%)', height: 'min(340px, 72vh)', width: bridgeSize }
          : { right: 0, top: '50%', transform: 'translateY(-50%)', height: 'min(340px, 72vh)', width: bridgeSize };

  return (
    <>
      {config.dockAutoHide && (
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          aria-hidden="true"
          className="fixed z-[38] flex items-center justify-center"
          style={sensorStyle}
        >
          <span
            className="rounded-full transition-opacity duration-200 pointer-events-none"
            style={{
              width: isVertical ? 3 : 56,
              height: isVertical ? 56 : 3,
              backgroundColor: palette.onSurface,
              opacity: isRevealed ? 0 : 0.45,
            }}
          />
        </div>
      )}

      <div
        className="fixed z-[38] flex items-center justify-center pointer-events-none"
        style={positionStyle}
      >
        <motion.nav
          aria-label="Myx Application Dock"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          initial={false}
          animate={
            isRevealed
              ? { x: 0, y: 0, opacity: 1 }
              : { x: hiddenOffset.x, y: hiddenOffset.y, opacity: 0 }
          }
          transition={{ duration: animDuration, ease: bezierPoints }}
          className={`flex items-center gap-1.5 p-2 shadow-lg ${
            isVertical ? 'flex-col' : 'flex-row'
          }`}
          style={{
            borderRadius: Math.max(16, Math.min(28, config.rounding + 6)),
            pointerEvents: isRevealed ? 'auto' : 'none',
            ...surfaceStyles,
          }}
        >
        {config.dockShowLauncher && (
          <>
            <button
              type="button"
              onClick={onToggleOverview}
              title="App Launcher (Alt+Space)"
              style={{
                width: iconSize,
                height: iconSize,
                backgroundColor: palette.primaryContainer,
                color: palette.onPrimaryContainer,
              }}
              className="flex items-center justify-center rounded-2xl transition-transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <div
              className={isVertical ? 'h-px w-6 my-0.5' : 'w-px h-6 mx-0.5'}
              style={{ backgroundColor: hexToRgba(palette.outlineVariant, 0.55) }}
            />
          </>
        )}

        <AnimatePresence initial={false}>
          {visibleApps.length === 0 ? (
            <motion.button
              key="empty-dock-hint"
              type="button"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={onToggleOverview}
              className="px-3 py-1.5 text-xs font-medium rounded-xl cursor-pointer whitespace-nowrap"
              style={{ color: palette.onSurfaceVariant }}
            >
              Open Launcher
            </motion.button>
          ) : (
            visibleApps.map((item) => {
              const Icon = item.icon;
              const win = windows.find((w) => w.id === item.id);
              const isOpen = Boolean(win?.isOpen);
              const isOnCurrentWs =
                isOpen && win?.workspace === activeWorkspace && !win?.isMinimized;

              return (
                <motion.button
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ duration: animDuration, ease: bezierPoints }}
                  type="button"
                  onClick={() => onFocusOrOpenApp(item.id)}
                  title={`${item.label}${
                    win?.isOpen
                      ? ` · WS ${win.workspace}${win.isMinimized ? ' (Minimized)' : ''}`
                      : ' (Launch)'
                  }`}
                  className="relative flex items-center justify-center rounded-2xl transition-transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                  style={{
                    width: iconSize,
                    height: iconSize,
                    backgroundColor: isOnCurrentWs
                      ? palette.primaryContainer
                      : isOpen
                        ? palette.secondaryContainer
                        : hexToRgba(palette.surfaceContainerHighest, 0.55),
                    color: isOnCurrentWs
                      ? palette.onPrimaryContainer
                      : isOpen
                        ? palette.onSecondaryContainer
                        : palette.onSurface,
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {isOpen && (
                    <span
                      className="absolute rounded-full transition-all"
                      style={
                        isVertical
                          ? {
                              left: 3,
                              width: 3,
                              height: isOnCurrentWs ? 14 : 6,
                              backgroundColor: isOnCurrentWs
                                ? palette.primary
                                : palette.onSurfaceVariant,
                            }
                          : {
                              bottom: 3,
                              width: isOnCurrentWs ? 14 : 6,
                              height: 3,
                              backgroundColor: isOnCurrentWs
                                ? palette.primary
                                : palette.onSurfaceVariant,
                            }
                      }
                    />
                  )}
                </motion.button>
              );
            })
          )}
        </AnimatePresence>

        {config.dockShowCheatsheet && (
          <>
            <div
              className={isVertical ? 'h-px w-6 my-0.5' : 'w-px h-6 mx-0.5'}
              style={{ backgroundColor: hexToRgba(palette.outlineVariant, 0.55) }}
            />
            <button
              type="button"
              onClick={onOpenCheatsheet}
              title="Keybinds Cheatsheet (Alt+/)"
              style={{
                width: iconSize,
                height: iconSize,
                backgroundColor: hexToRgba(palette.surfaceContainerHighest, 0.55),
                color: palette.onSurfaceVariant,
              }}
              className="flex items-center justify-center rounded-2xl transition-transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
            >
              <Keyboard className="w-4 h-4" />
            </button>
          </>
        )}
        </motion.nav>
      </div>
    </>
  );
};
