import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  Columns2,
  FolderKanban,
  Inbox,
  Layers,
  Maximize,
  Maximize2,
  Minimize2,
  Minus,
  Pin,
  Plus,
  SquareDashedBottom,
  Terminal,
  X,
} from 'lucide-react';
import { AnimatePresence, motion, useDragControls } from 'motion/react';
import { hexToRgba } from '../lib/m3Engine';
import { getSurfaceStyles } from '../lib/surfaceMaterial';
import {
  AppWindowId,
  DesktopWindow,
  M3Palette,
  RicePreset,
  ShellConfig,
} from '../types/shell';
import { CodeExportApp } from './apps/CodeExportApp';
import { CustomizerApp } from './apps/CustomizerApp';
import { NotesApp } from './apps/NotesApp';
import { TelemetryApp } from './apps/TelemetryApp';
import { TerminalApp } from './apps/TerminalApp';

interface DesktopStageProps {
  config: ShellConfig;
  palette: M3Palette;
  activeWorkspace: number;
  workspaceCount: number;
  specialOpen: boolean;
  windows: DesktopWindow[];
  focusedWindowId: AppWindowId | null;
  bezierPoints: [number, number, number, number];
  onFocusWindow: (id: AppWindowId) => void;
  onCloseWindow: (id: AppWindowId) => void;
  onMinimizeWindow: (id: AppWindowId) => void;
  onToggleMaximize: (id: AppWindowId) => void;
  onToggleTrueFullscreen: (id: AppWindowId) => void;
  onToggleFloating: (id: AppWindowId) => void;
  onToggleGroupWindow: (id: AppWindowId) => void;
  onTogglePseudoWindow: (id: AppWindowId) => void;
  onTogglePinWindow: (id: AppWindowId) => void;
  onToggleSpecialWindow: (id: AppWindowId) => void;
  onCycleColWidth: (id: AppWindowId) => void;
  onSwapWindow: (id: AppWindowId, dir: -1 | 1) => void;
  onFocusAdjacentWindow: (dir: -1 | 1) => void;
  onMoveWindowWorkspace: (id: AppWindowId, ws: number) => void;
  onSelectWorkspace: (ws: number) => void;
  onCloseSpecialWorkspace: () => void;
  onFocusOrOpenApp: (id: AppWindowId) => void;
  onUpdateConfig: (patch: Partial<ShellConfig>, osdLabel?: string) => void;
  onSelectWallpaper: (id: string) => void;
  onToggleModule: (id: string) => void;
  onApplyPreset: (preset: RicePreset) => void;
  onResetDefaults: () => void;
  onDownloadZip: () => void;
  onDesktopContextMenu: (e: React.MouseEvent) => void;
  onOpenWallpaperPicker: () => void;
  onOpenClipboard: () => void;
  onOpenKeybinds: () => void;
  onOpenColorPicker: () => void;
  onPushClipboard: (text: string, source: string) => void;
}

interface WindowFrameCardProps {
  win: DesktopWindow;
  config: ShellConfig;
  palette: M3Palette;
  isFloatingLayer: boolean;
  isFocused: boolean;
  tiledCount: number;
  maximizedActive: boolean;
  animDuration: number;
  bezierPoints: [number, number, number, number];
  workspaceOptions: number[];
  workspaceCount: number;
  moveMenuWin: AppWindowId | null;
  setMoveMenuWin: React.Dispatch<React.SetStateAction<AppWindowId | null>>;
  colElementMap: React.MutableRefObject<Map<AppWindowId, HTMLElement>>;
  extraStyle?: React.CSSProperties;
  extraClass?: string;
  indexInTiled?: number;
  renderContent: (id: AppWindowId) => React.ReactNode;
  onFocusWindow: (id: AppWindowId) => void;
  onCloseWindow: (id: AppWindowId) => void;
  onMinimizeWindow: (id: AppWindowId) => void;
  onToggleMaximize: (id: AppWindowId) => void;
  onToggleTrueFullscreen: (id: AppWindowId) => void;
  onToggleFloating: (id: AppWindowId) => void;
  onToggleGroupWindow: (id: AppWindowId) => void;
  onTogglePseudoWindow: (id: AppWindowId) => void;
  onTogglePinWindow: (id: AppWindowId) => void;
  onToggleSpecialWindow: (id: AppWindowId) => void;
  onCycleColWidth: (id: AppWindowId) => void;
  onSwapWindow: (id: AppWindowId, dir: -1 | 1) => void;
  onMoveWindowWorkspace: (id: AppWindowId, ws: number) => void;
}

