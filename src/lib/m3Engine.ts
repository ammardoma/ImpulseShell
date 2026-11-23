import {
  BezierPreset,
  ClipboardItem,
  KeybindEntry,
  M3Palette,
  M3Scheme,
  RicePreset,
  RustModuleConfig,
  ShellConfig,
  VirtualDisplay,
  WallpaperPreset,
  WindowRule,
} from '../types/shell';

export const WALLPAPERS: WallpaperPreset[] = [
  {
    id: 'obsidian_waves',
    name: 'Obsidian Silk',
    subtitle: 'Muted sage-teal architectural glass',
    src: '/src/assets/images/wallpaper_m3_obsidian_waves_1795422252417.jpg',
    seedColor: '#76B0AB',
    defaultScheme: 'tonal_spot',
  },
  {
    id: 'caelestia_mist',
    name: 'Caelestia Ridge',
    subtitle: 'Blue-hour alpine indigo mist',
    src: '/src/assets/images/wallpaper_caelestia_mist_1795422254734.jpg',
    seedColor: '#8B9BE6',
    defaultScheme: 'expressive',
  },
  {
    id: 'impulse_dune',
    name: 'Impulse Dusk',
    subtitle: 'Terracotta ridges under twilight slate',
    src: '/src/assets/images/wallpaper_impulse_dune_1795422254811.jpg',
    seedColor: '#DF956B',
    defaultScheme: 'fidelity',
  },
  {
    id: 'nordic_forest',
    name: 'Nordic Canopy',
    subtitle: 'Evergreen spruce in morning fog',
    src: '/src/assets/images/wallpaper_nordic_forest_1795422254842.jpg',
    seedColor: '#6EB48E',
    defaultScheme: 'tonal_spot',
  },
];

export const USER_AVATAR_SRC = '/src/assets/images/avatar_shell_user_1795422255544.jpg';

