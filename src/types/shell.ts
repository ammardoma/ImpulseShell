export type M3Scheme = 'tonal_spot' | 'expressive' | 'fidelity' | 'monochrome';

export type ShellPosition = 'top' | 'bottom' | 'left' | 'right';

export type SidebarPosition = 'left' | 'right';

export type SidebarStyle = 'm3' | 'macos' | 'minimal';

export type SidebarAnchor = 'drawer' | 'popover';

export type ShellMode = 'm3' | 'mixi';

export type MixieView = 'idle' | 'tasks' | 'search';

export type MixiePosition =
  | 'top_left'
  | 'top_center'
  | 'top_right'
  | 'left_center'
  | 'right_center'
  | 'bottom_left'
  | 'bottom_center'
  | 'bottom_right';

export type SurfaceMaterialType =
  | 'liquid_glass'
  | 'frosted_glass'
  | 'acrylic_mica'
  | 'solid_m3';

export type WorkspaceIndicatorStyle = 'numbers' | 'dots' | 'roman';

export type DockMode = 'active_only' | 'pinned_and_active';

export type LauncherPosition = 'center' | 'top' | 'bottom';

export type NyxConfigFormat = 'conf' | 'lua' | 'rust';

export type NyxLayoutMode = 'dwindle' | 'scrolling' | 'master';

export type BezierPresetId =
  | 'm3_expressive'
  | 'end4_decel'
  | 'snappy_rust'
  | 'caelestia_spring';

export type KeybindActionId =
  | 'toggle_overview'
  | 'window_switcher'
  | 'toggle_sidebar'
  | 'close_window'
  | 'toggle_floating'
  | 'toggle_fullscreen'
  | 'toggle_group'
  | 'pin_window'
  | 'toggle_special_workspace'
  | 'workspace_prev'
  | 'workspace_next'
  | 'move_window_next_ws'
  | 'open_wallpaper_picker'
  | 'open_clipboard'
  | 'screenshot_region'
  | 'screen_record'
  | 'color_picker'
  | 'open_terminal'
  | 'open_files'
  | 'open_cheatsheet'
  | 'lock_screen';

export interface WindowRule {
  id: string;
  appClass: string;
  defaultWorkspace?: number;
  forceFloating?: boolean;
  pin?: boolean;
  opacityOverride?: number;
  noBlur?: boolean;
}

export interface VirtualDisplay {
  id: string;
  name: string;
  width: number;
  height: number;
  refreshHz: number;
  scale: number;
  enabled: boolean;
  primary?: boolean;
}

export interface KeybindEntry {
  id: KeybindActionId;
  label: string;
  category: 'Shell' | 'Windows' | 'Workspaces' | 'Utilities';
  mod: 'Alt' | 'Ctrl+Alt' | 'Shift+Alt';
  key: string; // e.g. 'Space', 'a', 'c', 'f', 'm', 'p', '`', '[', ']', 's', 'r', 'w', 'v', 'q', 'e', '/', 'l'
  hyprExec: string;
}

export interface ClipboardItem {
  id: string;
  text: string;
  source: string;
  timestamp: string;
  pinned: boolean;
}

export interface BezierPreset {
  id: BezierPresetId;
  name: string;
  description: string;
  hyprBezierName: string;
  points: [number, number, number, number];
  cssCurve: string;
}

export interface WallpaperPreset {
  id: string;
  name: string;
  subtitle: string;
  src: string;
  seedColor: string;
  defaultScheme: M3Scheme;
  isCustom?: boolean;
}

export interface RustModuleConfig {
  id: string;
  crateName: string;
  label: string;
  description: string;
  enabled: boolean;
  essential?: boolean;
  ramMb: number;
  binaryKb: number;
}

export interface ShellConfig {
  wallpaperId: string;
  customWallpapers: WallpaperPreset[];
  seedColor: string;
  useWallpaperSeed: boolean;
  m3Scheme: M3Scheme;
  darkMode: boolean;

  // Nyx Compositor (Smithay + Calloop Rust Engine)
  nyxConfigFormat: NyxConfigFormat;
  nyxLayout: NyxLayoutMode;
  nyxVrr: boolean;
  nyxXwayland: boolean;
  nyxHyprctlCompat: boolean;
  nyxScrollColWidth: number;
  nyxSplitRatio: number;
  nyxGradientBorder: boolean;
  nyxDimInactive: boolean;
  nyxShadows: boolean;
  nyxInfiniteWorkspaces: boolean;
  nyxFollowMouse: boolean;
  nyxPseudotile: boolean;
  displays: VirtualDisplay[];
  windowRules: WindowRule[];