const WindowFrameCard: React.FC<WindowFrameCardProps> = ({
  win,
  config,
  palette,
  isFloatingLayer,
  isFocused,
  tiledCount,
  maximizedActive,
  animDuration,
  bezierPoints,
  workspaceOptions,
  workspaceCount,
  moveMenuWin,
  setMoveMenuWin,
  colElementMap,
  extraStyle,
  extraClass,
  indexInTiled,
  renderContent,
  onFocusWindow,
  onCloseWindow,
  onMinimizeWindow,
  onToggleMaximize,
  onToggleTrueFullscreen,
  onToggleFloating,
  onToggleGroupWindow,
  onTogglePseudoWindow,
  onTogglePinWindow,
  onToggleSpecialWindow,
  onCycleColWidth,
  onSwapWindow,
  onMoveWindowWorkspace,
}) => {
  const dragControls = useDragControls();
  const matchingRule = config.windowRules.find(
    (r) => r.appClass.toLowerCase() === win.appClass.toLowerCase()
  );

  const effectiveTransparency =
    matchingRule?.opacityOverride !== undefined
      ? Math.max(0, Math.min(85, 100 - matchingRule.opacityOverride))
      : config.transparency;

  const useGradientBorder =
    isFocused && config.nyxGradientBorder && config.borderSize > 0 && !win.isTrueFullscreen;
  const borderColor = win.isTrueFullscreen
    ? 'transparent'
    : isFocused
      ? useGradientBorder
        ? 'transparent'
        : palette.primary
      : hexToRgba(palette.outlineVariant, 0.58);

  const surfaceStyles = getSurfaceStyles(
    matchingRule?.noBlur ? 'solid_m3' : config.materialType,
    effectiveTransparency,
    palette,
    config.darkMode,
    {
      elevation: 'window',
      borderWidth: useGradientBorder || win.isTrueFullscreen ? 0 : config.borderSize,
      borderColorOverride: borderColor,
      blurPasses: matchingRule?.noBlur ? 0 : config.blurPasses,
    }
  );

  const colWidth = win.colWidthPct ?? config.nyxScrollColWidth;
  const isPseudoTiled = !isFloatingLayer && !win.isTrueFullscreen && !maximizedActive && Boolean(win.isPseudo);

  const frameNode = (
    <motion.section
      key={win.id}
      ref={(el) => {
        if (el) {
          colElementMap.current.set(win.id, el);
        } else {
          colElementMap.current.delete(win.id);
        }
      }}
      layout={!isFloatingLayer}
      drag={isFloatingLayer}
      dragListener={false}
      dragControls={dragControls}
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{
        opacity: !isFocused && config.nyxDimInactive ? 0.86 : 1,
        scale: 1,
      }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: animDuration, ease: bezierPoints }}
      onMouseDown={(e) => {
        e.stopPropagation();
        onFocusWindow(win.id);
      }}
      onMouseEnter={() => {
        if (config.nyxFollowMouse && !isFocused) {
          onFocusWindow(win.id);
        }
      }}
      onContextMenu={(e) => e.stopPropagation()}
      aria-label={win.title}
      className={`relative flex flex-col min-h-0 min-w-0 overflow-hidden ${
        isFloatingLayer
          ? 'absolute w-[580px] min-w-[320px] max-w-[92vw] h-[440px] min-h-[260px] max-h-[82vh] top-10 left-10 resize'
          : isPseudoTiled
            ? 'w-[78%] h-[78%] m-auto'
            : ''
      } ${extraClass ?? ''}`}
      style={{
        borderRadius: win.isTrueFullscreen ? 0 : `${config.rounding}px`,
        zIndex: isFloatingLayer ? 25 + win.zOrder : undefined,
        filter: !isFocused && config.nyxDimInactive ? 'saturate(0.84) brightness(0.92)' : undefined,
        ...surfaceStyles,
        boxShadow: config.nyxShadows && !win.isTrueFullscreen ? surfaceStyles.boxShadow : 'none',
        ...extraStyle,
      }}
    >
      {useGradientBorder && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-30"
          style={{
            borderRadius: 'inherit',
            padding: `${config.borderSize}px`,
            background: `linear-gradient(135deg, ${palette.primary}, ${palette.tertiary})`,
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />
      )}

      {/* Nyx Window Titlebar (Floating Drag Handle Only) */}
      <div
        onPointerDown={(e) => {
          if (isFloatingLayer) dragControls.start(e);
        }}
        className={`flex items-center justify-between gap-2 px-3.5 py-2 border-b shrink-0 select-none ${
          isFloatingLayer ? 'cursor-grab active:cursor-grabbing' : ''
        }`}
        style={{
          borderColor: hexToRgba(palette.outlineVariant, 0.35),
          backgroundColor: hexToRgba(palette.surfaceContainer, isFocused ? 0.68 : 0.45),
          color: palette.onSurface,
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="text-xs font-display font-semibold truncate"
            style={{ color: isFocused ? palette.onSurface : palette.onSurfaceVariant }}
          >
            {win.title}
          </span>
          <span
            className="text-[11px] font-mono-code truncate hidden sm:inline"
            style={{ color: palette.onSurfaceVariant }}
          >
            · {win.appClass}
            {win.isPinned ? ' · PIN' : ''}
            {win.isPseudo ? ' · PSEUDO' : ''}
            {win.isGrouped ? ' · GROUP' : ''}
            {win.isSpecial ? ' · SCRATCH' : ''}
          </span>
        </div>

        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="relative flex items-center gap-0.5 shrink-0"
        >
          {!isFloatingLayer && tiledCount > 1 && typeof indexInTiled === 'number' && !win.isGrouped && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSwapWindow(win.id, -1);
                }}
                disabled={indexInTiled === 0}
                title="Swap Column Left"
                aria-label="Swap window left"
                className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-30"
                style={{ color: palette.onSurfaceVariant }}
              >
                <ArrowLeft className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSwapWindow(win.id, 1);
                }}
                disabled={indexInTiled === tiledCount - 1}
                title="Swap Column Right"
                aria-label="Swap window right"
                className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-30"
                style={{ color: palette.onSurfaceVariant }}
              >
                <ArrowRight className="w-3 h-3" />
              </button>
            </>
          )}

          {!isFloatingLayer && config.nyxLayout === 'scrolling' && !maximizedActive && !win.isGrouped && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCycleColWidth(win.id);
              }}
              title="Cycle Scrolling Column Width (38% / 52% / 68% / 98%)"
              className="px-1.5 h-6 rounded-full flex items-center gap-1 hover:bg-white/10 text-[10px] font-mono-code tabular-nums cursor-pointer"
              style={{ color: palette.primary }}
            >
              <Columns2 className="w-3 h-3" />
              <span>{colWidth}%</span>
            </button>
          )}

          {!isFloatingLayer && !win.isTrueFullscreen && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleGroupWindow(win.id);
              }}
              title={win.isGrouped ? 'Remove from Tabbed Group (Alt+G)' : 'Add to Hyprland Tabbed Group (Alt+G)'}
              aria-label="Toggle Tabbed Group"
              className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
              style={{ color: win.isGrouped ? palette.primary : palette.onSurfaceVariant }}
            >
              <FolderKanban className="w-3 h-3" />
            </button>
          )}

          {!isFloatingLayer && !win.isTrueFullscreen && !win.isGrouped && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTogglePseudoWindow(win.id);
              }}
              title={win.isPseudo ? 'Disable Pseudotile' : 'Pseudotile inside cell'}
              aria-label="Toggle Pseudotile"
              className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
              style={{ color: win.isPseudo ? palette.primary : palette.onSurfaceVariant }}
            >
              <SquareDashedBottom className="w-3 h-3" />
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePinWindow(win.id);
            }}
            title={win.isPinned ? 'Unpin from all workspaces (Alt+P)' : 'Pin across all workspaces (Alt+P)'}
            aria-label={win.isPinned ? 'Unpin window' : 'Pin window'}
            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
            style={{ color: win.isPinned ? palette.primary : palette.onSurfaceVariant }}
          >
            <Pin className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSpecialWindow(win.id);
            }}
            title={win.isSpecial ? 'Return from Special Scratchpad' : 'Stash in Special Scratchpad (Alt+`)'}
            aria-label="Toggle Special Scratchpad"
            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
            style={{ color: win.isSpecial ? palette.primary : palette.onSurfaceVariant }}
          >
            <Inbox className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMoveMenuWin((curr) => (curr === win.id ? null : win.id));
            }}
            title="Move to Workspace"
            aria-label="Move to Workspace"
            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
            style={{ color: palette.onSurfaceVariant }}
          >
            <ArrowRightLeft className="w-3 h-3" />
          </button>

          {moveMenuWin === win.id && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-7 z-40 flex items-center gap-1 p-1 rounded-xl shadow-xl"
              style={{
                backgroundColor: palette.surfaceContainerHighest,
                border: `1px solid ${hexToRgba(palette.outlineVariant, 0.6)}`,
              }}
            >
              {workspaceOptions.map((ws) => (
                <button
                  key={ws}
                  type="button"
                  onClick={() => {
                    onMoveWindowWorkspace(win.id, ws);
                    setMoveMenuWin(null);
                  }}
                  className="w-6 h-6 rounded-lg text-[11px] font-mono-code font-semibold cursor-pointer tabular-nums"
                  style={{
                    backgroundColor: win.workspace === ws ? palette.primary : 'transparent',
                    color: win.workspace === ws ? palette.onPrimary : palette.onSurface,
                  }}
                >
                  {ws}
                </button>
              ))}
              {config.nyxInfiniteWorkspaces && (
                <button
                  type="button"
                  onClick={() => {
                    onMoveWindowWorkspace(win.id, workspaceCount + 1);
                    setMoveMenuWin(null);
                  }}
                  title="Move to new workspace"
                  className="w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer"
                  style={{ color: palette.primary }}
                >
                  <Plus className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFloating(win.id);
            }}
            title={win.isFloating ? 'Tile Window' : 'Float Window (Titlebar-Draggable & Resizable)'}
            aria-label={win.isFloating ? 'Tile window' : 'Float window'}
            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
            style={{ color: win.isFloating ? palette.primary : palette.onSurfaceVariant }}
          >
            <Layers className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMinimizeWindow(win.id);
            }}
            title="Minimize to Dock"
            aria-label="Minimize window"
            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
            style={{ color: palette.onSurfaceVariant }}
          >
            <Minus className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMaximize(win.id);
            }}
            title={win.isMaximized ? 'Restore tiling' : 'Maximize (keep bar)'}
            aria-label={win.isMaximized ? 'Restore tiling' : 'Maximize'}
            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
            style={{ color: win.isMaximized ? palette.primary : palette.onSurfaceVariant }}
          >
            {win.isMaximized ? (
              <Minimize2 className="w-3 h-3" />
            ) : (
              <Maximize2 className="w-3 h-3" />
            )}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleTrueFullscreen(win.id);
            }}
            title={win.isTrueFullscreen ? 'Exit True Fullscreen' : 'True Fullscreen (Alt+M)'}
            aria-label={win.isTrueFullscreen ? 'Exit Fullscreen' : 'True Fullscreen'}
            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
            style={{ color: win.isTrueFullscreen ? palette.primary : palette.onSurfaceVariant }}
          >
            <Maximize className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCloseWindow(win.id);
            }}
            title="Close window"
            aria-label="Close window"
            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
            style={{ color: palette.onSurfaceVariant }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* App Body */}
      <div className="flex-1 min-h-0 overflow-hidden">{renderContent(win.id)}</div>
    </motion.section>
  );

  if (isPseudoTiled) {
    return (
      <div
        className="w-full h-full flex items-center justify-center"
        style={{
          borderRadius: `${config.rounding}px`,
          border: `1px dashed ${hexToRgba(palette.outlineVariant, 0.35)}`,
        }}
      >
        {frameNode}
      </div>
    );
  }

  return frameNode;
};