export const DEFAULT_KEYBINDS: KeybindEntry[] = [
  {
    id: 'toggle_overview',
    label: 'Toggle App Launcher & Overview',
    category: 'Shell',
    mod: 'Alt',
    key: 'Space',
    hyprExec: 'myx-ctl toggle-overview',
  },
  {
    id: 'window_switcher',
    label: 'Interactive Window Switcher HUD',
    category: 'Windows',
    mod: 'Alt',
    key: 'Tab',
    hyprExec: 'myx-ctl window-switcher',
  },
  {
    id: 'toggle_sidebar',
    label: 'Toggle Control Sidebar',
    category: 'Shell',
    mod: 'Alt',
    key: 'a',
    hyprExec: 'myx-ctl toggle-sidebar',
  },
  {
    id: 'close_window',
    label: 'Close Active Window',
    category: 'Windows',
    mod: 'Alt',
    key: 'c',
    hyprExec: 'nyxctl dispatch killactive',
  },
  {
    id: 'toggle_floating',
    label: 'Toggle Floating Window',
    category: 'Windows',
    mod: 'Alt',
    key: 'f',
    hyprExec: 'nyxctl dispatch togglefloating',
  },
  {
    id: 'toggle_fullscreen',
    label: 'Toggle True Fullscreen / Maximize',
    category: 'Windows',
    mod: 'Alt',
    key: 'm',
    hyprExec: 'nyxctl dispatch fullscreen 0',
  },
  {
    id: 'toggle_group',
    label: 'Toggle Tabbed Window Group',
    category: 'Windows',
    mod: 'Alt',
    key: 'g',
    hyprExec: 'nyxctl dispatch togglegroup',
  },
  {
    id: 'pin_window',
    label: 'Pin Window Across Workspaces',
    category: 'Windows',
    mod: 'Alt',
    key: 'p',
    hyprExec: 'nyxctl dispatch pin',
  },
  {
    id: 'toggle_special_workspace',
    label: 'Toggle Special Scratchpad Workspace',
    category: 'Workspaces',
    mod: 'Alt',
    key: '`',
    hyprExec: 'nyxctl dispatch togglespecialworkspace magic',
  },
  {
    id: 'workspace_prev',
    label: 'Previous Workspace',
    category: 'Workspaces',
    mod: 'Alt',
    key: '[',
    hyprExec: 'nyxctl dispatch workspace e-1',
  },
  {
    id: 'workspace_next',
    label: 'Next Workspace',
    category: 'Workspaces',
    mod: 'Alt',
    key: ']',
    hyprExec: 'nyxctl dispatch workspace e+1',
  },
  {
    id: 'move_window_next_ws',
    label: 'Move Window to Next Workspace',
    category: 'Workspaces',
    mod: 'Shift+Alt',
    key: ']',
    hyprExec: 'nyxctl dispatch movetoworkspace +1',
  },
  {
    id: 'open_wallpaper_picker',
    label: 'Open Wallpaper Picker',
    category: 'Utilities',
    mod: 'Alt',
    key: 'w',
    hyprExec: 'myx-ctl wallpaper-picker',
  },
  {
    id: 'open_clipboard',
    label: 'Open Clipboard History',
    category: 'Utilities',
    mod: 'Alt',
    key: 'v',
    hyprExec: 'myx-ctl cliphist',
  },
  {
    id: 'screenshot_region',
    label: 'Region Screenshot Snipper (grim + slurp)',
    category: 'Utilities',
    mod: 'Shift+Alt',
    key: 's',
    hyprExec: 'grim -g "$(slurp)" - | wl-copy',
  },
  {
    id: 'screen_record',
    label: 'Toggle Screen Record (wf-recorder)',
    category: 'Utilities',
    mod: 'Shift+Alt',
    key: 'r',
    hyprExec: 'myx-ctl toggle-record',
  },
  {
    id: 'color_picker',
    label: 'Hyprpicker Screen Color Sampler',
    category: 'Utilities',
    mod: 'Shift+Alt',
    key: 'p',
    hyprExec: 'hyprpicker -a',
  },
  {
    id: 'open_terminal',
    label: 'Open nyx-term (Zsh)',
    category: 'Windows',
    mod: 'Alt',
    key: 'q',
    hyprExec: 'nyx-term',
  },
  {
    id: 'open_files',
    label: 'Open Nyx + Myx Source',
    category: 'Windows',
    mod: 'Alt',
    key: 'e',
    hyprExec: 'nyx-src',
  },
  {
    id: 'open_cheatsheet',
    label: 'Show Keybinds Cheatsheet',
    category: 'Shell',
    mod: 'Alt',
    key: '/',
    hyprExec: 'myx-ctl cheatsheet',
  },
  {
    id: 'lock_screen',
    label: 'Lock Wayland Session',
    category: 'Shell',
    mod: 'Alt',
    key: 'l',
    hyprExec: 'myx-ctl lock',
  },
];

export const DEFAULT_DISPLAYS: VirtualDisplay[] = [
  {
    id: 'edp1',
    name: 'eDP-1',
    width: 2560,
    height: 1600,
    refreshHz: 144,
    scale: 1,
    enabled: true,
    primary: true,
  },
  {
    id: 'dp1',
    name: 'DP-1',
    width: 2560,
    height: 1440,
    refreshHz: 165,
    scale: 1,
    enabled: false,
    primary: false,
  },
];

export const DEFAULT_WINDOW_RULES: WindowRule[] = [
  {
    id: 'rule-notes',
    appClass: 'myx-notes',
    forceFloating: false,
    pin: false,
    opacityOverride: 95,
  },
  {
    id: 'rule-telemetry',
    appClass: 'btop-rs',
    defaultWorkspace: 3,
    forceFloating: false,
  },
];

export const INITIAL_CLIPBOARD: ClipboardItem[] = [
  {
    id: 'clip-1',
    text: 'hyprctl keyword general:layout scrolling',
    source: 'nyx-term (zsh)',
    timestamp: 'Just now',
    pinned: true,
  },
  {
    id: 'clip-2',
    text: 'cargo build --release --workspace',
    source: 'nyx-src',
    timestamp: '2m ago',
    pinned: false,
  },
  {
    id: 'clip-3',
    text: 'config_format = "lua"',
    source: 'nyx.toml',
    timestamp: '5m ago',
    pinned: false,
  },
];

