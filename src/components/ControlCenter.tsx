import React from 'react';
import {
  BellOff,
  Bluetooth,
  Clipboard,
  Coffee,
  Eye,
  Image as ImageIcon,
  Lock,
  Moon,
  Pause,
  Pipette,
  Play,
  RefreshCw,
  SlidersHorizontal,
  SkipBack,
  SkipForward,
  Sun,
  Trash2,
  Volume2,
  Wifi,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { hexToRgba, USER_AVATAR_SRC, WALLPAPERS } from '../lib/m3Engine';
import { getSurfaceStyles } from '../lib/surfaceMaterial';
import {
  M3Palette,
  MediaTrack,
  ShellConfig,
  ShellNotification,
  SidebarStyle,
} from '../types/shell';

interface ControlCenterProps {
  open: boolean;
  config: ShellConfig;
  palette: M3Palette;
  media: MediaTrack;
  notifications: ShellNotification[];
  ramMb: number;
  bezierPoints: [number, number, number, number];
  onClose: () => void;
  onUpdateConfig: (patch: Partial<ShellConfig>, osdLabel?: string) => void;
  onSelectWallpaper: (id: string) => void;
  onOpenWallpaperPicker: () => void;
  onOpenClipboard: () => void;
  onOpenColorPicker?: () => void;
  onCustomizeSidebar: () => void;
  onToggleMediaPlay: () => void;
  onSkipTrack: (dir: 1 | -1) => void;
  onDismissNotification: (id: string) => void;
  onClearNotifications: () => void;
  onLock: () => void;
  onReloadShell: () => void;
}

const STYLE_OPTIONS: { id: SidebarStyle; label: string }[] = [
  { id: 'm3', label: 'M3' },
  { id: 'macos', label: 'macOS' },
  { id: 'minimal', label: 'Minimal' },
];

export const ControlCenter: React.FC<ControlCenterProps> = ({
  open,
  config,
  palette,
  media,
  notifications,
  ramMb,
  bezierPoints,
  onClose,
  onUpdateConfig,
  onSelectWallpaper,
  onOpenWallpaperPicker,
  onOpenClipboard,
  onOpenColorPicker,
  onCustomizeSidebar,
  onToggleMediaPlay,
  onSkipTrack,
  onDismissNotification,
  onClearNotifications,
  onLock,
  onReloadShell,
}) => {
  const durationSec = 0.34 * config.animSpeed;
  const surfaceStyles = getSurfaceStyles(
    config.materialType,
    config.transparency,
    palette,
    config.darkMode,
    { elevation: 'overlay', blurPasses: config.blurPasses }
  );

  const isLeft = config.sidebarPosition === 'left';
  const enterX = isLeft ? -440 : 440;
  const allWallpapers = [...WALLPAPERS, ...config.customWallpapers];

  const isMacOSStyle = config.sidebarStyle === 'macos';
  const isMinimalStyle = config.sidebarStyle === 'minimal';
  const isPopover = config.sidebarAnchor === 'popover';
  const padClass = config.sidebarCompact ? 'p-3' : 'p-4';
  const gapClass = config.sidebarCompact ? 'gap-2.5' : 'gap-3.5';

  // Position geometry: supports both Edge Drawer and Floating macOS Corner Popover on either Left or Right
  const getAsidePositionStyle = (): React.CSSProperties => {
    const baseWidth = isPopover ? Math.min(config.sidebarWidth, 396) : config.sidebarWidth;
    if (isPopover) {
      const topOffset =
        config.shellMode === 'm3' && config.showBar && !config.barAutoHide && config.barPosition === 'top'
          ? (config.barFloating ? config.barMargin : 0) + config.barHeight + 10
          : config.shellMode === 'mixi' && config.mixiePosition.startsWith('top_')
            ? 74
            : 14;
      return {
        top: topOffset,
        left: isLeft ? 14 : undefined,
        right: isLeft ? undefined : 14,
        width: baseWidth,
        maxWidth: 'calc(100vw - 24px)',
        maxHeight: 'calc(100vh - 96px)',
        borderRadius: config.sidebarRadius,
      };
    }

    const edgeInset = config.sidebarFloating ? 12 : 0;
    return {
      top: edgeInset,
      bottom: edgeInset,
      width: baseWidth,
      maxWidth: 'calc(100vw - 24px)',
      left: isLeft ? edgeInset : undefined,
      right: isLeft ? undefined : edgeInset,
      borderRadius: config.sidebarFloating ? config.sidebarRadius : 0,
    };
  };

  const quickTiles = [
    {
      key: 'wifi',
      label: 'Wi-Fi',
      sub: config.wifiEnabled ? 'Studio-5G' : 'Off',
      active: config.wifiEnabled,
      icon: Wifi,
      onClick: () => onUpdateConfig({ wifiEnabled: !config.wifiEnabled }),
    },
    {
      key: 'bt',
      label: 'Bluetooth',
      sub: config.bluetoothEnabled ? 'WH-1000XM5' : 'Off',
      active: config.bluetoothEnabled,
      icon: Bluetooth,
      onClick: () => onUpdateConfig({ bluetoothEnabled: !config.bluetoothEnabled }),
    },
    {
      key: 'night',
      label: 'Hyprsunset',
      sub: config.nightLightEnabled ? `${config.nightTempK}K Warm` : 'Off',
      active: config.nightLightEnabled,
      icon: Eye,
      onClick: () => onUpdateConfig({ nightLightEnabled: !config.nightLightEnabled }),
    },
    {
      key: 'dnd',
      label: 'Focus',
      sub: config.dndEnabled ? 'Do Not Disturb' : 'Notifications On',
      active: config.dndEnabled,
      icon: BellOff,
      onClick: () => onUpdateConfig({ dndEnabled: !config.dndEnabled }),
    },
    {
      key: 'caffeine',
      label: 'Caffeine',
      sub: config.caffeineEnabled ? 'Awake' : 'Auto Sleep',
      active: config.caffeineEnabled,
      icon: Coffee,
      onClick: () => onUpdateConfig({ caffeineEnabled: !config.caffeineEnabled }),
    },
    {
      key: 'theme',
      label: config.darkMode ? 'Dark UI' : 'Light UI',
      sub: config.m3Scheme.replace('_', ' '),
      active: config.darkMode,
      icon: config.darkMode ? Moon : Sun,
      onClick: () => onUpdateConfig({ darkMode: !config.darkMode }),
    },
  ];

  const macosCardBg = config.darkMode
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(255, 255, 255, 0.56)';
  const macosBorder = config.darkMode
    ? '1px solid rgba(255, 255, 255, 0.14)'
    : '1px solid rgba(255, 255, 255, 0.72)';

  const renderStylePills = () => (
    <div
      className="flex items-center gap-0.5 p-0.5 rounded-full shrink-0"
      style={{
        backgroundColor: isMacOSStyle ? macosCardBg : hexToRgba(palette.surfaceContainerHigh, 0.8),
        border: isMacOSStyle ? macosBorder : undefined,
      }}
      title="Switch Sidebar Look (M3 / macOS Bento / Minimal)"
    >
      {STYLE_OPTIONS.map((opt) => {
        const active = config.sidebarStyle === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() =>
              onUpdateConfig(
                {
                  sidebarStyle: opt.id,
                  sidebarAnchor: opt.id === 'macos' ? 'popover' : config.sidebarAnchor,
                },
                `Sidebar Style: ${opt.label}`
              )
            }
            className="px-2 py-0.5 rounded-full text-[10px] font-semibold cursor-pointer whitespace-nowrap transition-colors"
            style={{
              backgroundColor: active ? palette.primary : 'transparent',
              color: active ? palette.onPrimary : palette.onSurfaceVariant,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: durationSec * 0.6 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/22"
          />

          <motion.aside
            aria-label="Customizable Control Sidebar"
            initial={isPopover ? { opacity: 0, scale: 0.92, y: -12 } : { x: enterX, opacity: 0 }}
            animate={isPopover ? { opacity: 1, scale: 1, y: 0 } : { x: 0, opacity: 1 }}
            exit={isPopover ? { opacity: 0, scale: 0.94, y: -10 } : { x: enterX, opacity: 0 }}
            transition={{ duration: durationSec * (isPopover ? 0.85 : 1), ease: bezierPoints }}
            className={`fixed z-50 flex flex-col ${gapClass} ${padClass} overflow-y-auto shadow-2xl`}
            style={{
              ...getAsidePositionStyle(),
              color: palette.onSurface,
              ...surfaceStyles,
            }}
          >
            {/* Header (Profile or Minimal Toolbar) */}
            {config.sidebarShowProfile ? (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`${isMacOSStyle ? 'w-8 h-8' : 'w-10 h-10'} rounded-full overflow-hidden shrink-0`}
                    style={{ backgroundColor: palette.primaryContainer }}
                  >
                    <img
                      src={USER_AVATAR_SRC}
                      alt="ammar user avatar"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-display font-semibold truncate">
                      {isMacOSStyle ? 'Control Center' : 'ammar@nyx-desktop'}
                    </div>
                    <div
                      className="text-[11px] font-mono-code tabular-nums truncate"
                      style={{ color: palette.onSurfaceVariant }}
                    >
                      {isMacOSStyle
                        ? `ammar · ${ramMb.toFixed(1)} MB`
                        : `nyx + myx · ${ramMb.toFixed(1)} MB`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {renderStylePills()}
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onCustomizeSidebar();
                    }}
                    title="Customize Sidebar"
                    className="w-7 h-7 flex items-center justify-center rounded-full hover:opacity-80 cursor-pointer"
                    style={{
                      backgroundColor: isMacOSStyle ? macosCardBg : palette.surfaceContainerHigh,
                      color: palette.onSurface,
                    }}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={onLock}
                    title="Lock Screen"
                    className="w-7 h-7 flex items-center justify-center rounded-full hover:opacity-80 cursor-pointer"
                    style={{
                      backgroundColor: isMacOSStyle ? macosCardBg : palette.surfaceContainerHigh,
                      color: palette.onSurface,
                    }}
                  >
                    <Lock className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close sidebar"
                    className="w-7 h-7 flex items-center justify-center rounded-full hover:opacity-80 cursor-pointer"
                    style={{
                      backgroundColor: isMacOSStyle ? macosCardBg : palette.surfaceContainerHigh,
                      color: palette.onSurface,
                    }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                {renderStylePills()}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenClipboard();
                    }}
                    title="Clipboard Ring (Alt+V)"
                    className="w-7 h-7 flex items-center justify-center rounded-full cursor-pointer"
                    style={{ backgroundColor: isMacOSStyle ? macosCardBg : palette.surfaceContainerHigh }}
                  >
                    <Clipboard className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onCustomizeSidebar();
                    }}
                    title="Customize Sidebar"
                    className="w-7 h-7 flex items-center justify-center rounded-full cursor-pointer"
                    style={{ backgroundColor: isMacOSStyle ? macosCardBg : palette.surfaceContainerHigh }}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={onReloadShell}
                    title="Reload Nyx + Myx"
                    className="w-7 h-7 flex items-center justify-center rounded-full cursor-pointer"
                    style={{ backgroundColor: isMacOSStyle ? macosCardBg : palette.surfaceContainerHigh }}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close sidebar"
                    className="w-7 h-7 flex items-center justify-center rounded-full cursor-pointer"
                    style={{ backgroundColor: isMacOSStyle ? macosCardBg : palette.surfaceContainerHigh }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Quick Settings Module (macOS Bento Grid vs M3 Expressive Pills vs Minimal Strips) */}
            {config.sidebarShowQuickTiles && isMacOSStyle && (
              <div className="grid grid-cols-2 gap-2.5">
                {/* Left 2x2 Connectivity Bento Card */}
                <div
                  className="p-2.5 rounded-[20px] grid grid-cols-2 gap-1.5"
                  style={{ backgroundColor: macosCardBg, border: macosBorder }}
                >
                  {[
                    {
                      label: 'Wi-Fi',
                      active: config.wifiEnabled,
                      icon: Wifi,
                      onClick: () => onUpdateConfig({ wifiEnabled: !config.wifiEnabled }),
                    },
                    {
                      label: 'Bluetooth',
                      active: config.bluetoothEnabled,
                      icon: Bluetooth,
                      onClick: () => onUpdateConfig({ bluetoothEnabled: !config.bluetoothEnabled }),
                    },
                    {
                      label: 'Night Shift',
                      active: config.nightLightEnabled,
                      icon: Eye,
                      onClick: () => onUpdateConfig({ nightLightEnabled: !config.nightLightEnabled }),
                    },
                    {
                      label: 'Caffeine',
                      active: config.caffeineEnabled,
                      icon: Coffee,
                      onClick: () => onUpdateConfig({ caffeineEnabled: !config.caffeineEnabled }),
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={item.onClick}
                        title={item.label}
                        className="flex flex-col items-center justify-center gap-1 py-1.5 rounded-2xl cursor-pointer transition-transform active:scale-95"
                      >
                        <span
                          className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                          style={{
                            backgroundColor: item.active
                              ? palette.primary
                              : hexToRgba(palette.surfaceContainerHighest, 0.72),
                            color: item.active ? palette.onPrimary : palette.onSurfaceVariant,
                          }}
                        >
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="text-[10px] font-medium truncate max-w-full">
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Right Focus Pill + Appearance + Clipboard Bento */}
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateConfig({ dndEnabled: !config.dndEnabled })}
                    className="flex-1 px-3 py-2.5 rounded-[20px] flex items-center gap-2.5 text-left cursor-pointer transition-colors"
                    style={{
                      backgroundColor: config.dndEnabled ? palette.primaryContainer : macosCardBg,
                      border: macosBorder,
                      color: config.dndEnabled ? palette.onPrimaryContainer : palette.onSurface,
                    }}
                  >
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: config.dndEnabled
                          ? palette.primary
                          : hexToRgba(palette.surfaceContainerHighest, 0.75),
                        color: config.dndEnabled ? palette.onPrimary : palette.onSurfaceVariant,
                      }}
                    >
                      <BellOff className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate">Focus</div>
                      <div className="text-[10px] opacity-75 truncate">
                        {config.dndEnabled ? 'Do Not Disturb' : 'Notifications On'}
                      </div>
                    </div>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onUpdateConfig({ darkMode: !config.darkMode })}
                      className="p-2.5 rounded-[18px] flex flex-col items-center justify-center gap-1 cursor-pointer"
                      style={{
                        backgroundColor: config.darkMode ? palette.secondaryContainer : macosCardBg,
                        border: macosBorder,
                        color: config.darkMode ? palette.onSecondaryContainer : palette.onSurface,
                      }}
                    >
                      {config.darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                      <span className="text-[10px] font-medium">
                        {config.darkMode ? 'Dark' : 'Light'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenClipboard();
                      }}
                      className="p-2.5 rounded-[18px] flex flex-col items-center justify-center gap-1 cursor-pointer"
                      style={{ backgroundColor: macosCardBg, border: macosBorder }}
                    >
                      <Clipboard className="w-4 h-4" />
                      <span className="text-[10px] font-medium">Clipboard</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {config.sidebarShowQuickTiles && !isMacOSStyle && (
              <div className={isMinimalStyle ? 'grid grid-cols-3 gap-1.5' : 'grid grid-cols-2 gap-2'}>
                {quickTiles.map((tile) => {
                  const Icon = tile.icon;
                  if (isMinimalStyle) {
                    return (
                      <button
                        key={tile.key}
                        type="button"
                        onClick={tile.onClick}
                        className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl transition-colors cursor-pointer"
                        style={{
                          backgroundColor: tile.active
                            ? hexToRgba(palette.primaryContainer, 0.72)
                            : hexToRgba(palette.surfaceContainerHigh, 0.45),
                          color: tile.active ? palette.onPrimaryContainer : palette.onSurfaceVariant,
                        }}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[11px] font-medium truncate max-w-full">
                          {tile.label}
                        </span>
                      </button>
                    );
                  }
                  return (
                    <button
                      key={tile.key}
                      type="button"
                      onClick={tile.onClick}
                      className="flex items-center gap-2.5 p-3 text-left transition-all active:scale-[0.98] cursor-pointer"
                      style={{
                        backgroundColor: tile.active
                          ? palette.primaryContainer
                          : hexToRgba(palette.surfaceContainerHigh, 0.72),
                        color: tile.active ? palette.onPrimaryContainer : palette.onSurface,
                        borderRadius: tile.active ? 999 : 16,
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: tile.active
                            ? palette.primary
                            : palette.surfaceContainerHighest,
                          color: tile.active ? palette.onPrimary : palette.onSurfaceVariant,
                        }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate">{tile.label}</div>
                        <div className="text-[11px] opacity-75 truncate capitalize">{tile.sub}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Display & Audio Sliders */}
            {config.sidebarShowSliders && (
              <div
                className="flex flex-col gap-3 p-3.5 rounded-[20px]"
                style={{
                  backgroundColor: isMacOSStyle
                    ? macosCardBg
                    : hexToRgba(palette.surfaceContainer, isMinimalStyle ? 0.45 : 0.68),
                  border: isMacOSStyle ? macosBorder : undefined,
                }}
              >
                <label className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-medium">
                      <Sun className="w-3.5 h-3.5" style={{ color: palette.primary }} />
                      {isMacOSStyle ? 'Display' : 'Display Brightness'}
                    </span>
                    <span className="font-mono-code tabular-nums" style={{ color: palette.onSurfaceVariant }}>
                      {config.brightness}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={100}
                    value={config.brightness}
                    onChange={(e) =>
                      onUpdateConfig({ brightness: Number(e.target.value) }, `Display ${e.target.value}%`)
                    }
                    className={`w-full accent-current cursor-pointer rounded-full ${isMacOSStyle ? 'h-2.5' : 'h-2'}`}
                    style={{ color: palette.primary }}
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-medium">
                      <Volume2 className="w-3.5 h-3.5" style={{ color: palette.primary }} />
                      {isMacOSStyle ? 'Sound' : 'PipeWire Master Volume'}
                    </span>
                    <span className="font-mono-code tabular-nums" style={{ color: palette.onSurfaceVariant }}>
                      {config.volume}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={config.volume}
                    onChange={(e) =>
                      onUpdateConfig({ volume: Number(e.target.value) }, `Sound ${e.target.value}%`)
                    }
                    className={`w-full accent-current cursor-pointer rounded-full ${isMacOSStyle ? 'h-2.5' : 'h-2'}`}
                    style={{ color: palette.primary }}
                  />
                </label>

                {config.nightLightEnabled && (
                  <label className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 font-medium">
                        <Eye className="w-3.5 h-3.5" style={{ color: palette.primary }} />
                        Hyprsunset Warmth
                      </span>
                      <span className="font-mono-code tabular-nums" style={{ color: palette.onSurfaceVariant }}>
                        {config.nightTempK}K
                      </span>
                    </div>
                    <input
                      type="range"
                      min={2500}
                      max={6500}
                      step={100}
                      value={config.nightTempK}
                      onChange={(e) =>
                        onUpdateConfig({ nightTempK: Number(e.target.value) }, `Hyprsunset ${e.target.value}K`)
                      }
                      className={`w-full accent-current cursor-pointer rounded-full ${isMacOSStyle ? 'h-2.5' : 'h-2'}`}
                      style={{ color: palette.primary }}
                    />
                  </label>
                )}

                {onOpenColorPicker && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenColorPicker();
                    }}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-opacity hover:opacity-90"
                    style={{
                      backgroundColor: hexToRgba(palette.primaryContainer, 0.55),
                      color: palette.onPrimaryContainer,
                    }}
                  >
                    <span className="flex items-center gap-1.5">
                      <Pipette className="w-3.5 h-3.5" />
                      <span>Hyprpicker Screen Color</span>
                    </span>
                    <span className="text-[10px] font-mono-code opacity-80">Shift+Alt+P</span>
                  </button>
                )}
              </div>
            )}

            {/* Quick Wallpaper Strip */}
            {config.sidebarShowWallpaperStrip && (
              <div
                className="p-3 rounded-[20px] space-y-2"
                style={{
                  backgroundColor: isMacOSStyle
                    ? macosCardBg
                    : hexToRgba(palette.surfaceContainer, isMinimalStyle ? 0.45 : 0.65),
                  border: isMacOSStyle ? macosBorder : undefined,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold" style={{ color: palette.onSurfaceVariant }}>
                    Wallpaper
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenWallpaperPicker();
                    }}
                    className="flex items-center gap-1 text-xs font-medium hover:opacity-80 cursor-pointer"
                    style={{ color: palette.primary }}
                  >
                    <ImageIcon className="w-3 h-3" />
                    <span>All / Upload</span>
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {allWallpapers.slice(0, 4).map((wp) => {
                    const active = config.wallpaperId === wp.id;
                    return (
                      <button
                        key={wp.id}
                        type="button"
                        onClick={() => onSelectWallpaper(wp.id)}
                        title={wp.name}
                        className="h-11 rounded-xl overflow-hidden cursor-pointer"
                        style={{
                          border: active
                            ? `2px solid ${palette.primary}`
                            : `1px solid ${hexToRgba(palette.outlineVariant, 0.4)}`,
                        }}
                      >
                        <img
                          src={wp.src}
                          alt={wp.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Media Player */}
            {config.sidebarShowMedia && (
              <div
                className="flex items-center justify-between gap-3 p-3.5 rounded-[20px]"
                style={{
                  backgroundColor: isMacOSStyle
                    ? macosCardBg
                    : isMinimalStyle
                      ? hexToRgba(palette.surfaceContainer, 0.48)
                      : palette.secondaryContainer,
                  border: isMacOSStyle ? macosBorder : undefined,
                  color:
                    isMacOSStyle || isMinimalStyle
                      ? palette.onSurface
                      : palette.onSecondaryContainer,
                }}
              >
                <div className="min-w-0">
                  <div className="text-[11px] opacity-75 font-medium">
                    {isMacOSStyle ? 'Now Playing' : 'MPRIS · Spotifyd'}
                  </div>
                  <div className="text-sm font-display font-semibold truncate">{media.title}</div>
                  <div className="text-xs opacity-80 truncate">{media.artist}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onSkipTrack(-1)}
                    aria-label="Previous track"
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/10 cursor-pointer"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={onToggleMediaPlay}
                    aria-label={media.isPlaying ? 'Pause' : 'Play'}
                    className="w-9 h-9 flex items-center justify-center rounded-full cursor-pointer"
                    style={{ backgroundColor: palette.primary, color: palette.onPrimary }}
                  >
                    {media.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => onSkipTrack(1)}
                    aria-label="Next track"
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/10 cursor-pointer"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Notifications */}
            {config.sidebarShowNotifications && (
              <div className="flex flex-col gap-2 flex-1 min-h-0">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-semibold" style={{ color: palette.onSurfaceVariant }}>
                    Notifications ({notifications.length})
                  </span>
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={onClearNotifications}
                      className="flex items-center gap-1 text-xs font-medium hover:opacity-80 cursor-pointer"
                      style={{ color: palette.primary }}
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear all
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div
                    className="p-4 rounded-[18px] text-center text-xs"
                    style={{
                      backgroundColor: isMacOSStyle
                        ? macosCardBg
                        : hexToRgba(palette.surfaceContainer, 0.55),
                      border: isMacOSStyle ? macosBorder : undefined,
                      color: palette.onSurfaceVariant,
                    }}
                  >
                    No unread notifications.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className="p-3 rounded-[18px] flex items-start justify-between gap-2"
                        style={{
                          backgroundColor: isMacOSStyle
                            ? macosCardBg
                            : hexToRgba(palette.surfaceContainer, isMinimalStyle ? 0.48 : 0.72),
                          border: isMacOSStyle ? macosBorder : undefined,
                        }}
                      >
                        <div className="min-w-0">
                          <div
                            className="flex items-center gap-1.5 text-[11px]"
                            style={{ color: palette.onSurfaceVariant }}
                          >
                            <span className="font-semibold" style={{ color: palette.primary }}>
                              {n.app}
                            </span>
                            <span>·</span>
                            <span className="font-mono-code">{n.timestamp}</span>
                          </div>
                          <div className="text-xs font-semibold mt-0.5">{n.title}</div>
                          <div className="text-xs mt-0.5 opacity-80 leading-relaxed">{n.body}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onDismissNotification(n.id)}
                          aria-label="Dismiss notification"
                          className="p-1 rounded-full hover:bg-white/10 shrink-0 cursor-pointer"
                          style={{ color: palette.onSurfaceVariant }}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quick Mode Footer inside Mixi Mode */}
            {config.shellMode === 'mixi' && (
              <div className="grid grid-cols-2 gap-2 pt-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateConfig(
                      { mixieAutoHide: !config.mixieAutoHide },
                      `Mixi Auto-Hide: ${!config.mixieAutoHide ? 'ON' : 'OFF'}`
                    )
                  }
                  className="py-2 px-2.5 rounded-2xl text-[11px] font-medium cursor-pointer"
                  style={{
                    backgroundColor: config.mixieAutoHide ? palette.primaryContainer : macosCardBg,
                    color: config.mixieAutoHide ? palette.onPrimaryContainer : palette.onSurface,
                  }}
                >
                  Mixi Auto-Hide: {config.mixieAutoHide ? 'ON' : 'OFF'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onUpdateConfig({ shellMode: 'm3' }, 'Shell Mode: M3 (Bar + Dock)');
                  }}
                  className="py-2 px-2.5 rounded-2xl text-[11px] font-medium cursor-pointer"
                  style={{ backgroundColor: macosCardBg }}
                >
                  Switch to M3 Mode
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
