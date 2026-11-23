import React, { useEffect, useRef, useState } from 'react';
import {
  BatteryCharging,
  Bell,
  BellOff,
  Bluetooth,
  Clipboard,
  Gamepad2,
  Lock,
  MessageSquare,
  Pause,
  Play,
  Search,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Video,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { hexToRgba } from '../lib/m3Engine';
import { getSurfaceStyles } from '../lib/surfaceMaterial';
import {
  DesktopWindow,
  M3Palette,
  MediaTrack,
  ShellConfig,
} from '../types/shell';

interface ShellBarProps {
  config: ShellConfig;
  palette: M3Palette;
  activeWorkspace: number;
  workspaceCount: number;
  windows: DesktopWindow[];
  focusedWindowId: string | null;
  media: MediaTrack;
  ramMb: number;
  notificationsCount: number;
  isRecording: boolean;
  sidebarOpen: boolean;
  overviewOpen: boolean;
  bezierCss: string;
  onSelectWorkspace: (ws: number) => void;
  onToggleOverview: () => void;
  onToggleSidebar: () => void;
  onToggleDnd: () => void;
  onToggleRecording: () => void;
  onOpenClipboard: () => void;
  onNotifyTrayApp: (appName: string) => void;
  onToggleMediaPlay: () => void;
  onSkipTrack: (dir: 1 | -1) => void;
  onLock: () => void;
  onOpenTelemetry: () => void;
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

export const ShellBar: React.FC<ShellBarProps> = ({
  config,
  palette,
  activeWorkspace,
  workspaceCount,
  windows,
  focusedWindowId,
  media,
  ramMb,
  notificationsCount,
  isRecording,
  sidebarOpen,
  overviewOpen,
  bezierCss,
  onSelectWorkspace,
  onToggleOverview,
  onToggleSidebar,
  onToggleDnd,
  onToggleRecording,
  onOpenClipboard,
  onNotifyTrayApp,
  onToggleMediaPlay,
  onSkipTrack,
  onLock,
  onOpenTelemetry,
}) => {
  const [now, setNow] = useState(() => new Date());
  const [mediaExpanded, setMediaExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const leaveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    return () => {
      if (leaveTimerRef.current) window.clearTimeout(leaveTimerRef.current);
    };
  }, []);

  if (!config.showBar) return null;

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

  const isRevealed = !config.barAutoHide || hovered || sidebarOpen || overviewOpen || mediaExpanded;

  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateStr = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  const focusedWindow =
    windows.find((w) => w.id === focusedWindowId && w.isOpen && w.workspace === activeWorkspace) ??
    windows.find((w) => w.isOpen && w.workspace === activeWorkspace);

  const isVertical = config.barPosition === 'left' || config.barPosition === 'right';
  const animMs = Math.round(280 * config.animSpeed);
  const surfaceStyles = getSurfaceStyles(
    config.materialType,
    config.transparency,
    palette,
    config.darkMode,
    { elevation: 'bar', blurPasses: config.blurPasses }
  );
  const islandBg = hexToRgba(palette.surfaceContainerHigh, Math.max(0.32, 0.72 - config.transparency / 200));

  const workspaces = Array.from({ length: workspaceCount }, (_, idx) => idx + 1);
  const margin = config.barFloating ? config.barMargin : 0;

  const renderAutoHideSensor = () => {
    if (!config.barAutoHide) return null;
    const bridgeThickness = isRevealed ? margin + 8 : 12;
    const pos = config.barPosition;
    const sensorStyle: React.CSSProperties =
      pos === 'top'
        ? { top: 0, left: 0, right: 0, height: bridgeThickness }
        : pos === 'bottom'
          ? { bottom: 0, left: 0, right: 0, height: bridgeThickness }
          : pos === 'left'
            ? { left: 0, top: 0, bottom: 0, width: bridgeThickness }
            : { right: 0, top: 0, bottom: 0, width: bridgeThickness };

    return (
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-hidden="true"
        className="fixed z-[39] flex items-center justify-center"
        style={sensorStyle}
      >
        <span
          className="rounded-full transition-opacity duration-200 pointer-events-none"
          style={{
            width: isVertical ? 3 : 64,
            height: isVertical ? 64 : 3,
            backgroundColor: palette.onSurface,
            opacity: isRevealed ? 0 : 0.42,
          }}
        />
      </div>
    );
  };

  if (isVertical) {
    const isRight = config.barPosition === 'right';
    return (
      <>
        {renderAutoHideSensor()}
        <aside
          aria-label="ImpulseShell Vertical Rail"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="fixed z-[39] flex flex-col items-center justify-between py-3 px-2 select-none"
          style={{
            top: margin,
            bottom: margin,
            left: isRight ? undefined : margin,
            right: isRight ? margin : undefined,
            width: Math.max(54, Math.min(72, config.barHeight + 14)),
            borderRadius: config.barFloating ? Math.min(28, config.rounding + 4) : 0,
            color: palette.onSurface,
            transform: isRevealed
              ? 'translateX(0)'
              : isRight
                ? 'translateX(calc(100% + 28px))'
                : 'translateX(calc(-100% - 28px))',
            opacity: isRevealed ? 1 : 0,
            pointerEvents: isRevealed ? 'auto' : 'none',
            transition: `all ${animMs}ms ${bezierCss}`,
            ...surfaceStyles,
          }}
        >
        {/* Top Launcher + RAM */}
        <div className="flex flex-col items-center gap-2">
          {config.barShowLauncher && (
            <button
              type="button"
              onClick={onToggleOverview}
              title="Overview & Launcher (Alt+Space)"
              className="w-10 h-10 flex items-center justify-center rounded-2xl transition-transform active:scale-95 cursor-pointer"
              style={{
                backgroundColor: overviewOpen ? palette.primary : palette.primaryContainer,
                color: overviewOpen ? palette.onPrimary : palette.onPrimaryContainer,
              }}
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          {config.barShowRam && (
            <button
              type="button"
              onClick={onOpenTelemetry}
              title="Rust Daemon RAM Footprint"
              className="text-[11px] font-mono-code tabular-nums px-1.5 py-1 rounded-lg hover:opacity-85 transition-opacity cursor-pointer"
              style={{ color: palette.onSurfaceVariant }}
            >
              {ramMb.toFixed(0)}M
            </button>
          )}
        </div>

        {/* Vertical Workspaces */}
        {config.barShowWorkspaces && (
          <nav aria-label="Hyprland Workspaces" className="flex flex-col items-center gap-1.5 py-2">
            {workspaces.map((ws) => {
              const isActive = ws === activeWorkspace;
              const hasWindows = windows.some((w) => w.isOpen && w.workspace === ws);
              return (
                <button
                  key={ws}
                  type="button"
                  onClick={() => onSelectWorkspace(ws)}
                  aria-label={`Workspace ${ws}`}
                  aria-current={isActive ? 'page' : undefined}
                  className="relative flex items-center justify-center rounded-full transition-all cursor-pointer"
                  style={{
                    width: 34,
                    height: isActive ? 42 : 28,
                    backgroundColor: isActive
                      ? palette.primary
                      : hasWindows
                        ? palette.surfaceContainerHighest
                        : 'transparent',
                    color: isActive
                      ? palette.onPrimary
                      : hasWindows
                        ? palette.onSurface
                        : palette.onSurfaceVariant,
                    transition: `all ${animMs}ms ${bezierCss}`,
                  }}
                >
                  {config.workspaceStyle === 'dots' ? (
                    <span
                      className="rounded-full"
                      style={{
                        width: isActive ? 8 : 6,
                        height: isActive ? 18 : 6,
                        backgroundColor: isActive ? palette.onPrimary : palette.onSurfaceVariant,
                      }}
                    />
                  ) : (
                    <span className="text-xs font-semibold tabular-nums">
                      {config.workspaceStyle === 'roman' ? (ROMAN[ws - 1] ?? ws) : ws}
                    </span>
                  )}
                </button>
              );
            })}
            {config.nyxInfiniteWorkspaces && (
              <button
                type="button"
                onClick={() => onSelectWorkspace(workspaceCount + 1)}
                title="New Dynamic Workspace"
                aria-label="New Workspace"
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold hover:opacity-80 cursor-pointer"
                style={{ color: palette.primary }}
              >
                +
              </button>
            )}
          </nav>
        )}

        {/* Bottom Controls */}
        <div className="flex flex-col items-center gap-2">
          {config.showMediaCapsule && (
            <button
              type="button"
              onClick={onToggleMediaPlay}
              title={`${media.title} — ${media.artist}`}
              className="w-10 h-10 flex items-center justify-center rounded-2xl transition-transform active:scale-95 cursor-pointer"
              style={{
                backgroundColor: media.isPlaying ? palette.secondaryContainer : islandBg,
                color: media.isPlaying ? palette.onSecondaryContainer : palette.onSurfaceVariant,
              }}
            >
              {media.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          )}

          {config.barShowClock && (
            <div
              className="flex flex-col items-center text-[11px] font-mono-code tabular-nums leading-tight py-1"
              style={{ color: palette.onSurface }}
            >
              <span>{timeStr.split(':')[0]}</span>
              <span style={{ color: palette.primary }}>{timeStr.split(':')[1]}</span>
            </div>
          )}

          {config.barShowSysTray && (
            <>
              <button
                type="button"
                onClick={onToggleDnd}
                title={config.dndEnabled ? 'Do Not Disturb (On)' : `Notifications (${notificationsCount})`}
                className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors cursor-pointer relative"
                style={{
                  backgroundColor: config.dndEnabled ? palette.secondaryContainer : islandBg,
                  color: config.dndEnabled ? palette.onSecondaryContainer : palette.onSurface,
                }}
              >
                {config.dndEnabled ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                {!config.dndEnabled && notificationsCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-mono-code font-bold flex items-center justify-center"
                    style={{ backgroundColor: palette.primary, color: palette.onPrimary }}
                  >
                    {notificationsCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={onToggleSidebar}
                title="Quick Settings & Notifications (Alt+A)"
                className="w-10 h-10 flex items-center justify-center rounded-2xl transition-colors cursor-pointer"
                style={{
                  backgroundColor: sidebarOpen ? palette.primary : islandBg,
                  color: sidebarOpen ? palette.onPrimary : palette.onSurface,
                }}
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </>
          )}

          {config.barShowLock && (
            <button
              type="button"
              onClick={onLock}
              title="Lock Session (Alt+L)"
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:opacity-80 transition-opacity cursor-pointer"
              style={{ color: palette.onSurfaceVariant }}
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        </aside>
      </>
    );
  }

  const isBottom = config.barPosition === 'bottom';

  return (
    <>
      {renderAutoHideSensor()}
      <header
        aria-label="ImpulseShell Status Bar"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="fixed z-[39] flex items-center justify-between gap-4 select-none px-3"
        style={{
          top: isBottom ? undefined : margin,
          bottom: isBottom ? margin : undefined,
          left: margin,
          right: margin,
          height: config.barHeight,
          borderRadius: config.barFloating ? Math.min(24, config.rounding + 4) : 0,
          color: palette.onSurface,
          transform: isRevealed
            ? 'translateY(0)'
            : isBottom
              ? 'translateY(calc(100% + 28px))'
              : 'translateY(calc(-100% - 28px))',
          opacity: isRevealed ? 1 : 0,
          pointerEvents: isRevealed ? 'auto' : 'none',
          transition: `all ${animMs}ms ${bezierCss}`,
          ...surfaceStyles,
        }}
      >
      {/* Left Zone: Launcher + Workspace Strip + Active App */}
      <div className="flex items-center gap-2 min-w-0">
        {config.barShowLauncher && (
          <button
            type="button"
            onClick={onToggleOverview}
            title="Overview & Launcher (Alt+Space)"
            className="h-8 px-2.5 flex items-center gap-2 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-transform active:scale-95 cursor-pointer"
            style={{
              backgroundColor: overviewOpen ? palette.primary : palette.primaryContainer,
              color: overviewOpen ? palette.onPrimary : palette.onPrimaryContainer,
            }}
          >
            <Search className="w-3.5 h-3.5" />
            <span className="font-display font-semibold tracking-tight">Launcher</span>
          </button>
        )}

        {config.barShowWorkspaces && (
          <nav
            aria-label="Hyprland Workspaces"
            className="flex items-center gap-1 p-1 rounded-full shrink-0"
            style={{ backgroundColor: islandBg }}
          >
            {workspaces.map((ws) => {
              const isActive = ws === activeWorkspace;
              const hasWindows = windows.some((w) => w.isOpen && w.workspace === ws);
              return (
                <button
                  key={ws}
                  type="button"
                  onClick={() => onSelectWorkspace(ws)}
                  aria-label={`Workspace ${ws}`}
                  aria-current={isActive ? 'page' : undefined}
                  className="relative h-6 flex items-center justify-center rounded-full text-xs font-semibold tabular-nums transition-all cursor-pointer"
                  style={{
                    width: isActive ? 34 : 26,
                    backgroundColor: isActive ? palette.primary : 'transparent',
                    color: isActive
                      ? palette.onPrimary
                      : hasWindows
                        ? palette.onSurface
                        : palette.onSurfaceVariant,
                    transition: `all ${animMs}ms ${bezierCss}`,
                  }}
                >
                  {config.workspaceStyle === 'dots' ? (
                    <span
                      className="rounded-full"
                      style={{
                        width: isActive ? 16 : 6,
                        height: 6,
                        backgroundColor: isActive
                          ? palette.onPrimary
                          : hasWindows
                            ? palette.primary
                            : palette.onSurfaceVariant,
                      }}
                    />
                  ) : (
                    <span>{config.workspaceStyle === 'roman' ? (ROMAN[ws - 1] ?? ws) : ws}</span>
                  )}
                </button>
              );
            })}
            {config.nyxInfiniteWorkspaces && (
              <button
                type="button"
                onClick={() => onSelectWorkspace(workspaceCount + 1)}
                title="New Dynamic Workspace"
                aria-label="New Workspace"
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold hover:opacity-80 cursor-pointer"
                style={{ color: palette.primary }}
              >
                +
              </button>
            )}
          </nav>
        )}

        {config.barShowWindowTitle && (
          <div className="hidden lg:flex items-center gap-2 pl-2 min-w-0 text-xs">
            <span className="truncate max-w-[190px] font-medium" style={{ color: palette.onSurface }}>
              {focusedWindow ? focusedWindow.title : `Workspace ${activeWorkspace}`}
            </span>
            <span style={{ color: palette.outline }}>·</span>
            <span className="font-mono-code truncate" style={{ color: palette.onSurfaceVariant }}>
              {focusedWindow ? focusedWindow.appClass : 'empty'}
            </span>
          </div>
        )}
      </div>

      {/* Center Zone: Dynamic Media Capsule */}
      {config.showMediaCapsule && (
        <div className="hidden md:flex items-center justify-center">
          <div
            className="flex items-center gap-2.5 px-3 h-8 rounded-full cursor-pointer transition-all"
            style={{
              backgroundColor: islandBg,
              border: `1px solid ${hexToRgba(palette.outlineVariant, 0.35)}`,
              transition: `all ${animMs}ms ${bezierCss}`,
            }}
            onClick={() => setMediaExpanded((v) => !v)}
          >
            <div className="flex items-end gap-0.5 h-3 w-3 shrink-0" aria-hidden="true">
              {[0.6, 1, 0.45].map((h, idx) => (
                <span
                  key={idx}
                  className="w-0.5 rounded-full transition-all duration-300"
                  style={{
                    height: media.isPlaying ? `${Math.round(h * 12)}px` : '4px',
                    backgroundColor: palette.primary,
                  }}
                />
              ))}
            </div>

            <span className="text-xs font-medium truncate max-w-[160px]" style={{ color: palette.onSurface }}>
              {media.title}
            </span>
            <span className="text-xs truncate max-w-[90px]" style={{ color: palette.onSurfaceVariant }}>
              {media.artist}
            </span>

            <AnimatePresence initial={false}>
              {mediaExpanded && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex items-center gap-1 overflow-hidden pl-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => onSkipTrack(-1)}
                    aria-label="Previous track"
                    className="p-1 rounded-full hover:opacity-75 cursor-pointer"
                  >
                    <SkipBack className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={onToggleMediaPlay}
                    aria-label={media.isPlaying ? 'Pause' : 'Play'}
                    className="p-1 rounded-full cursor-pointer"
                    style={{ backgroundColor: palette.primary, color: palette.onPrimary }}
                  >
                    {media.isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => onSkipTrack(1)}
                    aria-label="Next track"
                    className="p-1 rounded-full hover:opacity-75 cursor-pointer"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Right Zone: RAM + Background Tray Applets + System Status & Clock + Bell/DND + Lock */}
      <div className="flex items-center gap-2 shrink-0">
        {config.barShowRam && (
          <button
            type="button"
            onClick={onOpenTelemetry}
            title="Inspect Rust Shell RAM Footprint"
            className="hidden sm:flex items-center gap-1.5 h-8 px-2.5 rounded-full text-xs font-mono-code tabular-nums whitespace-nowrap shrink-0 transition-colors hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: islandBg, color: palette.onSurfaceVariant }}
          >
            <span style={{ color: palette.primary }}>{ramMb.toFixed(1)} MB</span>
            <span>RSS</span>
          </button>
        )}

        {/* SNI Background App Tray Applets */}
        {config.barShowSysTray && (
          <div
            aria-label="System Tray Applets"
            className="hidden md:flex items-center gap-1 h-8 px-2 rounded-full shrink-0"
            style={{ backgroundColor: islandBg, color: palette.onSurfaceVariant }}
          >
            <button
              type="button"
              onClick={() => onNotifyTrayApp('Discord')}
              title="Discord (Connected · Voice Ready)"
              className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onNotifyTrayApp('Steam')}
              title="Steam Client (Background)"
              className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Gamepad2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onToggleRecording}
              title={
                isRecording
                  ? 'wf-recorder · Recording active (click or Shift+Alt+R to stop)'
                  : 'OBS / wf-recorder (click or Shift+Alt+R to record)'
              }
              className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
              style={{
                color: isRecording ? palette.error : palette.onSurfaceVariant,
                backgroundColor: isRecording ? hexToRgba(palette.error, 0.18) : 'transparent',
              }}
            >
              <Video className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onOpenClipboard}
              title="myx-clip Clipboard Ring"
              className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Clipboard className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {(config.barShowSysTray || config.barShowClock) && (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-expanded={sidebarOpen}
            title="Quick Settings & Notifications (Alt+A)"
            className="h-8 px-3 flex items-center gap-2.5 rounded-full text-xs whitespace-nowrap shrink-0 transition-all cursor-pointer"
            style={{
              backgroundColor: sidebarOpen ? palette.primary : islandBg,
              color: sidebarOpen ? palette.onPrimary : palette.onSurface,
            }}
          >
            {config.barShowSysTray && (
              <>
                {config.wifiEnabled ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                {config.bluetoothEnabled && <Bluetooth className="w-3.5 h-3.5 hidden sm:block" />}
                <span className="flex items-center gap-1 tabular-nums">
                  {config.volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span className="font-mono-code">{config.volume}%</span>
                </span>
                <span className="hidden sm:flex items-center gap-1 tabular-nums">
                  <BatteryCharging className="w-3.5 h-3.5" />
                  <span className="font-mono-code">94%</span>
                </span>
              </>
            )}

            {config.barShowSysTray && config.barShowClock && <span className="opacity-40">|</span>}

            {config.barShowClock && (
              <>
                <span className="font-display font-semibold tabular-nums">{timeStr}</span>
                <span className="hidden xl:inline opacity-75">{dateStr}</span>
              </>
            )}
          </button>
        )}

        {/* Notification Bell & DND Indicator */}
        {config.barShowSysTray && (
          <button
            type="button"
            onClick={onToggleDnd}
            title={
              config.dndEnabled
                ? 'Do Not Disturb ON (click to resume notifications)'
                : `${notificationsCount} notification(s) · Click to enable DND`
            }
            aria-label="Toggle Do Not Disturb"
            className="h-8 px-2.5 flex items-center gap-1.5 rounded-full text-xs transition-colors hover:opacity-85 shrink-0 cursor-pointer"
            style={{
              backgroundColor: config.dndEnabled ? palette.secondaryContainer : islandBg,
              color: config.dndEnabled ? palette.onSecondaryContainer : palette.onSurface,
            }}
          >
            {config.dndEnabled ? (
              <BellOff className="w-3.5 h-3.5" />
            ) : (
              <Bell className="w-3.5 h-3.5" />
            )}
            {!config.dndEnabled && notificationsCount > 0 && (
              <span
                className="text-[11px] font-mono-code font-semibold tabular-nums"
                style={{ color: palette.primary }}
              >
                {notificationsCount}
              </span>
            )}
          </button>
        )}

        {config.barShowLock && (
          <button
            type="button"
            onClick={onLock}
            title="Lock Session (Alt+L)"
            aria-label="Lock session"
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:opacity-85 shrink-0 cursor-pointer"
            style={{ backgroundColor: islandBg, color: palette.onSurface }}
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      </header>
    </>
  );
};