export const BEZIER_PRESETS: BezierPreset[] = [
  {
    id: 'm3_expressive',
    name: 'M3 Expressive',
    description: 'Android 15/16 emphasized decelerate with subtle overshoot',
    hyprBezierName: 'm3Expressive',
    points: [0.05, 0.7, 0.1, 1.0],
    cssCurve: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
  },
  {
    id: 'end4_decel',
    name: 'end-4 Impulse',
    description: 'Classic illogical-impulse ultra-smooth exponential settle',
    hyprBezierName: 'emphasizedDecel',
    points: [0.05, 0.9, 0.1, 1.05],
    cssCurve: 'cubic-bezier(0.05, 0.9, 0.1, 1.05)',
  },
  {
    id: 'caelestia_spring',
    name: 'Caelestia Spring',
    description: 'Fluid spring curve tuned for 144Hz+ Wayland panels',
    hyprBezierName: 'caelestiaSpring',
    points: [0.22, 1.0, 0.36, 1.0],
    cssCurve: 'cubic-bezier(0.22, 1, 0.36, 1)',
  },
  {
    id: 'snappy_rust',
    name: 'Snappy Rust',
    description: 'Tight zero-overshoot tactile curve for fast keyboard tiling',
    hyprBezierName: 'snappyRust',
    points: [0.16, 1.0, 0.3, 1.0],
    cssCurve: 'cubic-bezier(0.16, 1, 0.3, 1)',
  },
];

export const DEFAULT_RUST_MODULES: RustModuleConfig[] = [
  {
    id: 'nyx_compositor',
    crateName: 'nyx-compositor',
    label: 'Nyx Compositor (Smithay)',
    description: 'Pure-Rust Wayland DRM/KMS compositor engine shared with niri',
    enabled: true,
    essential: true,
    ramMb: 21.4,
    binaryKb: 2480,
  },
  {
    id: 'nyx_ipc',
    crateName: 'nyx-ipc (hyprctl)',
    label: 'Nyx hyprctl Socket IPC',
    description: 'Zero-alloc Socket1/Socket2 parser accepting hyprctl syntax',
    enabled: true,
    essential: true,
    ramMb: 1.1,
    binaryKb: 240,
  },
  {
    id: 'core_daemon',
    crateName: 'myx-daemon',
    label: 'Myx Shell Core',
    description: 'Single-threaded async tokio + layer-shell host',
    enabled: true,
    essential: true,
    ramMb: 4.2,
    binaryKb: 980,
  },
  {
    id: 'bar',
    crateName: 'myx-bar',
    label: 'Status Bar & Media Capsule',
    description: 'M3 workspaces, MPRIS media island, system tray & clock',
    enabled: true,
    ramMb: 3.1,
    binaryKb: 620,
  },
  {
    id: 'launcher',
    crateName: 'myx-overview',
    label: 'Overview & App Launcher',
    description: 'Fuzzy XDG desktop search, calculator & workspace grid',
    enabled: true,
    ramMb: 2.3,
    binaryKb: 460,
  },
  {
    id: 'control_center',
    crateName: 'myx-sidebar',
    label: 'Quick Settings & Notifications',
    description: 'D-Bus NetworkManager, BlueZ, PipeWire & M3 notification stack',
    enabled: true,
    ramMb: 2.8,
    binaryKb: 540,
  },
  {
    id: 'osd',
    crateName: 'myx-osd',
    label: 'On-Screen Display',
    description: 'Hardware brightness, volume & layout pill overlay',
    enabled: true,
    ramMb: 1.0,
    binaryKb: 195,
  },
  {
    id: 'dock',
    crateName: 'myx-dock',
    label: 'Active Apps Dock',
    description: 'Adaptive dock tracking live Nyx windows & workspaces',
    enabled: true,
    ramMb: 1.6,
    binaryKb: 290,
  },
  {
    id: 'lockscreen',
    crateName: 'myx-lock',
    label: 'ext-session-lock Screen',
    description: 'Native PAM Wayland lockscreen with M3 clock & media card',
    enabled: true,
    ramMb: 1.2,
    binaryKb: 260,
  },
  {
    id: 'cliphist',
    crateName: 'myx-clip',
    label: 'Clipboard Ring Buffer',
    description: 'Zero-copy wl-clipboard history stored in compressed mmap',
    enabled: true,
    ramMb: 0.9,
    binaryKb: 175,
  },
];

