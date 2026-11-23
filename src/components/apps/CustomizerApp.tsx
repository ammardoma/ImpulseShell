import React, { useRef, useState } from 'react';
import {
  Check,
  Cpu,
  Download,
  Image as ImageIcon,
  Keyboard,
  Layers,
  Layout,
  Monitor,
  Palette,
  Pipette,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  SunMoon,
  Terminal,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  BEZIER_PRESETS,
  getConfigFormatRamOverhead,
  getTotalRamMb,
  hexToRgba,
  RICE_PRESETS,
  WALLPAPERS,
} from '../../lib/m3Engine';
import { getSurfaceStyles, SURFACE_MATERIALS } from '../../lib/surfaceMaterial';
import {
  DockMode,
  LauncherPosition,
  M3Palette,
  M3Scheme,
  MixiePosition,
  NyxConfigFormat,
  NyxLayoutMode,
  RicePreset,
  ShellConfig,
  ShellPosition,
  SidebarAnchor,
  SidebarPosition,
  SidebarStyle,
  WorkspaceIndicatorStyle,
} from '../../types/shell';

interface CustomizerAppProps {
  config: ShellConfig;
  palette: M3Palette;
  onUpdateConfig: (patch: Partial<ShellConfig>, osdLabel?: string) => void;
  onSelectWallpaper: (id: string) => void;
  onToggleModule: (id: string) => void;
  onApplyPreset: (preset: RicePreset) => void;
  onResetDefaults: () => void;
  onOpenCodeExport: () => void;
  onOpenWallpaperPicker?: () => void;
  onOpenKeybinds?: () => void;
  onOpenColorPicker?: () => void;
}

type CustomizerTab = 'theme' | 'glass' | 'bar_dock' | 'nyx' | 'launcher' | 'rust';

const M3_SCHEMES: { id: M3Scheme; label: string; desc: string }[] = [
  { id: 'tonal_spot', label: 'Tonal Spot', desc: 'Balanced Android Material You default' },
  { id: 'expressive', label: 'Expressive', desc: 'Higher chroma & tertiary hue shift' },
  { id: 'fidelity', label: 'Fidelity', desc: 'True to wallpaper seed saturation' },
  { id: 'monochrome', label: 'Monochrome', desc: 'Pure grayscale neutral surfaces' },
];

const POSITIONS: { id: ShellPosition; label: string }[] = [
  { id: 'top', label: 'Top' },
  { id: 'bottom', label: 'Bottom' },
  { id: 'left', label: 'Left' },
  { id: 'right', label: 'Right' },
];

const CONFIG_FORMATS: {
  id: NyxConfigFormat;
  label: string;
  file: string;
  overhead: string;
  desc: string;
}[] = [
  {
    id: 'conf',
    label: 'Hyprland .conf',
    file: '~/.config/nyx/nyx.conf',
    overhead: '+0.4 MB',
    desc: 'Drop-in Hyprland syntax with keyword & bind blocks',
  },
  {
    id: 'lua',
    label: 'LuaJIT (mlua)',
    file: '~/.config/nyx/init.lua',
    overhead: '+1.8 MB',
    desc: 'Scriptable nyx.setup({ ... }) API with callbacks',
  },
  {
    id: 'rust',
    label: 'Pure Rust',
    file: 'crates/nyx-config/src/user_config.rs',
    overhead: '+0.0 MB',
    desc: 'Zero-parser compiled Rust struct for lowest RAM',
  },
];

const NYX_LAYOUTS: { id: NyxLayoutMode; label: string; desc: string }[] = [
  {
    id: 'dwindle',
    label: 'Dwindle (Hyprland)',
    desc: 'Binary space-partitioned tiling grid',
  },
  {
    id: 'scrolling',
    label: 'Scrolling (Niri)',
    desc: 'Infinite horizontal strip of full-height columns',
  },
  {
    id: 'master',
    label: 'Master-Stack (Mango)',
    desc: 'Primary master pane with vertical stack column',
  },
];