  // Surface Glass & Transparency
  materialType: SurfaceMaterialType;
  transparency: number;

  // Shell Mode: 'm3' (Bar + Dock + Sidebar) or 'mixi' (Cute Blob + Control Center, no Dock)
  shellMode: ShellMode;

  // Myx Bar Layout & Visibility
  showBar: boolean;
  barAutoHide: boolean;
  barPosition: ShellPosition;
  barFloating: boolean;
  barHeight: number;
  barMargin: number;
  barShowLauncher: boolean;
  barShowWorkspaces: boolean;
  barShowWindowTitle: boolean;
  showMediaCapsule: boolean;
  barShowRam: boolean;
  barShowSysTray: boolean;
  barShowClock: boolean;
  barShowLock: boolean;
  workspaceStyle: WorkspaceIndicatorStyle;

  // Myx Dock Layout & Visibility
  showDock: boolean;
  dockAutoHide: boolean;
  dockPosition: ShellPosition;
  dockMode: DockMode;
  dockShowLauncher: boolean;
  dockShowCheatsheet: boolean;
  dockIconSize: number;

  // Customizable Control Sidebar (M3, macOS Bento, or Minimal)
  sidebarStyle: SidebarStyle;
  sidebarAnchor: SidebarAnchor;
  sidebarPosition: SidebarPosition;
  sidebarWidth: number;
  sidebarRadius: number;
  sidebarCompact: boolean;
  sidebarFloating: boolean;
  sidebarShowProfile: boolean;
  sidebarShowQuickTiles: boolean;
  sidebarShowSliders: boolean;
  sidebarShowMedia: boolean;
  sidebarShowWallpaperStrip: boolean;
  sidebarShowNotifications: boolean;

  // Mixie Dynamic Island Morphing Blob
  showMixie: boolean;
  mixiePosition: MixiePosition;
  mixieAutoHide: boolean;
  mixieShowMedia: boolean;
  mixieShowClock: boolean;
  mixieShowWorkspaces: boolean;

  // App Launcher Customization
  launcherPosition: LauncherPosition;
  launcherShowWorkspaces: boolean;
  launcherShowCalculator: boolean;
  launcherShowWallpapers: boolean;
  launcherCompact: boolean;

  // Custom Keybinds
  keybinds: KeybindEntry[];

  // Nyx Geometry & Surfaces
  gapsIn: number;
  gapsOut: number;
  borderSize: number;
  rounding: number;
  blurPasses: number;

  // Animations
  bezierPreset: BezierPresetId;
  animSpeed: number;

  // Quick toggles & Hyprland ecosystem (Hyprsunset, Hypridle)
  wifiEnabled: boolean;
  bluetoothEnabled: boolean;
  nightLightEnabled: boolean;
  nightTempK: number;
  idleLockMinutes: number;
  dndEnabled: boolean;
  caffeineEnabled: boolean;
  volume: number;
  brightness: number;

  // Rust Daemon Modules
  modules: RustModuleConfig[];
}

export type AppWindowId =
  | 'customizer'
  | 'terminal'
  | 'code_export'
  | 'telemetry'
  | 'notes';

export interface DesktopWindow {
  id: AppWindowId;
  title: string;
  appClass: string;
  workspace: number;
  isOpen: boolean;
  isMinimized: boolean;
  isFloating: boolean;
  isMaximized: boolean;
  isTrueFullscreen?: boolean;
  isGrouped?: boolean;
  isPseudo?: boolean;
  isPinned?: boolean;
  isSpecial?: boolean;
  colWidthPct?: number;
  zOrder: number;
}

export interface ShellNotification {
  id: string;
  app: string;
  title: string;
  body: string;
  timestamp: string;
  urgency: 'normal' | 'low' | 'critical';
}

export interface MediaTrack {
  title: string;
  artist: string;
  album: string;
  durationSec: number;
  positionSec: number;
  isPlaying: boolean;
}

export interface M3Palette {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  surface: string;
  surfaceDim: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  error: string;
  onError: string;
}

export interface RicePreset {
  id: string;
  name: string;
  subtitle: string;
  patch: Partial<ShellConfig>;
}