export const DEFAULT_SHELL_CONFIG: ShellConfig = {
  wallpaperId: 'obsidian_waves',
  customWallpapers: [],
  seedColor: '#76B0AB',
  useWallpaperSeed: true,
  m3Scheme: 'tonal_spot',
  darkMode: true,

  // Nyx Compositor
  nyxConfigFormat: 'conf',
  nyxLayout: 'dwindle',
  nyxVrr: true,
  nyxXwayland: false,
  nyxHyprctlCompat: true,
  nyxScrollColWidth: 66,
  nyxSplitRatio: 58,
  nyxGradientBorder: true,
  nyxDimInactive: false,
  nyxShadows: true,
  nyxInfiniteWorkspaces: true,
  nyxFollowMouse: false,
  nyxPseudotile: false,
  displays: DEFAULT_DISPLAYS,
  windowRules: DEFAULT_WINDOW_RULES,

  // Surface Glass & Transparency
  materialType: 'frosted_glass',
  transparency: 26,

  // Active Shell Mode ('m3' = Top Bar + Dock + Sidebar, 'mixi' = Cute Blob + Control Center)
  shellMode: 'm3',

  // Myx Bar Layout & Visibility
  showBar: true,
  barAutoHide: false,
  barPosition: 'top',
  barFloating: true,
  barHeight: 44,
  barMargin: 10,
  barShowLauncher: true,
  barShowWorkspaces: true,
  barShowWindowTitle: true,
  showMediaCapsule: true,
  barShowRam: true,
  barShowSysTray: true,
  barShowClock: true,
  barShowLock: true,
  workspaceStyle: 'numbers',

  // Myx Dock Layout & Visibility
  showDock: true,
  dockAutoHide: false,
  dockPosition: 'bottom',
  dockMode: 'active_only',
  dockShowLauncher: false,
  dockShowCheatsheet: true,
  dockIconSize: 40,

  // Customizable Control Sidebar (M3, macOS Bento, or Minimal)
  sidebarStyle: 'm3',
  sidebarAnchor: 'drawer',
  sidebarPosition: 'right',
  sidebarWidth: 372,
  sidebarRadius: 22,
  sidebarCompact: false,
  sidebarFloating: true,
  sidebarShowProfile: true,
  sidebarShowQuickTiles: true,
  sidebarShowSliders: true,
  sidebarShowMedia: true,
  sidebarShowWallpaperStrip: true,
  sidebarShowNotifications: true,

  // Mixie Dynamic Island Blob
  showMixie: true,
  mixiePosition: 'bottom_right',
  mixieAutoHide: false,
  mixieShowMedia: true,
  mixieShowClock: true,
  mixieShowWorkspaces: true,

  // Launcher Customization
  launcherPosition: 'center',
  launcherShowWorkspaces: true,
  launcherShowCalculator: true,
  launcherShowWallpapers: true,
  launcherCompact: false,

  // Keybinds
  keybinds: DEFAULT_KEYBINDS,

  // Nyx Geometry & Surfaces
  gapsIn: 6,
  gapsOut: 14,
  borderSize: 2,
  rounding: 16,
  blurPasses: 3,

  // Animations
  bezierPreset: 'end4_decel',
  animSpeed: 1.0,

  // Quick toggles & ecosystem
  wifiEnabled: true,
  bluetoothEnabled: true,
  nightLightEnabled: false,
  nightTempK: 4200,
  idleLockMinutes: 0,
  dndEnabled: false,
  caffeineEnabled: false,
  volume: 68,
  brightness: 84,

  modules: DEFAULT_RUST_MODULES,
};