const ToggleRow: React.FC<{
  label: string;
  desc?: string;
  value: boolean;
  palette: M3Palette;
  onToggle: () => void;
}> = ({ label, desc, value, palette, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer"
    style={{
      backgroundColor: value ? palette.secondaryContainer : palette.surfaceContainerHigh,
      color: value ? palette.onSecondaryContainer : palette.onSurface,
    }}
  >
    <div className="min-w-0">
      <div className="text-xs font-semibold truncate">{label}</div>
      {desc && <div className="text-[11px] opacity-75 truncate">{desc}</div>}
    </div>
    <span
      className="text-[11px] font-mono-code font-semibold px-2 py-0.5 rounded-full shrink-0"
      style={{
        backgroundColor: value ? palette.primary : palette.surfaceContainerHighest,
        color: value ? palette.onPrimary : palette.onSurfaceVariant,
      }}
    >
      {value ? 'ON' : 'OFF'}
    </span>
  </button>
);

export const CustomizerApp: React.FC<CustomizerAppProps> = ({
  config,
  palette,
  onUpdateConfig,
  onSelectWallpaper,
  onToggleModule,
  onApplyPreset,
  onResetDefaults,
  onOpenCodeExport,
  onOpenWallpaperPicker,
  onOpenKeybinds,
  onOpenColorPicker,
}) => {
  const [tab, setTab] = useState<CustomizerTab>('nyx');
  const [keybindQuery, setKeybindQuery] = useState('');
  const [newRuleClass, setNewRuleClass] = useState('myx-notes');
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const ram = getTotalRamMb(config);
  const cfgOverhead = getConfigFormatRamOverhead(config);
  const allWallpapers = [...WALLPAPERS, ...config.customWallpapers];
  const currentWp = allWallpapers.find((w) => w.id === config.wallpaperId) ?? WALLPAPERS[0];

  const tabs: { id: CustomizerTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'nyx', label: 'Nyx Engine', icon: Terminal },
    { id: 'theme', label: 'Myx Theme', icon: Palette },
    { id: 'glass', label: 'Glass & Blur', icon: Layers },
    { id: 'bar_dock', label: 'Shell Mode & Panels', icon: Layout },
    { id: 'launcher', label: 'Launcher & Keys', icon: Search },
    { id: 'rust', label: 'RAM & Crates', icon: Cpu },
  ];

  return (
    <div className="flex flex-col h-full min-h-0" style={{ color: palette.onSurface }}>
      {/* Top Navigation */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b shrink-0"
        style={{ borderColor: hexToRgba(palette.outlineVariant, 0.45) }}
      >
        <div
          className="flex items-center gap-1 p-1 rounded-xl overflow-x-auto"
          style={{ backgroundColor: hexToRgba(palette.surfaceContainer, 0.7) }}
        >
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                style={{
                  backgroundColor: active ? palette.primaryContainer : 'transparent',
                  color: active ? palette.onPrimaryContainer : palette.onSurfaceVariant,
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onResetDefaults}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap hover:opacity-85 cursor-pointer"
            style={{
              backgroundColor: palette.surfaceContainerHigh,
              color: palette.onSurfaceVariant,
            }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={onOpenCodeExport}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-transform active:scale-95 cursor-pointer"
            style={{ backgroundColor: palette.primary, color: palette.onPrimary }}
          >
            Inspect Nyx + Myx Source
          </button>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {tab === 'nyx' && (
          <>
            {/* Config Language Selector in nyx.toml */}
            <section className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-display font-semibold">
                    Nyx Compositor Config Language (`nyx.toml`)
                  </h3>
                  <p className="text-xs" style={{ color: palette.onSurfaceVariant }}>
                    Choose whether Nyx reads `.conf` (Hyprland syntax), `init.lua` (LuaJIT), or zero-overhead compiled Rust
                  </p>
                </div>
                <span className="text-xs font-mono-code tabular-nums shrink-0" style={{ color: palette.primary }}>
                  +{cfgOverhead.toFixed(1)} MB parser
                </span>
              </div>

              <div className="grid sm:grid-cols-3 gap-2.5">
                {CONFIG_FORMATS.map((fmt) => {
                  const active = config.nyxConfigFormat === fmt.id;
                  return (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() =>
                        onUpdateConfig(
                          { nyxConfigFormat: fmt.id },
                          `nyx.toml -> config_format = "${fmt.id}"`
                        )
                      }
                      className="p-3 rounded-xl text-left transition-all cursor-pointer"
                      style={{
                        backgroundColor: active
                          ? palette.primaryContainer
                          : palette.surfaceContainerHigh,
                        color: active ? palette.onPrimaryContainer : palette.onSurface,
                        border: active
                          ? `1.5px solid ${palette.primary}`
                          : `1px solid ${hexToRgba(palette.outlineVariant, 0.35)}`,
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold">{fmt.label}</span>
                        <span className="text-[11px] font-mono-code tabular-nums opacity-80">
                          {fmt.overhead}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono-code opacity-75 mt-1 truncate">
                        {fmt.file}
                      </div>
                      <div className="text-[11px] opacity-80 mt-1">{fmt.desc}</div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Smithay + Calloop Layout Engine */}
            <section className="space-y-2.5">
              <div>
                <h3 className="text-sm font-display font-semibold">
                  Nyx Tiling Layout Engine (Smithay + Calloop)
                </h3>
                <p className="text-xs" style={{ color: palette.onSurfaceVariant }}>
                  Switch live between Hyprland Dwindle, Niri-style Scrolling Columns, or Mango Master-Stack
                </p>
              </div>
              <div className="grid sm:grid-cols-3 gap-2.5">
                {NYX_LAYOUTS.map((l) => {
                  const active = config.nyxLayout === l.id;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() =>
                        onUpdateConfig({ nyxLayout: l.id }, `Nyx Layout: ${l.label}`)
                      }
                      className="p-3 rounded-xl text-left transition-all cursor-pointer"
                      style={{
                        backgroundColor: active
                          ? palette.primaryContainer
                          : palette.surfaceContainerHigh,
                        color: active ? palette.onPrimaryContainer : palette.onSurface,
                      }}
                    >
                      <div className="text-xs font-semibold">{l.label}</div>
                      <div className="text-[11px] opacity-80 mt-1">{l.desc}</div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* IPC, Tiling & Hyprland-Class Compositor Features */}
            <section
              className="p-4 rounded-2xl space-y-3.5"
              style={{ backgroundColor: palette.surfaceContainer }}
            >
              <div>
                <h3 className="text-sm font-display font-semibold">
                  Hyprland-Class DE &amp; Infinite Scrolling Controls
                </h3>
                <p className="text-xs" style={{ color: palette.onSurfaceVariant }}>
                  Tune infinite horizontal column width, Dwindle/Master split ratio, gradient borders, inactive dimming, and dynamic workspaces
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <label
                  className="flex flex-col justify-center gap-1 px-3 py-2.5 rounded-xl"
                  style={{ backgroundColor: palette.surfaceContainerHigh }}
                >
                  <div className="flex justify-between text-xs">
                    <span>Scrolling Column Width</span>
                    <span className="font-mono-code tabular-nums" style={{ color: palette.primary }}>
                      {config.nyxScrollColWidth}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={38}
                    max={100}
                    step={2}
                    value={config.nyxScrollColWidth}
                    onChange={(e) =>
                      onUpdateConfig({ nyxScrollColWidth: Number(e.target.value) })
                    }
                    className="w-full accent-current cursor-pointer"
                    style={{ color: palette.primary }}
                  />
                </label>

                <label
                  className="flex flex-col justify-center gap-1 px-3 py-2.5 rounded-xl"
                  style={{ backgroundColor: palette.surfaceContainerHigh }}
                >
                  <div className="flex justify-between text-xs">
                    <span>Dwindle / Master Split Ratio</span>
                    <span className="font-mono-code tabular-nums" style={{ color: palette.primary }}>
                      {config.nyxSplitRatio}% / {100 - config.nyxSplitRatio}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={35}
                    max={75}
                    step={1}
                    value={config.nyxSplitRatio}
                    onChange={(e) =>
                      onUpdateConfig({ nyxSplitRatio: Number(e.target.value) })
                    }
                    className="w-full accent-current cursor-pointer"
                    style={{ color: palette.primary }}
                  />
                </label>
              </div>

              <div className="grid sm:grid-cols-3 gap-2.5">
                <ToggleRow
                  palette={palette}
                  label="Gradient Active Border"
                  desc="45° primary-tertiary rim"
                  value={config.nyxGradientBorder}
                  onToggle={() =>
                    onUpdateConfig({ nyxGradientBorder: !config.nyxGradientBorder })
                  }
                />
                <ToggleRow
                  palette={palette}
                  label="Dim Inactive Windows"
                  desc="Subtle focus separation"
                  value={config.nyxDimInactive}
                  onToggle={() =>
                    onUpdateConfig({ nyxDimInactive: !config.nyxDimInactive })
                  }
                />
                <ToggleRow
                  palette={palette}
                  label="Window Drop Shadows"
                  desc="Soft elevation depth"
                  value={config.nyxShadows}
                  onToggle={() => onUpdateConfig({ nyxShadows: !config.nyxShadows })}
                />
                <ToggleRow
                  palette={palette}
                  label="Infinite Workspaces"
                  desc="Dynamic workspaces past 5"
                  value={config.nyxInfiniteWorkspaces}
                  onToggle={() =>
                    onUpdateConfig({
                      nyxInfiniteWorkspaces: !config.nyxInfiniteWorkspaces,
                    })
                  }
                />
                <ToggleRow
                  palette={palette}
                  label="hyprctl IPC Compat"
                  desc="Socket1/Socket2 syntax"
                  value={config.nyxHyprctlCompat}
                  onToggle={() =>
                    onUpdateConfig({ nyxHyprctlCompat: !config.nyxHyprctlCompat })
                  }
                />
                <ToggleRow
                  palette={palette}
                  label="Focus Follows Mouse"
                  desc="input:follow_mouse = 1"
                  value={config.nyxFollowMouse}
                  onToggle={() => onUpdateConfig({ nyxFollowMouse: !config.nyxFollowMouse })}
                />
                <ToggleRow
                  palette={palette}
                  label="Pseudotile Support"
                  desc="dwindle:pseudotile"
                  value={config.nyxPseudotile}
                  onToggle={() => onUpdateConfig({ nyxPseudotile: !config.nyxPseudotile })}
                />
                <ToggleRow
                  palette={palette}
                  label="Adaptive Sync (VRR)"
                  desc="144Hz DRM/KMS flip"
                  value={config.nyxVrr}
                  onToggle={() => onUpdateConfig({ nyxVrr: !config.nyxVrr })}
                />
                <ToggleRow
                  palette={palette}
                  label="XWayland Satellite"
                  desc="+14.5 MB when enabled"
                  value={config.nyxXwayland}
                  onToggle={() => onUpdateConfig({ nyxXwayland: !config.nyxXwayland })}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3 pt-1">
                <label
                  className="flex flex-col justify-center gap-1 px-3 py-2.5 rounded-xl"
                  style={{ backgroundColor: palette.surfaceContainerHigh }}
                >
                  <div className="flex justify-between text-xs">
                    <span>Hyprsunset Warmth</span>
                    <span className="font-mono-code tabular-nums" style={{ color: palette.primary }}>
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
                      onUpdateConfig({ nightTempK: Number(e.target.value), nightLightEnabled: true })
                    }
                    className="w-full accent-current cursor-pointer"
                    style={{ color: palette.primary }}
                  />
                </label>

                <label
                  className="flex flex-col justify-center gap-1 px-3 py-2.5 rounded-xl"
                  style={{ backgroundColor: palette.surfaceContainerHigh }}
                >
                  <div className="flex justify-between text-xs">
                    <span>Hypridle Auto-Lock</span>
                    <span className="font-mono-code tabular-nums" style={{ color: palette.primary }}>
                      {config.idleLockMinutes === 0 ? 'Disabled' : `${config.idleLockMinutes} min`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={15}
                    step={1}
                    value={config.idleLockMinutes}
                    onChange={(e) => onUpdateConfig({ idleLockMinutes: Number(e.target.value) })}
                    className="w-full accent-current cursor-pointer"
                    style={{ color: palette.primary }}
                  />
                </label>
              </div>
            </section>

            {/* Virtual Outputs / Monitors & Fractional Scaling */}
            <section
              className="p-4 rounded-2xl space-y-3"
              style={{ backgroundColor: palette.surfaceContainer }}
            >
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4" style={{ color: palette.primary }} />
                <div>
                  <h3 className="text-sm font-display font-semibold">
                    Displays, Refresh Rate &amp; Fractional Scaling (`monitor =`)
                  </h3>
                  <p className="text-xs" style={{ color: palette.onSurfaceVariant }}>
                    Outputs sync directly to `nyx.conf`, `init.lua`, and `hyprctl -j monitors`
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-2.5">
                {config.displays.map((disp) => (
                  <div
                    key={disp.id}
                    className="p-3 rounded-xl space-y-2.5"
                    style={{
                      backgroundColor: palette.surfaceContainerHigh,
                      border: disp.enabled
                        ? `1px solid ${hexToRgba(palette.primary, 0.45)}`
                        : `1px solid ${hexToRgba(palette.outlineVariant, 0.3)}`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold font-mono-code">{disp.name}</div>
                        <div className="text-[11px] opacity-75">
                          {disp.width}×{disp.height} @ {disp.refreshHz}Hz · {disp.scale.toFixed(2)}x
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={disp.primary}
                        onClick={() =>
                          onUpdateConfig({
                            displays: config.displays.map((d) =>
                              d.id === disp.id ? { ...d, enabled: !d.enabled } : d
                            ),
                          })
                        }
                        className="px-2.5 py-1 rounded-full text-[11px] font-mono-code font-semibold cursor-pointer disabled:opacity-60"
                        style={{
                          backgroundColor: disp.enabled ? palette.primary : palette.surfaceContainerHighest,
                          color: disp.enabled ? palette.onPrimary : palette.onSurfaceVariant,
                        }}
                      >
                        {disp.primary ? 'PRIMARY' : disp.enabled ? 'ENABLED' : 'DISABLED'}
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {[60, 120, 144, 165].map((hz) => (
                        <button
                          key={hz}
                          type="button"
                          onClick={() =>
                            onUpdateConfig({
                              displays: config.displays.map((d) =>
                                d.id === disp.id ? { ...d, refreshHz: hz } : d
                              ),
                            })
                          }
                          className="px-2 py-0.5 rounded-lg text-[10px] font-mono-code cursor-pointer"
                          style={{
                            backgroundColor:
                              disp.refreshHz === hz ? palette.primaryContainer : palette.surfaceContainer,
                            color:
                              disp.refreshHz === hz ? palette.onPrimaryContainer : palette.onSurfaceVariant,
                          }}
                        >
                          {hz}Hz
                        </button>
                      ))}
                      <span className="mx-1 opacity-30">|</span>
                      {[1, 1.25, 1.5].map((sc) => (
                        <button
                          key={sc}
                          type="button"
                          onClick={() =>
                            onUpdateConfig({
                              displays: config.displays.map((d) =>
                                d.id === disp.id ? { ...d, scale: sc } : d
                              ),
                            })
                          }
                          className="px-2 py-0.5 rounded-lg text-[10px] font-mono-code cursor-pointer"
                          style={{
                            backgroundColor:
                              disp.scale === sc ? palette.secondaryContainer : palette.surfaceContainer,
                            color:
                              disp.scale === sc ? palette.onSecondaryContainer : palette.onSurfaceVariant,
                          }}
                        >
                          {sc}x
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Per-App Window Rules (windowrulev2) */}
            <section
              className="p-4 rounded-2xl space-y-3"
              style={{ backgroundColor: palette.surfaceContainer }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-display font-semibold">
                    Window Rules (`windowrulev2`)
                  </h3>
                  <p className="text-xs" style={{ color: palette.onSurfaceVariant }}>
                    Auto-float, pin, assign default workspace, or override opacity/blur per app class
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <select
                    value={newRuleClass}
                    onChange={(e) => setNewRuleClass(e.target.value)}
                    aria-label="App class for new rule"
                    className="px-2.5 py-1 rounded-lg text-xs font-mono-code outline-none cursor-pointer"
                    style={{
                      backgroundColor: palette.surfaceContainerHigh,
                      color: palette.onSurface,
                    }}
                  >
                    <option value="myx-ctl">myx-ctl</option>
                    <option value="nyx-term">nyx-term</option>
                    <option value="nyx-src">nyx-src</option>
                    <option value="myx-notes">myx-notes</option>
                    <option value="btop-rs">btop-rs</option>
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateConfig({
                        windowRules: [
                          ...config.windowRules,
                          {
                            id: `rule-${Date.now()}`,
                            appClass: newRuleClass,
                            forceFloating: true,
                            opacityOverride: 92,
                          },
                        ],
                      })
                    }
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer"
                    style={{ backgroundColor: palette.primary, color: palette.onPrimary }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Rule</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {config.windowRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs"
                    style={{ backgroundColor: palette.surfaceContainerHigh }}
                  >
                    <span className="font-mono-code font-semibold">{rule.appClass}</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateConfig({
                            windowRules: config.windowRules.map((r) =>
                              r.id === rule.id ? { ...r, forceFloating: !r.forceFloating } : r
                            ),
                          })
                        }
                        className="px-2 py-0.5 rounded-md font-mono-code text-[11px] cursor-pointer"
                        style={{
                          backgroundColor: rule.forceFloating ? palette.primaryContainer : palette.surfaceContainer,
                          color: rule.forceFloating ? palette.onPrimaryContainer : palette.onSurfaceVariant,
                        }}
                      >
                        float
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateConfig({
                            windowRules: config.windowRules.map((r) =>
                              r.id === rule.id ? { ...r, pin: !r.pin } : r
                            ),
                          })
                        }
                        className="px-2 py-0.5 rounded-md font-mono-code text-[11px] cursor-pointer"
                        style={{
                          backgroundColor: rule.pin ? palette.primaryContainer : palette.surfaceContainer,
                          color: rule.pin ? palette.onPrimaryContainer : palette.onSurfaceVariant,
                        }}
                      >
                        pin
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateConfig({
                            windowRules: config.windowRules.map((r) =>
                              r.id === rule.id ? { ...r, noBlur: !r.noBlur } : r
                            ),
                          })
                        }
                        className="px-2 py-0.5 rounded-md font-mono-code text-[11px] cursor-pointer"
                        style={{
                          backgroundColor: rule.noBlur ? palette.primaryContainer : palette.surfaceContainer,
                          color: rule.noBlur ? palette.onPrimaryContainer : palette.onSurfaceVariant,
                        }}
                      >
                        noblur
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateConfig({
                            windowRules: config.windowRules.map((r) =>
                              r.id === rule.id
                                ? {
                                    ...r,
                                    opacityOverride:
                                      r.opacityOverride === undefined
                                        ? 90
                                        : r.opacityOverride === 90
                                          ? 80
                                          : undefined,
                                  }
                                : r
                            ),
                          })
                        }
                        className="px-2 py-0.5 rounded-md font-mono-code text-[11px] cursor-pointer"
                        style={{
                          backgroundColor:
                            rule.opacityOverride !== undefined
                              ? palette.secondaryContainer
                              : palette.surfaceContainer,
                          color:
                            rule.opacityOverride !== undefined
                              ? palette.onSecondaryContainer
                              : palette.onSurfaceVariant,
                        }}
                      >
                        {rule.opacityOverride !== undefined ? `opacity ${rule.opacityOverride}%` : 'opacity auto'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateConfig({
                            windowRules: config.windowRules.filter((r) => r.id !== rule.id),
                          })
                        }
                        aria-label="Delete rule"
                        className="p-1 rounded-md hover:opacity-80 cursor-pointer"
                        style={{ color: palette.error }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {tab === 'theme' && (
          <>
            <section className="space-y-2.5">
              <div>
                <h3 className="text-sm font-display font-semibold">One-Click Myx Rice Profiles</h3>
                <p className="text-xs" style={{ color: palette.onSurfaceVariant }}>
                  Apply a preset across Nyx + Myx, then customize any detail
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {RICE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onApplyPreset(preset)}
                    className="p-3 rounded-xl text-left transition-all hover:opacity-95 active:scale-[0.99] cursor-pointer"
                    style={{
                      backgroundColor: palette.surfaceContainerHigh,
                      border: `1px solid ${hexToRgba(palette.outlineVariant, 0.45)}`,
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold">{preset.name}</span>
                      <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: palette.primary }} />
                    </div>
                    <div className="text-[11px] mt-1" style={{ color: palette.onSurfaceVariant }}>
                      {preset.subtitle}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-display font-semibold">Wallpaper & M3 Extraction</h3>
                  <p className="text-xs" style={{ color: palette.onSurfaceVariant }}>
                    Derives Material You tonal palette automatically
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {onOpenWallpaperPicker && (
                    <button
                      type="button"
                      onClick={onOpenWallpaperPicker}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer"
                      style={{
                        backgroundColor: palette.primaryContainer,
                        color: palette.onPrimaryContainer,
                      }}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Wallpaper Picker</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onUpdateConfig({ darkMode: !config.darkMode })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer"
                    style={{
                      backgroundColor: palette.secondaryContainer,
                      color: palette.onSecondaryContainer,
                    }}
                  >
                    <SunMoon className="w-3.5 h-3.5" />
                    <span>{config.darkMode ? 'Dark Mode' : 'Light Mode'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {allWallpapers.map((wp) => {
                  const selected = config.wallpaperId === wp.id;
                  return (
                    <button
                      key={wp.id}
                      type="button"
                      onClick={() => onSelectWallpaper(wp.id)}
                      className="group relative flex flex-col overflow-hidden text-left transition-all cursor-pointer"
                      style={{
                        borderRadius: 14,
                        border: selected
                          ? `2px solid ${palette.primary}`
                          : `1px solid ${hexToRgba(palette.outlineVariant, 0.5)}`,
                        backgroundColor: palette.surfaceContainer,
                      }}
                    >
                      <div className="relative h-20 w-full overflow-hidden">
                        <img
                          src={wp.src}
                          alt={wp.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {selected && (
                          <span
                            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: palette.primary, color: palette.onPrimary }}
                          >
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <div className="p-2">
                        <div className="text-xs font-semibold truncate">{wp.name}</div>
                        <div className="text-[11px] font-mono-code truncate" style={{ color: palette.onSurfaceVariant }}>
                          {wp.seedColor}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="grid sm:grid-cols-2 gap-4">
              <div className="grid grid-cols-2 gap-2">
                {M3_SCHEMES.map((s) => {
                  const active = config.m3Scheme === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => onUpdateConfig({ m3Scheme: s.id })}
                      className="p-2.5 rounded-xl text-left transition-colors cursor-pointer"
                      style={{
                        backgroundColor: active
                          ? palette.primaryContainer
                          : palette.surfaceContainerHigh,
                        color: active ? palette.onPrimaryContainer : palette.onSurface,
                      }}
                    >
                      <div className="text-xs font-semibold">{s.label}</div>
                      <div className="text-[11px] opacity-75 mt-0.5 line-clamp-2">{s.desc}</div>
                    </button>
                  );
                })}
              </div>

              <div
                className="p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3"
                style={{ backgroundColor: palette.surfaceContainerHigh }}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    aria-label="Custom M3 Seed Color"
                    value={config.seedColor}
                    onChange={(e) =>
                      onUpdateConfig({ seedColor: e.target.value, useWallpaperSeed: false })
                    }
                    className="w-9 h-9 rounded-lg border-0 bg-transparent cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-semibold">Custom Seed Color</div>
                    <div className="text-[11px] font-mono-code" style={{ color: palette.onSurfaceVariant }}>
                      {config.seedColor.toUpperCase()} · {config.useWallpaperSeed ? 'Wallpaper' : 'Custom'}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {onOpenColorPicker && (
                    <button
                      type="button"
                      onClick={onOpenColorPicker}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                      style={{
                        backgroundColor: palette.primaryContainer,
                        color: palette.onPrimaryContainer,
                      }}
                    >
                      <Pipette className="w-3.5 h-3.5" />
                      <span>Hyprpicker</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(config, null, 2)], {
                        type: 'application/json',
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'myx-nyx-profile.json';
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      URL.revokeObjectURL(url);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                    style={{
                      backgroundColor: palette.surfaceContainer,
                      color: palette.onSurface,
                    }}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export JSON</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => importInputRef.current?.click()}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                    style={{
                      backgroundColor: palette.surfaceContainer,
                      color: palette.onSurface,
                    }}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import JSON</span>
                  </button>
                  <input
                    ref={importInputRef}
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        try {
                          const parsed = JSON.parse(String(reader.result)) as Partial<ShellConfig>;
                          onUpdateConfig(parsed, 'Imported Myx + Nyx JSON profile');
                        } catch {
                          // Ignore malformed JSON gracefully
                        }
                      };
                      reader.readAsText(file);
                      e.target.value = '';
                    }}
                  />
                </div>
              </div>
            </section>
          </>
        )}

        {tab === 'glass' && (
          <>
            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-display font-semibold">
                  Glass Material & Optical Finish
                </h3>
                <p className="text-xs" style={{ color: palette.onSurfaceVariant }}>
                  Liquid Glass, Frosted Glass, Mica Tinted, and Solid M3 compute distinct blur, grain, and rim lighting
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {SURFACE_MATERIALS.map((mat) => {
                  const active = config.materialType === mat.id;
                  const previewStyle = getSurfaceStyles(
                    mat.id,
                    config.transparency,
                    palette,
                    config.darkMode,
                    { elevation: 'window', blurPasses: config.blurPasses }
                  );
                  return (
                    <button
                      key={mat.id}
                      type="button"
                      onClick={() =>
                        onUpdateConfig({ materialType: mat.id }, `Material: ${mat.name}`)
                      }
                      className="relative overflow-hidden rounded-2xl text-left transition-all cursor-pointer p-2.5"
                      style={{
                        border: active
                          ? `2px solid ${palette.primary}`
                          : `1px solid ${hexToRgba(palette.outlineVariant, 0.45)}`,
                        backgroundColor: palette.surfaceContainer,
                      }}
                    >
                      <div className="relative h-20 rounded-xl overflow-hidden p-2.5 flex items-end">
                        <img
                          src={currentWp.src}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div
                          className="relative z-10 w-full px-3 py-2 rounded-xl flex items-center justify-between"
                          style={previewStyle}
                        >
                          <span className="text-xs font-semibold">{mat.name}</span>
                          <span className="text-[11px] font-mono-code tabular-nums opacity-85">
                            {config.transparency}%
                          </span>
                        </div>
                      </div>
                      <div className="pt-2 px-1">
                        <div className="text-xs font-semibold">{mat.tagline}</div>
                        <div className="text-[11px] mt-0.5 opacity-75">{mat.detail}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section
              className="p-4 rounded-2xl space-y-3.5"
              style={{ backgroundColor: palette.surfaceContainer }}
            >
              <label className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold">Surface Transparency Level</span>
                  <span className="font-mono-code tabular-nums font-semibold" style={{ color: palette.primary }}>
                    {config.transparency}% transparent
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={85}
                  step={1}
                  value={config.transparency}
                  onChange={(e) =>
                    onUpdateConfig(
                      { transparency: Number(e.target.value) },
                      `Transparency ${e.target.value}%`
                    )
                  }
                  className="w-full accent-current cursor-pointer"
                  style={{ color: palette.primary }}
                />
              </label>

              <div className="grid sm:grid-cols-3 gap-4 pt-1">
                <label className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>Corner Radius</span>
                    <span className="font-mono-code tabular-nums" style={{ color: palette.primary }}>
                      {config.rounding}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={28}
                    value={config.rounding}
                    onChange={(e) => onUpdateConfig({ rounding: Number(e.target.value) })}
                    className="w-full accent-current cursor-pointer"
                    style={{ color: palette.primary }}
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>Border Width</span>
                    <span className="font-mono-code tabular-nums" style={{ color: palette.primary }}>
                      {config.borderSize}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={4}
                    value={config.borderSize}
                    onChange={(e) => onUpdateConfig({ borderSize: Number(e.target.value) })}
                    className="w-full accent-current cursor-pointer"
                    style={{ color: palette.primary }}
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>Blur Passes</span>
                    <span className="font-mono-code tabular-nums" style={{ color: palette.primary }}>
                      {config.blurPasses}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={4}
                    value={config.blurPasses}
                    onChange={(e) => onUpdateConfig({ blurPasses: Number(e.target.value) })}
                    className="w-full accent-current cursor-pointer"
                    style={{ color: palette.primary }}
                  />
                </label>
              </div>
            </section>
          </>
        )}

        {tab === 'bar_dock' && (
          <>
            {/* Two-Mode Switcher: M3 Mode vs Mixi Mode */}
            <section
              className="p-4 rounded-2xl space-y-3.5"
              style={{ backgroundColor: palette.surfaceContainer }}
            >
              <div>
                <h3 className="text-sm font-display font-semibold">Shell Mode</h3>
                <p className="text-xs" style={{ color: palette.onSurfaceVariant }}>
                  Switch between Android M3 (Top Bar + Dock + M3 Sidebar) or Mixi (Cute Blob + Apple Control Center, no Dock)
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateConfig(
                      { shellMode: 'm3', showBar: true, showDock: true },
                      'Shell Mode: M3 (Top Bar + Dock)'
                    )
                  }
                  className="p-3.5 rounded-2xl text-left transition-all cursor-pointer"
                  style={{
                    backgroundColor:
                      config.shellMode === 'm3'
                        ? palette.primaryContainer
                        : palette.surfaceContainerHigh,
                    color:
                      config.shellMode === 'm3'
                        ? palette.onPrimaryContainer
                        : palette.onSurface,
                    border:
                      config.shellMode === 'm3'
                        ? `1.5px solid ${palette.primary}`
                        : '1.5px solid transparent',
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-display font-semibold">
                      M3 Mode (Top Bar &amp; Dock)
                    </span>
                    {config.shellMode === 'm3' && <Check className="w-4 h-4 shrink-0" />}
                  </div>
                  <p className="text-[11px] opacity-80 mt-1">
                    Default Material 3 Top Bar, active apps Dock, M3 edge Sidebar &amp; Overview Launcher
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onUpdateConfig(
                      { shellMode: 'mixi', showMixie: true },
                      'Shell Mode: Mixi (Dynamic Blob + Apple Control Center)'
                    )
                  }
                  className="p-3.5 rounded-2xl text-left transition-all cursor-pointer"
                  style={{
                    backgroundColor:
                      config.shellMode === 'mixi'
                        ? palette.primaryContainer
                        : palette.surfaceContainerHigh,
                    color:
                      config.shellMode === 'mixi'
                        ? palette.onPrimaryContainer
                        : palette.onSurface,
                    border:
                      config.shellMode === 'mixi'
                        ? `1.5px solid ${palette.primary}`
                        : '1.5px solid transparent',
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-display font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Mixi Mode (Blob + Apple CC)</span>
                    </span>
                    {config.shellMode === 'mixi' && <Check className="w-4 h-4 shrink-0" />}
                  </div>
                  <p className="text-[11px] opacity-80 mt-1">
                    Cute circular Mixi blob (Task Manager + Alt+Space Search) &amp; Apple Control Center, no Dock
                  </p>
                </button>
              </div>
            </section>

            {/* Mixi Mode Settings */}
            {config.shellMode === 'mixi' && (
              <section
                className="p-4 rounded-2xl space-y-3.5"
                style={{ backgroundColor: palette.surfaceContainer }}
              >
                <div>
                  <h3 className="text-sm font-display font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" style={{ color: palette.primary }} />
                    <span>Mixi Blob &amp; Apple Control Center</span>
                  </h3>
                  <p className="text-xs" style={{ color: palette.onSurfaceVariant }}>
                    Click blob once for Task Manager · Click Search or press Alt+Space for Mixi Search · Alt+A opens Apple Control Center
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-medium" style={{ color: palette.onSurfaceVariant }}>
                    Mixi Blob Anchor Position
                  </div>
                  <div
                    className="grid grid-cols-4 gap-1 p-1 rounded-xl"
                    style={{ backgroundColor: palette.surfaceContainerHigh }}
                  >
                    {(
                      [
                        { id: 'top_left', label: 'Top Left' },
                        { id: 'top_center', label: 'Top Center' },
                        { id: 'top_right', label: 'Top Right' },
                        { id: 'left_center', label: 'Left Mid' },
                        { id: 'right_center', label: 'Right Mid' },
                        { id: 'bottom_left', label: 'Bot Left' },
                        { id: 'bottom_center', label: 'Bot Center' },
                        { id: 'bottom_right', label: 'Bot Right' },
                      ] as { id: MixiePosition; label: string }[]
                    ).map((pos) => {
                      const active = config.mixiePosition === pos.id;
                      return (
                        <button
                          key={pos.id}
                          type="button"
                          onClick={() =>
                            onUpdateConfig(
                              { mixiePosition: pos.id, showMixie: true },
                              `Mixi Anchor: ${pos.label}`
                            )
                          }
                          className="py-1.5 px-2 rounded-lg text-[11px] font-medium cursor-pointer whitespace-nowrap"
                          style={{
                            backgroundColor: active ? palette.primary : 'transparent',
                            color: active ? palette.onPrimary : palette.onSurfaceVariant,
                          }}
                        >
                          {pos.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <ToggleRow
                    palette={palette}
                    label="Auto-Hide (Hover)"
                    desc="Peek on edge hover"
                    value={config.mixieAutoHide}
                    onToggle={() =>
                      onUpdateConfig(
                        { mixieAutoHide: !config.mixieAutoHide },
                        !config.mixieAutoHide
                          ? 'Mixi Auto-Hide ON (hover edge)'
                          : 'Mixi Blob Pinned'
                      )
                    }
                  />
                  <ToggleRow
                    palette={palette}
                    label="Live Media"
                    desc="Equalizer & player"
                    value={config.mixieShowMedia}
                    onToggle={() =>
                      onUpdateConfig(
                        { mixieShowMedia: !config.mixieShowMedia },
                        !config.mixieShowMedia ? 'Mixi Live Media: ON' : 'Mixi Live Media: OFF'
                      )
                    }
                  />
                  <ToggleRow
                    palette={palette}
                    label="Workspaces"
                    desc="Badge & 1-5 switcher"
                    value={config.mixieShowWorkspaces}
                    onToggle={() =>
                      onUpdateConfig(
                        { mixieShowWorkspaces: !config.mixieShowWorkspaces },
                        !config.mixieShowWorkspaces
                          ? 'Mixi Workspaces: ON'
                          : 'Mixi Workspaces: OFF'
                      )
                    }
                  />
                  <ToggleRow
                    palette={palette}
                    label="Clock Readout"
                    desc="Time in hover & tasks"
                    value={config.mixieShowClock}
                    onToggle={() =>
                      onUpdateConfig(
                        { mixieShowClock: !config.mixieShowClock },
                        !config.mixieShowClock ? 'Mixi Clock: ON' : 'Mixi Clock: OFF'
                      )
                    }
                  />
                </div>
              </section>
            )}

            {config.shellMode === 'm3' && (
              <>
            <section
              className="p-4 rounded-2xl space-y-3.5"
              style={{ backgroundColor: palette.surfaceContainer }}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-display font-semibold">Myx Status Bar</h3>
                  <p className="text-xs" style={{ color: palette.onSurfaceVariant }}>
                    Show, hide, place on any edge, or toggle individual bar modules
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateConfig({ showBar: !config.showBar })}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer"
                  style={{
                    backgroundColor: config.showBar
                      ? palette.primary
                      : palette.surfaceContainerHighest,
                    color: config.showBar ? palette.onPrimary : palette.onSurfaceVariant,
                  }}
                >
                  {config.showBar ? 'Bar Visible' : 'Bar Hidden'}
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="text-xs font-medium" style={{ color: palette.onSurfaceVariant }}>
                    Bar Edge Position
                  </div>
                  <div className="grid grid-cols-4 gap-1 p-1 rounded-xl" style={{ backgroundColor: palette.surfaceContainerHigh }}>
                    {POSITIONS.map((pos) => {
                      const active = config.barPosition === pos.id;
                      return (
                        <button
                          key={pos.id}
                          type="button"
                          onClick={() => onUpdateConfig({ barPosition: pos.id, showBar: true })}
                          className="py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                          style={{
                            backgroundColor: active ? palette.primary : 'transparent',
                            color: active ? palette.onPrimary : palette.onSurfaceVariant,
                          }}
                        >
                          {pos.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-medium" style={{ color: palette.onSurfaceVariant }}>
                    Workspace Indicator Style
                  </div>
                  <div className="grid grid-cols-3 gap-1 p-1 rounded-xl" style={{ backgroundColor: palette.surfaceContainerHigh }}>
                    {(
                      [
                        { id: 'numbers', label: '1 2 3' },
                        { id: 'dots', label: 'Dots' },
                        { id: 'roman', label: 'I II III' },
                      ] as { id: WorkspaceIndicatorStyle; label: string }[]
                    ).map((st) => {
                      const active = config.workspaceStyle === st.id;
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => onUpdateConfig({ workspaceStyle: st.id })}
                          className="py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                          style={{
                            backgroundColor: active ? palette.primary : 'transparent',
                            color: active ? palette.onPrimary : palette.onSurfaceVariant,
                          }}
                        >
                          {st.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <ToggleRow
                    palette={palette}
                  label="Auto-Hide (Hover)"
                  desc="Reveal on edge hover"
                  value={config.barAutoHide}
                  onToggle={() =>
                    onUpdateConfig(
                      { barAutoHide: !config.barAutoHide, showBar: true },
                      !config.barAutoHide ? 'Top bar auto-hide enabled' : 'Top bar pinned'
                    )
                  }
                />
                <ToggleRow
                    palette={palette}
                  label="Floating Bar"
                  value={config.barFloating}
                  onToggle={() => onUpdateConfig({ barFloating: !config.barFloating })}
                />
                <label className="flex flex-col justify-center gap-1 px-3 py-2 rounded-xl" style={{ backgroundColor: palette.surfaceContainerHigh }}>
                  <div className="flex justify-between text-xs">
                    <span>Bar Size</span>
                    <span className="font-mono-code">{config.barHeight}px</span>
                  </div>
                  <input
                    type="range"
                    min={34}
                    max={56}
                    value={config.barHeight}
                    onChange={(e) => onUpdateConfig({ barHeight: Number(e.target.value) })}
                    className="w-full accent-current cursor-pointer"
                    style={{ color: palette.primary }}
                  />
                </label>
                <label className="flex flex-col justify-center gap-1 px-3 py-2 rounded-xl" style={{ backgroundColor: palette.surfaceContainerHigh }}>
                  <div className="flex justify-between text-xs">
                    <span>Edge Margin</span>
                    <span className="font-mono-code">{config.barMargin}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={24}
                    value={config.barMargin}
                    onChange={(e) => onUpdateConfig({ barMargin: Number(e.target.value) })}
                    className="w-full accent-current cursor-pointer"
                    style={{ color: palette.primary }}
                  />
                </label>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="text-xs font-medium" style={{ color: palette.onSurfaceVariant }}>
                  Bar Modules Visibility
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <ToggleRow
                    palette={palette}
                    label="Launcher Btn"
                    value={config.barShowLauncher}
                    onToggle={() => onUpdateConfig({ barShowLauncher: !config.barShowLauncher })}
                  />
                  <ToggleRow
                    palette={palette}
                    label="Workspaces"
                    value={config.barShowWorkspaces}
                    onToggle={() => onUpdateConfig({ barShowWorkspaces: !config.barShowWorkspaces })}
                  />
                  <ToggleRow
                    palette={palette}
                    label="Window Title"
                    value={config.barShowWindowTitle}
                    onToggle={() => onUpdateConfig({ barShowWindowTitle: !config.barShowWindowTitle })}
                  />
                  <ToggleRow
                    palette={palette}
                    label="Media Capsule"
                    value={config.showMediaCapsule}
                    onToggle={() => onUpdateConfig({ showMediaCapsule: !config.showMediaCapsule })}
                  />
                  <ToggleRow
                    palette={palette}
                    label="RAM Readout"
                    value={config.barShowRam}
                    onToggle={() => onUpdateConfig({ barShowRam: !config.barShowRam })}
                  />
                  <ToggleRow
                    palette={palette}
                    label="System Tray"
                    value={config.barShowSysTray}
                    onToggle={() => onUpdateConfig({ barShowSysTray: !config.barShowSysTray })}
                  />
                  <ToggleRow
                    palette={palette}
                    label="Clock"
                    value={config.barShowClock}
                    onToggle={() => onUpdateConfig({ barShowClock: !config.barShowClock })}
                  />
                  <ToggleRow
                    palette={palette}
                    label="Lock Button"
                    value={config.barShowLock}
                    onToggle={() => onUpdateConfig({ barShowLock: !config.barShowLock })}
                  />
                </div>
              </div>
            </section>

            <section
              className="p-4 rounded-2xl space-y-3.5"
              style={{ backgroundColor: palette.surfaceContainer }}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-display font-semibold">Myx Application Dock</h3>
                  <p className="text-xs" style={{ color: palette.onSurfaceVariant }}>
                    Tracks active apps dynamically or pins favorites on any edge
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateConfig({ showDock: !config.showDock })}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer"
                  style={{
                    backgroundColor: config.showDock
                      ? palette.primary
                      : palette.surfaceContainerHighest,
                    color: config.showDock ? palette.onPrimary : palette.onSurfaceVariant,
                  }}
                >
                  {config.showDock ? 'Dock Visible' : 'Dock Hidden'}
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="text-xs font-medium" style={{ color: palette.onSurfaceVariant }}>
                    Dock Edge Position
                  </div>
                  <div className="grid grid-cols-4 gap-1 p-1 rounded-xl" style={{ backgroundColor: palette.surfaceContainerHigh }}>
                    {POSITIONS.map((pos) => {
                      const active = config.dockPosition === pos.id;
                      return (
                        <button
                          key={pos.id}
                          type="button"
                          onClick={() => onUpdateConfig({ dockPosition: pos.id, showDock: true })}
                          className="py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                          style={{
                            backgroundColor: active ? palette.primary : 'transparent',
                            color: active ? palette.onPrimary : palette.onSurfaceVariant,
                          }}
                        >
                          {pos.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-medium" style={{ color: palette.onSurfaceVariant }}>
                    Dock App Mode
                  </div>
                  <div className="grid grid-cols-2 gap-1 p-1 rounded-xl" style={{ backgroundColor: palette.surfaceContainerHigh }}>
                    {(
                      [
                        { id: 'active_only', label: 'Active Apps Only' },
                        { id: 'pinned_and_active', label: 'Pinned + Active' },
                      ] as { id: DockMode; label: string }[]
                    ).map((m) => {
                      const active = config.dockMode === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => onUpdateConfig({ dockMode: m.id })}
                          className="py-1.5 px-2 rounded-lg text-xs font-medium cursor-pointer"
                          style={{
                            backgroundColor: active ? palette.primary : 'transparent',
                            color: active ? palette.onPrimary : palette.onSurfaceVariant,
                          }}
                        >
                          {m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                <ToggleRow
                    palette={palette}
                  label="Auto-Hide (Hover)"
                  desc="Reveal on edge hover"
                  value={config.dockAutoHide}
                  onToggle={() =>
                    onUpdateConfig(
                      { dockAutoHide: !config.dockAutoHide, showDock: true },
                      !config.dockAutoHide ? 'Dock auto-hide enabled' : 'Dock pinned'
                    )
                  }
                />
                <ToggleRow
                    palette={palette}
                  label="Launcher in Dock"
                  desc="Off avoids duplicate"
                  value={config.dockShowLauncher}
                  onToggle={() => onUpdateConfig({ dockShowLauncher: !config.dockShowLauncher })}
                />
                <ToggleRow
                    palette={palette}
                  label="Keybinds Button"
                  value={config.dockShowCheatsheet}
                  onToggle={() => onUpdateConfig({ dockShowCheatsheet: !config.dockShowCheatsheet })}
                />
                <label className="flex flex-col justify-center gap-1 px-3 py-2 rounded-xl" style={{ backgroundColor: palette.surfaceContainerHigh }}>
                  <div className="flex justify-between text-xs">
                    <span>Icon Size</span>
                    <span className="font-mono-code">{config.dockIconSize}px</span>
                  </div>
                  <input
                    type="range"
                    min={32}
                    max={52}
                    step={2}
                    value={config.dockIconSize}
                    onChange={(e) => onUpdateConfig({ dockIconSize: Number(e.target.value) })}
                    className="w-full accent-current cursor-pointer"
                    style={{ color: palette.primary }}
                  />
                </label>
              </div>
            </section>

              </>
            )}

            {/* Customizable Control Sidebar — Available in BOTH M3 and Mixi Modes */}
            <section
              className="p-4 rounded-2xl space-y-3.5"
              style={{ backgroundColor: palette.surfaceContainer }}
            >
              <div>
                <h3 className="text-sm font-display font-semibold">
                  Control Sidebar &amp; macOS Appearance
                </h3>
                <p className="text-xs" style={{ color: palette.onSurfaceVariant }}>
                  Switch between Material 3, macOS Control Center Bento, or Minimal Glass; anchor as Edge Drawer or Floating Popover; resize and toggle every module
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="text-xs font-medium" style={{ color: palette.onSurfaceVariant }}>
                    Sidebar Style Preset
                  </div>
                  <div
                    className="grid grid-cols-3 gap-1 p-1 rounded-xl"
                    style={{ backgroundColor: palette.surfaceContainerHigh }}
                  >
                    {(
                      [
                        { id: 'm3', label: 'Material 3' },
                        { id: 'macos', label: 'macOS Bento' },
                        { id: 'minimal', label: 'Minimal Glass' },
                      ] as { id: SidebarStyle; label: string }[]
                    ).map((st) => {
                      const active = config.sidebarStyle === st.id;
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() =>
                            onUpdateConfig(
                              {
                                sidebarStyle: st.id,
                                ...(st.id === 'macos' ? { sidebarAnchor: 'popover' } : {}),
                              },
                              `Sidebar: ${st.label}`
                            )
                          }
                          className="py-1.5 px-2 rounded-lg text-xs font-medium cursor-pointer"
                          style={{
                            backgroundColor: active ? palette.primary : 'transparent',
                            color: active ? palette.onPrimary : palette.onSurfaceVariant,
                          }}
                        >
                          {st.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-medium" style={{ color: palette.onSurfaceVariant }}>
                    Presentation Anchor
                  </div>
                  <div
                    className="grid grid-cols-2 gap-1 p-1 rounded-xl"
                    style={{ backgroundColor: palette.surfaceContainerHigh }}
                  >
                    {(
                      [
                        { id: 'drawer', label: 'Edge Drawer' },
                        { id: 'popover', label: 'macOS Popover' },
                      ] as { id: SidebarAnchor; label: string }[]
                    ).map((anc) => {
                      const active = config.sidebarAnchor === anc.id;
                      return (
                        <button
                          key={anc.id}
                          type="button"
                          onClick={() =>
                            onUpdateConfig(
                              { sidebarAnchor: anc.id },
                              `Sidebar Anchor: ${anc.label}`
                            )
                          }
                          className="py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                          style={{
                            backgroundColor: active ? palette.primary : 'transparent',
                            color: active ? palette.onPrimary : palette.onSurfaceVariant,
                          }}
                        >
                          {anc.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <div className="text-xs font-medium" style={{ color: palette.onSurfaceVariant }}>
                    Sidebar Side
                  </div>
                  <div
                    className="grid grid-cols-2 gap-1 p-1 rounded-xl"
                    style={{ backgroundColor: palette.surfaceContainerHigh }}
                  >
                    {(
                      [
                        { id: 'left', label: 'Left' },
                        { id: 'right', label: 'Right' },
                      ] as { id: SidebarPosition; label: string }[]
                    ).map((pos) => {
                      const active = config.sidebarPosition === pos.id;
                      return (
                        <button
                          key={pos.id}
                          type="button"
                          onClick={() =>
                            onUpdateConfig(
                              { sidebarPosition: pos.id },
                              `Sidebar: ${pos.label}`
                            )
                          }
                          className="py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                          style={{
                            backgroundColor: active ? palette.primary : 'transparent',
                            color: active ? palette.onPrimary : palette.onSurfaceVariant,
                          }}
                        >
                          {pos.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <label
                  className="flex flex-col justify-center gap-1 px-3 py-2 rounded-xl"
                  style={{ backgroundColor: palette.surfaceContainerHigh }}
                >
                  <div className="flex justify-between text-xs">
                    <span>Width</span>
                    <span className="font-mono-code tabular-nums">{config.sidebarWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min={310}
                    max={480}
                    step={4}
                    value={config.sidebarWidth}
                    onChange={(e) => onUpdateConfig({ sidebarWidth: Number(e.target.value) })}
                    className="w-full accent-current cursor-pointer"
                    style={{ color: palette.primary }}
                  />
                </label>

                <label
                  className="flex flex-col justify-center gap-1 px-3 py-2 rounded-xl"
                  style={{ backgroundColor: palette.surfaceContainerHigh }}
                >
                  <div className="flex justify-between text-xs">
                    <span>Corner Radius</span>
                    <span className="font-mono-code tabular-nums">{config.sidebarRadius}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={32}
                    step={1}
                    value={config.sidebarRadius}
                    onChange={(e) => onUpdateConfig({ sidebarRadius: Number(e.target.value) })}
                    className="w-full accent-current cursor-pointer"
                    style={{ color: palette.primary }}
                  />
                </label>

                <ToggleRow
                  palette={palette}
                  label="Compact Spacing"
                  desc={config.sidebarCompact ? 'Tight padding' : 'Standard padding'}
                  value={config.sidebarCompact}
                  onToggle={() =>
                    onUpdateConfig({ sidebarCompact: !config.sidebarCompact })
                  }
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-2">
                <ToggleRow
                  palette={palette}
                  label="Floating Drawer Margin"
                  desc={config.sidebarFloating ? 'Detached card' : 'Flush screen edge'}
                  value={config.sidebarFloating}
                  onToggle={() =>
                    onUpdateConfig({ sidebarFloating: !config.sidebarFloating })
                  }
                />
                <ToggleRow
                  palette={palette}
                  label="User Header"
                  value={config.sidebarShowProfile}
                  onToggle={() =>
                    onUpdateConfig({ sidebarShowProfile: !config.sidebarShowProfile })
                  }
                />
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="text-xs font-medium" style={{ color: palette.onSurfaceVariant }}>
                  Sidebar Sections Visibility
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <ToggleRow
                    palette={palette}
                    label="Quick Tiles / Bento"
                    value={config.sidebarShowQuickTiles}
                    onToggle={() =>
                      onUpdateConfig({ sidebarShowQuickTiles: !config.sidebarShowQuickTiles })
                    }
                  />
                  <ToggleRow
                    palette={palette}
                    label="Display & Sound"
                    value={config.sidebarShowSliders}
                    onToggle={() =>
                      onUpdateConfig({ sidebarShowSliders: !config.sidebarShowSliders })
                    }
                  />
                  <ToggleRow
                    palette={palette}
                    label="Wallpaper Strip"
                    value={config.sidebarShowWallpaperStrip}
                    onToggle={() =>
                      onUpdateConfig({
                        sidebarShowWallpaperStrip: !config.sidebarShowWallpaperStrip,
                      })
                    }
                  />
                  <ToggleRow
                    palette={palette}
                    label="Now Playing"
                    value={config.sidebarShowMedia}
                    onToggle={() =>
                      onUpdateConfig({ sidebarShowMedia: !config.sidebarShowMedia })
                    }
                  />
                  <ToggleRow
                    palette={palette}
                    label="Notifications"
                    value={config.sidebarShowNotifications}
                    onToggle={() =>
                      onUpdateConfig({
                        sidebarShowNotifications: !config.sidebarShowNotifications,
                      })
                    }
                  />
                </div>
              </div>
            </section>
          </>
        )}

        {tab === 'launcher' && (
          <>
            <section
              className="p-4 rounded-2xl space-y-3.5"
              style={{ backgroundColor: palette.surfaceContainer }}
            >
              <div>
                <h3 className="text-sm font-display font-semibold">App Launcher & Overview</h3>
                <p className="text-xs" style={{ color: palette.onSurfaceVariant }}>
                  Customize launcher placement and embedded widgets
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-medium" style={{ color: palette.onSurfaceVariant }}>
                  Launcher Vertical Position
                </div>
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl" style={{ backgroundColor: palette.surfaceContainerHigh }}>
                  {(
                    [
                      { id: 'top', label: 'Top' },
                      { id: 'center', label: 'Center' },
                      { id: 'bottom', label: 'Bottom' },
                    ] as { id: LauncherPosition; label: string }[]
                  ).map((p) => {
                    const active = config.launcherPosition === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => onUpdateConfig({ launcherPosition: p.id })}
                        className="py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                        style={{
                          backgroundColor: active ? palette.primary : 'transparent',
                          color: active ? palette.onPrimary : palette.onSurfaceVariant,
                        }}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-2.5">
                <ToggleRow
                    palette={palette}
                  label="Workspace Mini-Map"
                  desc="Visual 1-5 workspace strip"
                  value={config.launcherShowWorkspaces}
                  onToggle={() =>
                    onUpdateConfig({ launcherShowWorkspaces: !config.launcherShowWorkspaces })
                  }
                />
                <ToggleRow
                    palette={palette}
                  label="Inline Calculator"
                  desc="Evaluate math expressions"
                  value={config.launcherShowCalculator}
                  onToggle={() =>
                    onUpdateConfig({ launcherShowCalculator: !config.launcherShowCalculator })
                  }
                />
                <ToggleRow
                    palette={palette}
                  label="Wallpaper Quick-Pick"
                  desc="Show wallpapers in search"
                  value={config.launcherShowWallpapers}
                  onToggle={() =>
                    onUpdateConfig({ launcherShowWallpapers: !config.launcherShowWallpapers })
                  }
                />
                <ToggleRow
                    palette={palette}
                  label="Compact Density"
                  desc="Single-line results list"
                  value={config.launcherCompact}
                  onToggle={() => onUpdateConfig({ launcherCompact: !config.launcherCompact })}
                />
              </div>
            </section>

            <section
              className="p-4 rounded-2xl space-y-3.5"
              style={{ backgroundColor: palette.surfaceContainer }}
            >
              <div>
                <h3 className="text-sm font-display font-semibold">Nyx Gaps & Bezier Motion</h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-2">
                {BEZIER_PRESETS.map((b) => {
                  const active = config.bezierPreset === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => onUpdateConfig({ bezierPreset: b.id }, `Curve: ${b.name}`)}
                      className="p-3 rounded-xl text-left transition-all cursor-pointer"
                      style={{
                        backgroundColor: active
                          ? palette.primaryContainer
                          : palette.surfaceContainerHigh,
                        color: active ? palette.onPrimaryContainer : palette.onSurface,
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold">{b.name}</span>
                        <span className="text-[10px] font-mono-code opacity-75">
                          {b.points.join(', ')}
                        </span>
                      </div>
                      <div className="text-[11px] opacity-80 mt-0.5">{b.description}</div>
                    </button>
                  );
                })}
              </div>

              <div className="grid sm:grid-cols-3 gap-4 pt-1">
                <label className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs">
                    <span>Gaps In</span>
                    <span className="font-mono-code">{config.gapsIn}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    value={config.gapsIn}
                    onChange={(e) => onUpdateConfig({ gapsIn: Number(e.target.value) })}
                    className="w-full accent-current cursor-pointer"
                    style={{ color: palette.primary }}
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs">
                    <span>Gaps Out</span>
                    <span className="font-mono-code">{config.gapsOut}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={32}
                    value={config.gapsOut}
                    onChange={(e) => onUpdateConfig({ gapsOut: Number(e.target.value) })}
                    className="w-full accent-current cursor-pointer"
                    style={{ color: palette.primary }}
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs">
                    <span>Anim Duration</span>
                    <span className="font-mono-code">{config.animSpeed.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={1.8}
                    step={0.1}
                    value={config.animSpeed}
                    onChange={(e) => onUpdateConfig({ animSpeed: Number(e.target.value) })}
                    className="w-full accent-current cursor-pointer"
                    style={{ color: palette.primary }}
                  />
                </label>
              </div>
            </section>

            {/* Keybinds Summary & Editor Trigger */}
            <section
              className="p-4 rounded-2xl space-y-3"
              style={{ backgroundColor: palette.surfaceContainer }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-display font-semibold">Global Keybinds</h3>
                  <p className="text-xs" style={{ color: palette.onSurfaceVariant }}>
                    Bindings sync live to desktop shortcuts and generated nyx.conf / init.lua
                  </p>
                </div>
                {onOpenKeybinds && (
                  <button
                    type="button"
                    onClick={onOpenKeybinds}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer"
                    style={{ backgroundColor: palette.primary, color: palette.onPrimary }}
                  >
                    <Keyboard className="w-3.5 h-3.5" />
                    <span>Edit Keybinds</span>
                  </button>
                )}
              </div>

              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ backgroundColor: palette.surfaceContainerHigh }}
              >
                <Search className="w-3.5 h-3.5 shrink-0" style={{ color: palette.onSurfaceVariant }} />
                <input
                  type="text"
                  value={keybindQuery}
                  onChange={(e) => setKeybindQuery(e.target.value)}
                  placeholder="Search binds (window, workspace, screenshot, record, lock...)"
                  className="w-full bg-transparent text-xs outline-none"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-2">
                {config.keybinds
                  .filter((kb) => {
                    const q = keybindQuery.trim().toLowerCase();
                    if (!q) return true;
                    return (
                      kb.label.toLowerCase().includes(q) ||
                      kb.category.toLowerCase().includes(q) ||
                      `${kb.mod}+${kb.key}`.toLowerCase().includes(q)
                    );
                  })
                  .map((kb) => (
                    <div
                      key={kb.id}
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs"
                      style={{ backgroundColor: palette.surfaceContainerHigh }}
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">{kb.label}</div>
                        <div className="text-[10px] opacity-65">{kb.category}</div>
                      </div>
                      <kbd
                        className="font-mono-code text-[11px] px-2 py-0.5 rounded shrink-0"
                        style={{
                          backgroundColor: palette.primaryContainer,
                          color: palette.onPrimaryContainer,
                        }}
                      >
                        {kb.mod}+{kb.key.toUpperCase()}
                      </kbd>
                    </div>
                  ))}

                {!keybindQuery.trim() && (
                  <>
                    <div
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs"
                      style={{ backgroundColor: palette.surfaceContainerHigh }}
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">
                          Switch Workspace {config.nyxInfiniteWorkspaces ? '1 – 9' : '1 – 5'}
                        </div>
                        <div className="text-[10px] opacity-65">Workspaces</div>
                      </div>
                      <kbd
                        className="font-mono-code text-[11px] px-2 py-0.5 rounded shrink-0"
                        style={{
                          backgroundColor: palette.secondaryContainer,
                          color: palette.onSecondaryContainer,
                        }}
                      >
                        {config.nyxInfiniteWorkspaces ? 'Alt+1..9' : 'Alt+1..5'}
                      </kbd>
                    </div>
                    <div
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs"
                      style={{ backgroundColor: palette.surfaceContainerHigh }}
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">
                          Move Window to WS {config.nyxInfiniteWorkspaces ? '1 – 9' : '1 – 5'}
                        </div>
                        <div className="text-[10px] opacity-65">Workspaces</div>
                      </div>
                      <kbd
                        className="font-mono-code text-[11px] px-2 py-0.5 rounded shrink-0"
                        style={{
                          backgroundColor: palette.secondaryContainer,
                          color: palette.onSecondaryContainer,
                        }}
                      >
                        {config.nyxInfiniteWorkspaces ? 'Shift+Alt+1..9' : 'Shift+Alt+1..5'}
                      </kbd>
                    </div>
                    <div
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs"
                      style={{ backgroundColor: palette.surfaceContainerHigh }}
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">Focus Prev / Next Column</div>
                        <div className="text-[10px] opacity-65">Nyx Scrolling</div>
                      </div>
                      <kbd
                        className="font-mono-code text-[11px] px-2 py-0.5 rounded shrink-0"
                        style={{
                          backgroundColor: palette.secondaryContainer,
                          color: palette.onSecondaryContainer,
                        }}
                      >
                        Alt+← / →
                      </kbd>
                    </div>
                    <div
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs"
                      style={{ backgroundColor: palette.surfaceContainerHigh }}
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">Swap Column Left / Right</div>
                        <div className="text-[10px] opacity-65">Nyx Scrolling</div>
                      </div>
                      <kbd
                        className="font-mono-code text-[11px] px-2 py-0.5 rounded shrink-0"
                        style={{
                          backgroundColor: palette.secondaryContainer,
                          color: palette.onSecondaryContainer,
                        }}
                      >
                        Shift+Alt+← / →
                      </kbd>
                    </div>
                  </>
                )}
              </div>
            </section>
          </>
        )}

        {tab === 'rust' && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-display font-semibold">
                  Nyx + Myx Rust Workspace Modules
                </h3>
                <p className="text-xs" style={{ color: palette.onSurfaceVariant }}>
                  Combined Smithay compositor + Myx layer-shell RSS footprint
                </p>
              </div>
              <div className="text-right">
                <div className="text-base font-display font-bold tabular-nums" style={{ color: palette.primary }}>
                  {ram.totalMb.toFixed(1)} MB
                </div>
                <div className="text-[11px]" style={{ color: palette.onSurfaceVariant }}>
                  Nyx {ram.compositorMb.toFixed(1)}M + Myx {ram.shellMb.toFixed(1)}M
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {config.modules.map((mod) => (
                <div
                  key={mod.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl"
                  style={{ backgroundColor: palette.surfaceContainer }}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">{mod.label}</span>
                      <span className="text-[11px] font-mono-code" style={{ color: palette.onSurfaceVariant }}>
                        {mod.crateName}
                      </span>
                    </div>
                    <div className="text-[11px] mt-0.5 truncate" style={{ color: palette.onSurfaceVariant }}>
                      {mod.description}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-mono-code tabular-nums" style={{ color: palette.onSurfaceVariant }}>
                      {mod.ramMb.toFixed(1)} MB
                    </span>
                    <button
                      type="button"
                      disabled={mod.essential}
                      onClick={() => onToggleModule(mod.id)}
                      className="px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: mod.enabled
                          ? palette.primary
                          : palette.surfaceContainerHighest,
                        color: mod.enabled ? palette.onPrimary : palette.onSurfaceVariant,
                      }}
                    >
                      {mod.essential ? 'Core' : mod.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