export const DesktopStage: React.FC<DesktopStageProps> = ({
  config,
  palette,
  activeWorkspace,
  workspaceCount,
  specialOpen,
  windows,
  focusedWindowId,
  bezierPoints,
  onFocusWindow,
  onCloseWindow,
  onMinimizeWindow,
  onToggleMaximize,
  onToggleTrueFullscreen,
  onToggleFloating,
  onToggleGroupWindow,
  onTogglePseudoWindow,
  onTogglePinWindow,
  onToggleSpecialWindow,
  onCycleColWidth,
  onSwapWindow,
  onFocusAdjacentWindow,
  onMoveWindowWorkspace,
  onSelectWorkspace,
  onCloseSpecialWorkspace,
  onFocusOrOpenApp,
  onUpdateConfig,
  onSelectWallpaper,
  onToggleModule,
  onApplyPreset,
  onResetDefaults,
  onDownloadZip,
  onDesktopContextMenu,
  onOpenWallpaperPicker,
  onOpenClipboard,
  onOpenKeybinds,
  onOpenColorPicker,
  onPushClipboard,
}) => {
  const [moveMenuWin, setMoveMenuWin] = useState<AppWindowId | null>(null);
  const [activeGroupTabId, setActiveGroupTabId] = useState<AppWindowId | null>(null);
  const scrollStripRef = useRef<HTMLDivElement>(null);
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const colElementMap = useRef<Map<AppWindowId, HTMLElement>>(new Map());
  const isResizingSplitRef = useRef(false);

  const isM3Mode = config.shellMode === 'm3';

  const barThickness =
    isM3Mode && config.showBar && !config.barAutoHide
      ? (config.barPosition === 'left' || config.barPosition === 'right'
          ? Math.max(54, Math.min(72, config.barHeight + 14))
          : config.barHeight) + (config.barFloating ? config.barMargin : 0)
      : 0;

  const dockThickness =
    isM3Mode && config.showDock && !config.dockAutoHide ? config.dockIconSize + 28 : 0;

  const edgeExtra = (edge: 'top' | 'bottom' | 'left' | 'right') => {
    let offset = config.gapsOut;
    if (isM3Mode && config.showBar && !config.barAutoHide && config.barPosition === edge) {
      offset += barThickness;
    }
    if (isM3Mode && config.showDock && !config.dockAutoHide && config.dockPosition === edge) {
      offset += dockThickness;
    }
    return offset;
  };

  const visibleWindows = windows.filter(
    (w) =>
      w.isOpen &&
      !w.isMinimized &&
      !w.isSpecial &&
      (w.isPinned || w.workspace === activeWorkspace)
  );
  const specialWindows = windows.filter((w) => w.isOpen && w.isSpecial);

  const trueFullscreenWindow = visibleWindows.find((w) => w.isTrueFullscreen);
  const maximizedWindow = trueFullscreenWindow ?? visibleWindows.find((w) => w.isMaximized);

  const rawTiled = maximizedWindow
    ? [maximizedWindow]
    : visibleWindows.filter((w) => !w.isFloating);

  const groupedWindows = maximizedWindow ? [] : rawTiled.filter((w) => w.isGrouped);
  const ungroupedTiled = maximizedWindow ? rawTiled : rawTiled.filter((w) => !w.isGrouped);

  const floatingWindows = maximizedWindow
    ? []
    : [...visibleWindows.filter((w) => w.isFloating)].sort((a, b) => a.zOrder - b.zOrder);

  const animDuration = 0.34 * config.animSpeed;

  // Keep active group tab aligned with focused window when possible
  useEffect(() => {
    if (groupedWindows.length === 0) return;
    if (focusedWindowId && groupedWindows.some((w) => w.id === focusedWindowId)) {
      setActiveGroupTabId(focusedWindowId);
    } else if (!activeGroupTabId || !groupedWindows.some((w) => w.id === activeGroupTabId)) {
      setActiveGroupTabId(groupedWindows[0].id);
    }
  }, [groupedWindows, focusedWindowId, activeGroupTabId]);

  // Auto-center focused window when in Infinite Scrolling layout
  useEffect(() => {
    if (config.nyxLayout !== 'scrolling' || !focusedWindowId) return;
    const targetEl = colElementMap.current.get(focusedWindowId);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [focusedWindowId, config.nyxLayout, rawTiled.length]);

  // Interactive split-divider mouse drag listener
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isResizingSplitRef.current || !splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      if (rect.width <= 0) return;
      const pct = Math.round(((e.clientX - rect.left) / rect.width) * 100);
      const clamped = Math.max(35, Math.min(75, pct));
      onUpdateConfig({ nyxSplitRatio: clamped });
    };
    const onMouseUp = () => {
      isResizingSplitRef.current = false;
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onUpdateConfig]);

  const handleStripWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const strip = scrollStripRef.current;
    if (!strip) return;
    if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      strip.scrollLeft += e.deltaX !== 0 ? e.deltaX : e.deltaY;
    }
  };

  const renderAppContent = (id: AppWindowId) => {
    switch (id) {
      case 'customizer':
        return (
          <CustomizerApp
            config={config}
            palette={palette}
            onUpdateConfig={onUpdateConfig}
            onSelectWallpaper={onSelectWallpaper}
            onToggleModule={onToggleModule}
            onApplyPreset={onApplyPreset}
            onResetDefaults={onResetDefaults}
            onOpenCodeExport={() => onFocusOrOpenApp('code_export')}
            onOpenWallpaperPicker={onOpenWallpaperPicker}
            onOpenKeybinds={onOpenKeybinds}
            onOpenColorPicker={onOpenColorPicker}
          />
        );
      case 'terminal':
        return (
          <TerminalApp
            config={config}
            palette={palette}
            activeWorkspace={activeWorkspace}
            workspaceCount={workspaceCount}
            windows={windows}
            focusedWindowId={focusedWindowId}
            onSelectWorkspace={onSelectWorkspace}
            onFocusOrOpenApp={onFocusOrOpenApp}
            onToggleFloating={onToggleFloating}
            onToggleMaximize={onToggleMaximize}
            onToggleTrueFullscreen={onToggleTrueFullscreen}
            onToggleGroupWindow={onToggleGroupWindow}
            onTogglePseudoWindow={onTogglePseudoWindow}
            onTogglePinWindow={onTogglePinWindow}
            onCloseWindow={onCloseWindow}
            onFocusAdjacentWindow={onFocusAdjacentWindow}
            onSwapWindow={onSwapWindow}
            onMoveWindowWorkspace={onMoveWindowWorkspace}
            onUpdateConfig={onUpdateConfig}
            onOpenWallpaperPicker={onOpenWallpaperPicker}
            onOpenClipboard={onOpenClipboard}
            onOpenKeybinds={onOpenKeybinds}
            onOpenColorPicker={onOpenColorPicker}
            onPushClipboard={onPushClipboard}
          />
        );
      case 'code_export':
        return (
          <CodeExportApp
            config={config}
            palette={palette}
            onDownloadZip={onDownloadZip}
            onPushClipboard={onPushClipboard}
          />
        );
      case 'telemetry':
        return <TelemetryApp config={config} palette={palette} />;
      case 'notes':
        return <NotesApp palette={palette} />;
    }
  };

  const workspaceOptions = Array.from({ length: workspaceCount }, (_, idx) => idx + 1);

  const renderFrame = (
    win: DesktopWindow,
    isFloatingLayer: boolean,
    extraStyle?: React.CSSProperties,
    extraClass?: string,
    indexInTiled?: number
  ) => (
    <WindowFrameCard
      key={win.id}
      win={win}
      config={config}
      palette={palette}
      isFloatingLayer={isFloatingLayer}
      isFocused={focusedWindowId === win.id || visibleWindows.length === 1}
      tiledCount={ungroupedTiled.length}
      maximizedActive={Boolean(maximizedWindow)}
      animDuration={animDuration}
      bezierPoints={bezierPoints}
      workspaceOptions={workspaceOptions}
      workspaceCount={workspaceCount}
      moveMenuWin={moveMenuWin}
      setMoveMenuWin={setMoveMenuWin}
      colElementMap={colElementMap}
      extraStyle={extraStyle}
      extraClass={extraClass}
      indexInTiled={indexInTiled}
      renderContent={renderAppContent}
      onFocusWindow={onFocusWindow}
      onCloseWindow={onCloseWindow}
      onMinimizeWindow={onMinimizeWindow}
      onToggleMaximize={onToggleMaximize}
      onToggleTrueFullscreen={onToggleTrueFullscreen}
      onToggleFloating={onToggleFloating}
      onToggleGroupWindow={onToggleGroupWindow}
      onTogglePseudoWindow={onTogglePseudoWindow}
      onTogglePinWindow={onTogglePinWindow}
      onToggleSpecialWindow={onToggleSpecialWindow}
      onCycleColWidth={onCycleColWidth}
      onSwapWindow={onSwapWindow}
      onMoveWindowWorkspace={onMoveWindowWorkspace}
    />
  );

  // Render Hyprland Tabbed Group Container (when 1+ grouped windows share workspace)
  const renderGroupedContainer = (extraStyle?: React.CSSProperties, extraClass?: string) => {
    if (groupedWindows.length === 0) return null;
    const activeTabWin =
      groupedWindows.find((w) => w.id === activeGroupTabId) ?? groupedWindows[0];

    return (
      <div
        key="hypr-group-container"
        className={`flex flex-col min-h-0 min-w-0 gap-1.5 ${extraClass ?? ''}`}
        style={extraStyle}
      >
        {/* Hyprland Groupbar Strip */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 p-1 rounded-xl shrink-0 overflow-x-auto"
          style={{
            backgroundColor: hexToRgba(palette.surfaceContainerHigh, 0.85),
            border: `1px solid ${hexToRgba(palette.outlineVariant, 0.45)}`,
          }}
        >
          {groupedWindows.map((gw) => {
            const active = gw.id === activeTabWin.id;
            return (
              <button
                key={gw.id}
                type="button"
                onClick={() => {
                  setActiveGroupTabId(gw.id);
                  onFocusWindow(gw.id);
                }}
                className="flex-1 min-w-[90px] px-2.5 py-1 rounded-lg text-[11px] font-semibold truncate transition-colors cursor-pointer"
                style={{
                  backgroundColor: active ? palette.primary : 'transparent',
                  color: active ? palette.onPrimary : palette.onSurfaceVariant,
                }}
              >
                {gw.title}
              </button>
            );
          })}
        </div>

        <div className="flex-1 min-h-0 flex">
          {renderFrame(activeTabWin, false, undefined, 'w-full h-full')}
        </div>
      </div>
    );
  };

  // Render tiled layout matching Nyx LayoutEngine (Dwindle | Infinite Scrolling | Master)
  const renderTiledContainer = () => {
    if (rawTiled.length === 0) {
      // Empty workspace: pure, clean wallpaper (never show "no active windows" text)
      return null;
    }

    // True edge-to-edge Fullscreen (covers bars & gaps)
    if (trueFullscreenWindow) {
      return (
        <div className="fixed inset-0 z-40">
          {renderFrame(trueFullscreenWindow, false, undefined, 'w-full h-full')}
        </div>
      );
    }

    if (maximizedWindow) {
      return renderFrame(maximizedWindow, false, undefined, 'w-full h-full');
    }

    const totalSlots = ungroupedTiled.length + (groupedWindows.length > 0 ? 1 : 0);

    if (config.nyxLayout === 'scrolling') {
      const closedApps = windows.filter(
        (w) => !w.isOpen || w.workspace !== activeWorkspace || w.isMinimized
      );

      return (
        <div className="relative w-full h-full">
          <div
            ref={scrollStripRef}
            onWheel={handleStripWheel}
            className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scroll-smooth"
            style={{ gap: `${config.gapsIn * 2}px` }}
          >
            {groupedWindows.length > 0 &&
              renderGroupedContainer(
                { width: `${config.nyxScrollColWidth}%`, minWidth: '340px', flexShrink: 0 },
                'h-full snap-center'
              )}

            {ungroupedTiled.map((win, idx) => {
              const wPct =
                totalSlots === 1 && !win.colWidthPct
                  ? 100
                  : win.colWidthPct ?? config.nyxScrollColWidth;
              return renderFrame(
                win,
                false,
                {
                  width: `${wPct}%`,
                  minWidth: '340px',
                  flexShrink: 0,
                },
                'h-full snap-center',
                idx
              );
            })}

            {closedApps.length > 0 && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="h-full shrink-0 snap-end flex flex-col justify-center items-center p-5 gap-3"
                style={{
                  width: '240px',
                  borderRadius: `${config.rounding}px`,
                  border: `1.5px dashed ${hexToRgba(palette.outlineVariant, 0.55)}`,
                  backgroundColor: hexToRgba(palette.surfaceContainer, 0.28),
                  backdropFilter: 'blur(10px)',
                  color: palette.onSurface,
                }}
              >
                <div className="text-xs font-display font-semibold">Append to Strip</div>
                <div className="flex flex-col gap-1.5 w-full">
                  {closedApps.slice(0, 4).map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => onFocusOrOpenApp(app.id)}
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors hover:opacity-90"
                      style={{
                        backgroundColor: hexToRgba(palette.surfaceContainerHigh, 0.72),
                        color: palette.onSurface,
                      }}
                    >
                      <span className="truncate">{app.appClass}</span>
                      <Plus className="w-3.5 h-3.5 shrink-0" style={{ color: palette.primary }} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {ungroupedTiled.length > 1 && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-2 py-1 rounded-full shadow-lg"
              style={{
                backgroundColor: hexToRgba(palette.surfaceContainerHigh, 0.85),
                backdropFilter: 'blur(14px)',
                border: `1px solid ${hexToRgba(palette.outlineVariant, 0.5)}`,
                color: palette.onSurface,
              }}
            >
              <button
                type="button"
                onClick={() => onFocusAdjacentWindow(-1)}
                title="Focus Previous Column (Alt+Left)"
                aria-label="Focus Previous Column"
                className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {ungroupedTiled.map((win) => {
                const active = win.id === focusedWindowId;
                return (
                  <button
                    key={win.id}
                    type="button"
                    onClick={() => onFocusWindow(win.id)}
                    className="px-2 py-0.5 rounded-full text-[11px] font-mono-code cursor-pointer transition-colors whitespace-nowrap"
                    style={{
                      backgroundColor: active ? palette.primary : 'transparent',
                      color: active ? palette.onPrimary : palette.onSurfaceVariant,
                    }}
                  >
                    {win.appClass}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => onFocusAdjacentWindow(1)}
                title="Focus Next Column (Alt+Right)"
                aria-label="Focus Next Column"
                className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      );
    }

    const leftFr = (config.nyxSplitRatio / 100).toFixed(2);
    const rightFr = ((100 - config.nyxSplitRatio) / 100).toFixed(2);

    const renderSplitDivider = () =>
      totalSlots > 1 ? (
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            isResizingSplitRef.current = true;
          }}
          title="Drag to resize Hyprland split ratio"
          className="absolute top-4 bottom-4 z-20 w-3 -ml-1.5 cursor-col-resize flex items-center justify-center group"
          style={{ left: `${config.nyxSplitRatio}%` }}
        >
          <div
            className="w-1 h-12 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ backgroundColor: palette.primary }}
          />
        </div>
      ) : null;

    if (config.nyxLayout === 'master' && totalSlots > 1) {
      const firstIsGroup = groupedWindows.length > 0;
      const masterSlot = firstIsGroup
        ? renderGroupedContainer()
        : renderFrame(ungroupedTiled[0], false, undefined, undefined, 0);
      const stackWindows = firstIsGroup ? ungroupedTiled : ungroupedTiled.slice(1);

      return (
        <div ref={splitContainerRef} className="relative w-full h-full">
          <div
            className="w-full h-full grid"
            style={{
              gap: `${config.gapsIn * 2}px`,
              gridTemplateColumns: `minmax(0, ${leftFr}fr) minmax(0, ${rightFr}fr)`,
            }}
          >
            {masterSlot}
            <div
              className="grid min-h-0"
              style={{
                gap: `${config.gapsIn * 2}px`,
                gridAutoRows: 'minmax(0, 1fr)',
              }}
            >
              {stackWindows.map((win, idx) =>
                renderFrame(win, false, undefined, undefined, idx + (firstIsGroup ? 0 : 1))
              )}
            </div>
          </div>
          {renderSplitDivider()}
        </div>
      );
    }

    // Dwindle default
    return (
      <div ref={splitContainerRef} className="relative w-full h-full">
        <div
          className="w-full h-full grid"
          style={{
            gap: `${config.gapsIn * 2}px`,
            gridTemplateColumns:
              totalSlots <= 1
                ? 'minmax(0, 1fr)'
                : `minmax(0, ${leftFr}fr) minmax(0, ${rightFr}fr)`,
            gridAutoRows: 'minmax(0, 1fr)',
          }}
        >
          {groupedWindows.length > 0 && renderGroupedContainer()}
          {ungroupedTiled.map((win, idx) => renderFrame(win, false, undefined, undefined, idx))}
        </div>
        {renderSplitDivider()}
      </div>
    );
  };

  return (
    <main
      onClick={() => setMoveMenuWin(null)}
      onContextMenu={onDesktopContextMenu}
      className="fixed inset-0 z-10 transition-all"
      style={{
        paddingTop: trueFullscreenWindow ? 0 : edgeExtra('top'),
        paddingBottom: trueFullscreenWindow ? 0 : edgeExtra('bottom'),
        paddingLeft: trueFullscreenWindow ? 0 : edgeExtra('left'),
        paddingRight: trueFullscreenWindow ? 0 : edgeExtra('right'),
        transitionDuration: `${Math.round(280 * config.animSpeed)}ms`,
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activeWorkspace}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: animDuration, ease: bezierPoints }}
          className="relative w-full h-full"
        >
          {renderTiledContainer()}

          <AnimatePresence>
            {floatingWindows.map((win) => renderFrame(win, true))}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      {/* Hyprland Special Scratchpad Overlay (special:magic, Alt+`) */}
      <AnimatePresence>
        {specialOpen && (
          <motion.div
            initial={{ opacity: 0, y: -26 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -26 }}
            transition={{ duration: 0.24 * config.animSpeed, ease: bezierPoints }}
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-8 top-6 bottom-12 z-40 flex flex-col gap-3 p-4 shadow-2xl"
            style={{
              borderRadius: Math.max(20, config.rounding + 4),
              color: palette.onSurface,
              ...getSurfaceStyles(
                config.materialType,
                Math.min(55, config.transparency + 8),
                palette,
                config.darkMode,
                { elevation: 'overlay', blurPasses: config.blurPasses }
              ),
              border: `1.5px solid ${palette.primary}`,
            }}
          >
            <div className="flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4" style={{ color: palette.primary }} />
                <span className="text-xs font-display font-semibold">
                  special:magic Scratchpad Workspace
                </span>
                <span
                  className="text-[11px] font-mono-code"
                  style={{ color: palette.onSurfaceVariant }}
                >
                  Alt+` to toggle
                </span>
              </div>
              <div className="flex items-center gap-2">
                {specialWindows.length === 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      onFocusOrOpenApp('notes');
                      onToggleSpecialWindow('notes');
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer"
                    style={{
                      backgroundColor: palette.primaryContainer,
                      color: palette.onPrimaryContainer,
                    }}
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Summon Scratchpad Notes</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onCloseSpecialWorkspace}
                  aria-label="Close Special Workspace"
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:opacity-80 cursor-pointer"
                  style={{ backgroundColor: palette.surfaceContainerHigh }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {specialWindows.length === 0 ? (
              <div
                className="flex-1 flex flex-col items-center justify-center gap-3 rounded-2xl text-xs"
                style={{
                  backgroundColor: hexToRgba(palette.surfaceContainer, 0.45),
                  color: palette.onSurfaceVariant,
                }}
              >
                <p>Use the Inbox icon in any window titlebar to stash windows here.</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onFocusOrOpenApp('terminal');
                      onToggleSpecialWindow('terminal');
                    }}
                    className="px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer"
                    style={{
                      backgroundColor: palette.secondaryContainer,
                      color: palette.onSecondaryContainer,
                    }}
                  >
                    Stash nyx-term Here
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="flex-1 min-h-0 grid gap-3"
                style={{
                  gridTemplateColumns:
                    specialWindows.length <= 1
                      ? 'minmax(0, 1fr)'
                      : 'repeat(auto-fit, minmax(320px, 1fr))',
                }}
              >
                {specialWindows.map((win) =>
                  renderFrame(win, false, undefined, 'h-full')
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};