export const RICE_PRESETS: RicePreset[] = [
  {
    id: 'myx_end4',
    name: 'Myx · Illogical Impulse',
    subtitle: 'M3 Mode · Dwindle · Top floating bar · Frosted glass 26%',
    patch: {
      shellMode: 'm3',
      nyxLayout: 'dwindle',
      showBar: true,
      barPosition: 'top',
      barFloating: true,
      barHeight: 44,
      barMargin: 10,
      barShowLauncher: true,
      showDock: true,
      dockPosition: 'bottom',
      dockMode: 'active_only',
      dockShowLauncher: false,
      sidebarPosition: 'right',
      sidebarStyle: 'm3',
      sidebarAnchor: 'drawer',
      materialType: 'frosted_glass',
      transparency: 26,
      rounding: 16,
      gapsIn: 6,
      gapsOut: 14,
      bezierPreset: 'end4_decel',
      workspaceStyle: 'numbers',
      launcherPosition: 'center',
    },
  },
  {
    id: 'myx_caelestia',
    name: 'Myx · Caelestia Rail',
    subtitle: 'Left vertical rail · Mica 34% · Left sidebar',
    patch: {
      nyxLayout: 'dwindle',
      showBar: true,
      barPosition: 'left',
      barFloating: true,
      barMargin: 12,
      barShowLauncher: true,
      showDock: false,
      dockShowLauncher: false,
      sidebarPosition: 'left',
      sidebarStyle: 'm3',
      sidebarAnchor: 'drawer',
      materialType: 'acrylic_mica',
      transparency: 34,
      rounding: 20,
      gapsIn: 7,
      gapsOut: 16,
      bezierPreset: 'caelestia_spring',
      workspaceStyle: 'dots',
      launcherPosition: 'top',
    },
  },
  {
    id: 'myx_niri_liquid',
    name: 'Nyx Infinite Scroll + macOS Sidebar',
    subtitle: 'Infinite horizontal columns · macOS Bento sidebar · Liquid Glass',
    patch: {
      shellMode: 'm3',
      nyxLayout: 'scrolling',
      nyxScrollColWidth: 68,
      nyxGradientBorder: true,
      nyxInfiniteWorkspaces: true,
      showBar: true,
      barPosition: 'top',
      barFloating: true,
      barHeight: 46,
      barMargin: 12,
      barShowLauncher: true,
      showDock: true,
      dockPosition: 'bottom',
      dockMode: 'active_only',
      dockShowLauncher: false,
      sidebarPosition: 'right',
      sidebarStyle: 'macos',
      sidebarAnchor: 'popover',
      materialType: 'liquid_glass',
      transparency: 48,
      rounding: 22,
      gapsIn: 8,
      gapsOut: 16,
      bezierPreset: 'm3_expressive',
      workspaceStyle: 'numbers',
      launcherPosition: 'center',
    },
  },
  {
    id: 'myx_zen_rust',
    name: 'Zen Pure-Rust (Zero Parser)',
    subtitle: 'Master layout · Rust config · Bar hidden · Solid M3',
    patch: {
      nyxConfigFormat: 'rust',
      nyxLayout: 'master',
      showBar: false,
      showDock: true,
      dockPosition: 'left',
      dockMode: 'active_only',
      dockShowLauncher: true,
      materialType: 'solid_m3',
      transparency: 10,
      rounding: 14,
      gapsIn: 5,
      gapsOut: 10,
      bezierPreset: 'snappy_rust',
      launcherPosition: 'bottom',
    },
  },
  {
    id: 'myx_mixie_only',
    name: 'Mixi · Dynamic Blob Mode',
    subtitle: 'Cute Mixi blob + macOS Control Center · No Dock or M3 Bar · Liquid Glass',
    patch: {
      shellMode: 'mixi',
      showMixie: true,
      mixiePosition: 'top_center',
      mixieAutoHide: false,
      sidebarStyle: 'macos',
      sidebarAnchor: 'popover',
      materialType: 'liquid_glass',
      transparency: 40,
      rounding: 22,
      gapsIn: 8,
      gapsOut: 16,
      bezierPreset: 'caelestia_spring',
    },
  },
];

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.padEnd(6, '0').slice(0, 6);
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return [118, 176, 171];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      case bn:
        h = (rn - gn) / d + 4;
        break;
    }
    h /= 6;
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  const hue = ((h % 360) + 360) % 360;
  const sat = clamp(s, 0, 100) / 100;
  const light = clamp(l, 0, 100) / 100;

  const a = sat * Math.min(light, 1 - light);
  const f = (n: number) => {
    const k = (n + hue / 30) % 12;
    const color = light - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function extractDominantHexFromImage(src: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 24;
        canvas.height = 24;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve('#76B0AB');
        ctx.drawImage(img, 0, 0, 24, 24);
        const data = ctx.getImageData(0, 0, 24, 24).data;
        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
          if (lum > 24 && lum < 235) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count++;
          }
        }
        if (count === 0) return resolve('#76B0AB');
        const hex =
          '#' +
          [Math.round(r / count), Math.round(g / count), Math.round(b / count)]
            .map((v) => v.toString(16).padStart(2, '0'))
            .join('');
        resolve(hex);
      } catch {
        resolve('#76B0AB');
      }
    };
    img.onerror = () => resolve('#76B0AB');
    img.src = src;
  });
}

export function generateM3Palette(seedHex: string, scheme: M3Scheme, dark: boolean): M3Palette {
  const [r, g, b] = hexToRgb(seedHex);
  const [rawH, rawS] = rgbToHsl(r, g, b);

  const isMono = scheme === 'monochrome';
  const satBoost =
    scheme === 'expressive' ? 1.25 : scheme === 'fidelity' ? 1.15 : isMono ? 0 : 0.92;
  const baseSat = isMono ? 0 : clamp(Math.max(rawS, 28) * satBoost, 22, 84);
  const neutralSat = isMono ? 0 : scheme === 'expressive' ? 12 : 8;
  const secHue = scheme === 'expressive' ? (rawH + 34) % 360 : (rawH + 14) % 360;
  const terHue = scheme === 'expressive' ? (rawH + 112) % 360 : (rawH + 62) % 360;

  if (dark) {
    return {
      primary: hslToHex(rawH, baseSat, 78),
      onPrimary: hslToHex(rawH, clamp(baseSat + 10, 0, 90), 18),
      primaryContainer: hslToHex(rawH, clamp(baseSat * 0.78, 0, 75), 30),
      onPrimaryContainer: hslToHex(rawH, clamp(baseSat * 0.9, 0, 90), 90),

      secondary: hslToHex(secHue, isMono ? 0 : clamp(baseSat * 0.45, 14, 42), 76),
      onSecondary: hslToHex(secHue, isMono ? 0 : 28, 19),
      secondaryContainer: hslToHex(secHue, isMono ? 0 : clamp(baseSat * 0.4, 12, 34), 28),
      onSecondaryContainer: hslToHex(secHue, isMono ? 0 : 35, 89),

      tertiary: hslToHex(terHue, isMono ? 0 : clamp(baseSat * 0.65, 20, 62), 78),
      onTertiary: hslToHex(terHue, isMono ? 0 : 40, 20),
      tertiaryContainer: hslToHex(terHue, isMono ? 0 : 42, 30),
      onTertiaryContainer: hslToHex(terHue, isMono ? 0 : 52, 90),

      surface: hslToHex(rawH, neutralSat, 7),
      surfaceDim: hslToHex(rawH, neutralSat, 5),
      surfaceContainerLowest: hslToHex(rawH, neutralSat, 4),
      surfaceContainerLow: hslToHex(rawH, neutralSat, 10),
      surfaceContainer: hslToHex(rawH, neutralSat, 13),
      surfaceContainerHigh: hslToHex(rawH, neutralSat, 17),
      surfaceContainerHighest: hslToHex(rawH, neutralSat, 21),

      onSurface: hslToHex(rawH, isMono ? 0 : 10, 91),
      onSurfaceVariant: hslToHex(rawH, isMono ? 0 : 10, 73),
      outline: hslToHex(rawH, isMono ? 0 : 8, 56),
      outlineVariant: hslToHex(rawH, isMono ? 0 : 10, 25),

      error: '#F2B8B5',
      onError: '#601410',
    };
  }

  return {
    primary: hslToHex(rawH, clamp(baseSat * 0.95, 0, 78), 38),
    onPrimary: '#FFFFFF',
    primaryContainer: hslToHex(rawH, clamp(baseSat * 0.85, 0, 82), 89),
    onPrimaryContainer: hslToHex(rawH, clamp(baseSat, 0, 88), 16),

    secondary: hslToHex(secHue, isMono ? 0 : clamp(baseSat * 0.45, 14, 42), 40),
    onSecondary: '#FFFFFF',
    secondaryContainer: hslToHex(secHue, isMono ? 0 : clamp(baseSat * 0.45, 16, 46), 88),
    onSecondaryContainer: hslToHex(secHue, isMono ? 0 : 34, 18),

    tertiary: hslToHex(terHue, isMono ? 0 : clamp(baseSat * 0.65, 20, 58), 40),
    onTertiary: '#FFFFFF',
    tertiaryContainer: hslToHex(terHue, isMono ? 0 : 48, 89),
    onTertiaryContainer: hslToHex(terHue, isMono ? 0 : 46, 17),

    surface: hslToHex(rawH, neutralSat, 97),
    surfaceDim: hslToHex(rawH, neutralSat, 88),
    surfaceContainerLowest: '#FFFFFF',
    surfaceContainerLow: hslToHex(rawH, neutralSat, 95),
    surfaceContainer: hslToHex(rawH, neutralSat, 92),
    surfaceContainerHigh: hslToHex(rawH, neutralSat, 89),
    surfaceContainerHighest: hslToHex(rawH, neutralSat, 85),

    onSurface: hslToHex(rawH, isMono ? 0 : 12, 12),
    onSurfaceVariant: hslToHex(rawH, isMono ? 0 : 10, 32),
    outline: hslToHex(rawH, isMono ? 0 : 8, 48),
    outlineVariant: hslToHex(rawH, isMono ? 0 : 10, 80),

    error: '#B3261E',
    onError: '#FFFFFF',
  };
}

export function hexToRgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getConfigFormatRamOverhead(config: ShellConfig): number {
  if (config.nyxConfigFormat === 'rust') return 0.0;
  if (config.nyxConfigFormat === 'conf') return 0.4;
  return 1.8;
}

export function getTotalRamMb(config: ShellConfig): {
  compositorMb: number;
  shellMb: number;
  totalMb: number;
} {
  let compositorMb = 0;
  let shellMb = 0;

  for (const m of config.modules) {
    if (!m.enabled) continue;
    if (m.id === 'bar' && (config.shellMode !== 'm3' || !config.showBar)) continue;
    if (m.id === 'dock' && (config.shellMode !== 'm3' || !config.showDock)) continue;

    if (m.id.startsWith('nyx_')) {
      compositorMb += m.ramMb;
    } else {
      shellMb += m.ramMb;
    }
  }
  if (config.shellMode === 'mixi') {
    shellMb += 1.4; // lightweight myx-mixi blob widget
  }

  compositorMb += getConfigFormatRamOverhead(config);
  if (config.nyxXwayland) compositorMb += 14.5;

  return {
    compositorMb: Number(compositorMb.toFixed(1)),
    shellMb: Number(shellMb.toFixed(1)),
    totalMb: Number((compositorMb + shellMb).toFixed(1)),
  };
}
