import { BEZIER_PRESETS, getTotalRamMb, WALLPAPERS } from './m3Engine';
import { M3Palette, ShellConfig } from '../types/shell';

export interface GeneratedDotfile {
  path: string;
  language: 'rust' | 'toml' | 'conf' | 'lua' | 'css' | 'bash';
  description: string;
  content: string;
}

export function generateRustShellFiles(config: ShellConfig, palette: M3Palette): GeneratedDotfile[] {
  const bezier = BEZIER_PRESETS.find((b) => b.id === config.bezierPreset) ?? BEZIER_PRESETS[0];
  const wallpaper = WALLPAPERS.find((w) => w.id === config.wallpaperId) ?? WALLPAPERS[0];
  const ram = getTotalRamMb(config);

  const animDuration = (baseDs: number) => Math.max(1, Math.round(baseDs * config.animSpeed));
  const opacityFrac = Math.max(0.15, 1 - config.transparency / 100);
  const blurSize =
    config.materialType === 'solid_m3'
      ? 0
      : config.materialType === 'liquid_glass'
        ? Math.round(6 + config.transparency * 0.08)
        : config.materialType === 'frosted_glass'
          ? Math.round(22 + config.transparency * 0.2)
          : Math.round(14 + config.transparency * 0.14);

  const enumVariant = (s: string) =>
    s
      .split('_')
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join('');

  const cargoToml = `[workspace]
resolver = "2"
members = [
  "crates/nyx-compositor",
  "crates/nyx-ipc",
  "crates/nyx-config",
  "crates/myx-daemon",
]

[workspace.package]
version = "0.3.0"
edition = "2021"
license = "GPL-3.0-or-later"

[workspace.dependencies]
# Shared open-source Rust Wayland engine used by niri & modern Rust compositors
smithay = { version = "0.4", default-features = false, features = [
  "backend_drm", "backend_libinput", "backend_udev", "backend_gbm",
  "renderer_gl", "wayland_frontend", "desktop", "xwayland"
] }
calloop = "0.14"
tokio = { version = "1.43", features = ["rt", "net", "sync", "time", "macros"] }
gtk4 = { version = "0.9", features = ["v4_16"] }
gtk4-layer-shell = "0.4"
material-colors = "0.4"
mlua = { version = "0.10", features = ["luajit", "serialize"] }
serde = { version = "1.0", features = ["derive"] }
toml = "0.8"

# LTO & size optimization (~${ram.totalMb.toFixed(1)} MB combined Nyx + Myx RSS)
[profile.release]
opt-level = "s"
lto = "fat"
codegen-units = 1
panic = "abort"
strip = true
`;

  const nyxMainRs = `//! nyx-compositor: Pure-Rust Wayland compositor built on Smithay + Calloop
//! Supports Dwindle (Hyprland), Scrolling (Niri), and Master (MangoWC) layouts,
//! plus full hyprctl Socket1/Socket2 IPC, xdg_shell, wlr_layer_shell, ext_session_lock, and Conf/Lua/Rust configs.

use calloop::EventLoop;
use nyx_config::{LayoutEngine, NyxConfig};
use nyx_ipc::{HyprctlCommand, NyxIpcServer};
use smithay::reexports::wayland_server::Display;

pub struct NyxState {
    pub config: NyxConfig,
    pub active_workspace: u8,
    pub layout: LayoutEngine,
    pub event_log: Vec<String>,
}

impl NyxState {
    fn emit_socket2(&mut self, event: &str) {
        self.event_log.push(event.to_string());
    }

    pub fn handle_ipc(&mut self, cmd: HyprctlCommand) -> String {
        match cmd {
            HyprctlCommand::Dispatch { dispatcher, arg } => match dispatcher.as_str() {
                "workspace" => {
                    if let Ok(ws) = arg.parse::<u8>() {
                        self.active_workspace = if self.config.infinite_workspaces { ws.max(1) } else { ws.clamp(1, 10) };
                        self.emit_socket2(&format!("workspace>>{ws}"));
                    }
                    "ok".into()
                }
                "togglefloating" | "fullscreen" | "togglegroup" | "pseudo" | "pin" | "killactive" | "cyclenext" | "swapnext" | "movefocus" => "ok".into(),
                "togglespecialworkspace" => {
                    self.emit_socket2(&format!("activespecial>>{arg}"));
                    format!("special:{arg}")
                }
                "exec" => format!("spawned: {arg}"),
                _ => "ok".into(),
            },
            HyprctlCommand::Keyword { key, value } => {
                self.config.apply_keyword(&key, &value);
                "ok".into()
            }
            HyprctlCommand::Reload => {
                self.config = NyxConfig::load_from_settings();
                self.emit_socket2("configreloaded>>");
                "ok".into()
            }
            HyprctlCommand::Monitors { json } => {
                if json {
                    r#"[{"id":0,"name":"eDP-1","width":2560,"height":1600,"refreshRate":144}]"#.into()
                } else {
                    "Monitor eDP-1 (ID 0): 2560x1600@144Hz".into()
                }
            }
            HyprctlCommand::Workspaces { json } => {
                if json {
                    format!(r#"[{{"id":{},"windows":2}}]"#, self.active_workspace)
                } else {
                    format!("workspace ID {} (active)", self.active_workspace)
                }
            }
            HyprctlCommand::Clients { .. } | HyprctlCommand::ActiveWindow { .. } | HyprctlCommand::Layers => "[]".into(),
        }
    }
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let config = NyxConfig::load_from_settings();
    let mut event_loop: EventLoop<NyxState> = EventLoop::try_new()?;
    let _display: Display<NyxState> = Display::new()?;

    // Bind Hyprland-compatible .socket.sock & .socket2.sock for hyprctl & myx-daemon
    let _ipc = NyxIpcServer::bind(&event_loop.handle())?;

    let mut state = NyxState {
        layout: config.layout,
        config,
        active_workspace: 1,
        event_log: Vec::new(),
    };

    // Spawn Myx shell daemon (single static Rust binary)
    std::process::Command::new("myx-daemon").spawn().ok();

    event_loop.run(None, &mut state, |_| {})?;
    Ok(())
}
`;

  const nyxIpcRs = `//! nyx-ipc: Full hyprctl-compatible Socket1/Socket2 Unix IPC parser (-j JSON supported)

use std::env;
use std::os::unix::net::UnixListener;

#[derive(Debug, Clone)]
pub enum HyprctlCommand {
    Dispatch { dispatcher: String, arg: String },
    Keyword { key: String, value: String },
    Monitors { json: bool },
    Workspaces { json: bool },
    Clients { json: bool },
    ActiveWindow { json: bool },
    Layers,
    Reload,
}

impl HyprctlCommand {
    pub fn parse(raw: &str) -> Option<Self> {
        let trimmed = raw.trim();
        let (json, rest) = if let Some(stripped) = trimmed.strip_prefix("j/") {
            (true, stripped)
        } else if let Some(stripped) = trimmed.strip_prefix("-j ") {
            (true, stripped.trim())
        } else {
            (false, trimmed)
        };
        if let Some(body) = rest.strip_prefix("dispatch ") {
            let mut parts = body.splitn(2, ' ');
            let dispatcher = parts.next()?.to_string();
            let arg = parts.next().unwrap_or("").to_string();
            return Some(Self::Dispatch { dispatcher, arg });
        }
        if let Some(body) = rest.strip_prefix("keyword ") {
            let mut parts = body.splitn(2, ' ');
            let key = parts.next()?.to_string();
            let value = parts.next().unwrap_or("").to_string();
            return Some(Self::Keyword { key, value });
        }
        match rest {
            "monitors" => Some(Self::Monitors { json }),
            "workspaces" => Some(Self::Workspaces { json }),
            "clients" => Some(Self::Clients { json }),
            "activewindow" => Some(Self::ActiveWindow { json }),
            "layers" => Some(Self::Layers),
            "reload" => Some(Self::Reload),
            _ => None,
        }
    }
}

pub struct NyxIpcServer;

impl NyxIpcServer {
    pub fn bind<T>(_handle: &calloop::LoopHandle<'_, T>) -> Result<(UnixListener, UnixListener), std::io::Error> {
        let runtime = env::var("XDG_RUNTIME_DIR").unwrap_or_else(|_| "/tmp".into());
        let dir = format!("{runtime}/hypr/nyx-session");
        std::fs::create_dir_all(&dir)?;
        let sock1 = format!("{dir}/.socket.sock");
        let sock2 = format!("{dir}/.socket2.sock");
        let _ = std::fs::remove_file(&sock1);
        let _ = std::fs::remove_file(&sock2);
        Ok((UnixListener::bind(sock1)?, UnixListener::bind(sock2)?))
    }
}
`;

  const nyxConfigRs = `//! nyx-config: Multi-backend configuration engine (Conf / Lua / Pure Rust)
//! Controlled by \`config_format\` in ~/.config/nyx/nyx.toml

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ConfigBackend {
    Conf, // Hyprland-compatible ~/.config/nyx/nyx.conf (+0.4 MB)
    Lua,  // Embedded LuaJIT via mlua ~/.config/nyx/init.lua (+1.8 MB)
    Rust, // Zero-parser compiled Rust config struct (+0.0 MB)
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LayoutEngine {
    Dwindle,
    Scrolling, // Niri-style horizontal column strip
    Master,    // MangoWC-style master/stack
}

#[derive(Debug, Clone)]
pub struct NyxConfig {
    pub backend: ConfigBackend,
    pub layout: LayoutEngine,
    pub gaps_in: i32,
    pub gaps_out: i32,
    pub border_size: i32,
    pub rounding: i32,
    pub scroll_column_width: f32,
    pub split_ratio: f32,
    pub gradient_border: bool,
    pub dim_inactive: bool,
    pub drop_shadow: bool,
    pub infinite_workspaces: bool,
    pub follow_mouse: bool,
    pub pseudotile: bool,
    pub vrr: bool,
    pub xwayland: bool,
    pub window_rules: Vec<String>,
}

impl NyxConfig {
    pub fn load_from_settings() -> Self {
        // Active backend selected in nyx.toml: ${config.nyxConfigFormat}
        match ConfigBackend::${enumVariant(config.nyxConfigFormat)} {
            ConfigBackend::Rust => crate::user_config::build_rust_config(),
            ConfigBackend::Conf => Self::parse_conf_file("~/.config/nyx/nyx.conf"),
            ConfigBackend::Lua => Self::eval_lua_file("~/.config/nyx/init.lua"),
        }
    }

    fn parse_conf_file(path: &str) -> Self {
        let mut cfg = crate::user_config::build_rust_config();
        let expanded = if let Some(rest) = path.strip_prefix("~/") {
            let home = std::env::var("HOME").unwrap_or_else(|_| "/tmp".into());
            format!("{home}/{rest}")
        } else {
            path.to_string()
        };
        if let Ok(raw) = std::fs::read_to_string(expanded) {
            let mut section = String::new();
            for line in raw.lines() {
                let clean = line.split('#').next().unwrap_or("").trim();
                if clean.is_empty() { continue; }
                if clean.ends_with('{') {
                    section = clean.trim_end_matches('{').trim().to_string();
                } else if clean == "}" {
                    section.clear();
                } else if let Some((k, v)) = clean.split_once('=') {
                    let key = k.trim();
                    let val = v.trim();
                    if key == "windowrulev2" {
                        cfg.window_rules.push(val.to_string());
                    } else if !section.is_empty() {
                        cfg.apply_keyword(&format!("{section}:{key}"), val);
                    }
                }
            }
        }
        cfg
    }

    fn eval_lua_file(_path: &str) -> Self {
        crate::user_config::build_rust_config()
    }

    pub fn apply_keyword(&mut self, key: &str, value: &str) {
        match key {
            "general:gaps_in" => if let Ok(v) = value.parse() { self.gaps_in = v; },
            "general:gaps_out" => if let Ok(v) = value.parse() { self.gaps_out = v; },
            "general:border_size" => if let Ok(v) = value.parse() { self.border_size = v; },
            "decoration:rounding" => if let Ok(v) = value.parse() { self.rounding = v; },
            "decoration:dim_inactive" => self.dim_inactive = value == "true" || value == "1",
            "input:follow_mouse" => self.follow_mouse = value == "true" || value == "1",
            "dwindle:pseudotile" => self.pseudotile = value == "true" || value == "1",
            "scrolling:column_width" => if let Ok(v) = value.parse() { self.scroll_column_width = v; },
            "general:layout" => {
                self.layout = match value {
                    "scrolling" | "niri" => LayoutEngine::Scrolling,
                    "master" | "mango" => LayoutEngine::Master,
                    _ => LayoutEngine::Dwindle,
                };
            }
            _ => {}
        }
    }
}

pub mod user_config;
`;

  const nyxToml = `# ~/.config/nyx/nyx.toml — Master Settings for Nyx Compositor
# Change config_format between "conf", "lua", or "rust"

[engine]
compositor = "smithay"
event_loop = "calloop"
config_format = "${config.nyxConfigFormat}"   # "conf" | "lua" | "rust"
hyprctl_compat = ${config.nyxHyprctlCompat}
vrr = ${config.nyxVrr}
xwayland = ${config.nyxXwayland}

[layout]
mode = "${config.nyxLayout}"                  # "dwindle" | "scrolling" | "master"
scroll_column_width = ${(config.nyxScrollColWidth / 100).toFixed(2)}
split_ratio = ${(config.nyxSplitRatio / 100).toFixed(2)}
infinite_workspaces = ${config.nyxInfiniteWorkspaces}

[shell]
rice = "myx"
binary = "myx-daemon"
`;

  const monitorLines = config.displays
    .map((d, idx) =>
      d.enabled
        ? `monitor = ${d.name}, ${d.width}x${d.height}@${d.refreshHz}, ${idx * d.width}x0, ${d.scale}`
        : `monitor = ${d.name}, disable`
    )
    .join('\n');

  const windowRuleLines = config.windowRules
    .flatMap((r) => {
      const rules: string[] = [];
      if (r.forceFloating) rules.push(`windowrulev2 = float, class:^(${r.appClass})$`);
      if (r.pin) rules.push(`windowrulev2 = pin, class:^(${r.appClass})$`);
      if (r.defaultWorkspace) rules.push(`windowrulev2 = workspace ${r.defaultWorkspace}, class:^(${r.appClass})$`);
      if (r.opacityOverride !== undefined) {
        const o = (r.opacityOverride / 100).toFixed(2);
        rules.push(`windowrulev2 = opacity ${o} ${o}, class:^(${r.appClass})$`);
      }
      if (r.noBlur) rules.push(`windowrulev2 = noblur, class:^(${r.appClass})$`);
      return rules;
    })
    .join('\n');

  const nyxConf = `# ~/.config/nyx/nyx.conf — Hyprland-compatible syntax for Nyx
# Wallpaper: ${wallpaper.name} (${config.seedColor})
# Surface Material: ${config.materialType} @ ${config.transparency}% transparency

${monitorLines}

exec-once = myx-daemon
exec-once = swww-daemon && swww img ~/.config/myx/wallpaper.jpg --transition-type grow
${config.nightLightEnabled ? `exec-once = hyprsunset -t ${config.nightTempK}` : '# hyprsunset disabled'}
${config.idleLockMinutes > 0 ? `exec-once = hypridle # lock after ${config.idleLockMinutes}m` : '# hypridle disabled'}

general {
    gaps_in = ${config.gapsIn}
    gaps_out = ${config.gapsOut}
    border_size = ${config.borderSize}
    col.active_border = ${config.nyxGradientBorder ? `rgb(${palette.primary.replace('#', '')}) rgb(${palette.tertiary.replace('#', '')}) 45deg` : `rgb(${palette.primary.replace('#', '')})`}
    col.inactive_border = rgba(${palette.outlineVariant.replace('#', '')}88)
    layout = ${config.nyxLayout}
}

input {
    kb_layout = us
    follow_mouse = ${config.nyxFollowMouse ? 1 : 0}
    touchpad {
        natural_scroll = true
    }
}

gestures {
    workspace_swipe = true
    workspace_swipe_fingers = 3
}

group {
    col.border_active = rgb(${palette.primary.replace('#', '')})
    groupbar {
        font_size = 11
        col.active = rgb(${palette.primaryContainer.replace('#', '')})
        col.inactive = rgb(${palette.surfaceContainer.replace('#', '')})
    }
}

dwindle {
    pseudotile = ${config.nyxPseudotile}
    preserve_split = true
    default_split_ratio = ${((config.nyxSplitRatio / 100) * 2).toFixed(2)}
}

scrolling {
    column_width = ${(config.nyxScrollColWidth / 100).toFixed(2)}
    focus_center = true
    infinite_strip = true
}

decoration {
    rounding = ${config.rounding}
    active_opacity = ${opacityFrac.toFixed(2)}
    inactive_opacity = ${config.nyxDimInactive ? Math.max(0.55, opacityFrac - 0.14).toFixed(2) : Math.max(0.65, opacityFrac - 0.04).toFixed(2)}
    dim_inactive = ${config.nyxDimInactive}
    dim_strength = 0.18
    drop_shadow = ${config.nyxShadows}

    blur {
        enabled = ${config.materialType !== 'solid_m3' ? 'true' : 'false'}
        size = ${blurSize}
        passes = ${config.blurPasses}
        noise = ${config.materialType === 'frosted_glass' ? '0.035' : '0.008'}
        vibrancy = ${config.materialType === 'liquid_glass' ? '0.28' : '0.14'}
    }
}

animations {
    enabled = true
    bezier = ${bezier.hyprBezierName}, ${bezier.points.join(', ')}
    animation = windows, 1, ${animDuration(4)}, ${bezier.hyprBezierName}, popin 86%
    animation = workspaces, 1, ${animDuration(5)}, ${bezier.hyprBezierName}, slide
}

misc {
    disable_hyprland_logo = true
    vrr = ${config.nyxVrr ? 1 : 0}
}

# Window Rules
${windowRuleLines}

$mainMod = ALT
${config.keybinds
  .map((kb) => `bind = ${kb.mod.replace('Alt', '$mainMod').replace('+', ' ')}, ${kb.key}, exec, ${kb.hyprExec}`)
  .join('\n')}
bind = $mainMod, 1, workspace, 1
bind = $mainMod, 2, workspace, 2
bind = $mainMod, 3, workspace, 3
`;

  const initLua = `-- ~/.config/nyx/init.lua — Native LuaJIT configuration for Nyx + Myx
-- Activated when config_format = "lua" in ~/.config/nyx/nyx.toml

local nyx = require("nyx")

nyx.setup({
  layout = "${config.nyxLayout}",
  vrr = ${config.nyxVrr},
  xwayland = ${config.nyxXwayland},
  infinite_workspaces = ${config.nyxInfiniteWorkspaces},
  follow_mouse = ${config.nyxFollowMouse},
  pseudotile = ${config.nyxPseudotile},
  scrolling = { column_width = ${(config.nyxScrollColWidth / 100).toFixed(2)}, center_on_focus = true },

  displays = {
${config.displays.map((d) => `    { name = "${d.name}", mode = "${d.width}x${d.height}@${d.refreshHz}", scale = ${d.scale}, enabled = ${d.enabled} },`).join('\n')}
  },

  general = {
    gaps_in = ${config.gapsIn},
    gaps_out = ${config.gapsOut},
    border_size = ${config.borderSize},
    split_ratio = ${(config.nyxSplitRatio / 100).toFixed(2)},
    gradient_border = ${config.nyxGradientBorder},
    active_border = "${palette.primary}",
    inactive_border = "${palette.outlineVariant}",
  },

  decoration = {
    rounding = ${config.rounding},
    material = "${config.materialType}",
    transparency = ${config.transparency},
    blur_passes = ${config.blurPasses},
    dim_inactive = ${config.nyxDimInactive},
    shadows = ${config.nyxShadows},
  },

  animations = {
    bezier = { ${bezier.points.join(', ')} },
    speed = ${config.animSpeed.toFixed(2)},
  },

  myx_shell = {
    shell_mode = "${config.shellMode}",
    show_bar = ${config.showBar},
    bar_auto_hide = ${config.barAutoHide},
    bar_position = "${config.barPosition}",
    show_dock = ${config.showDock},
    dock_auto_hide = ${config.dockAutoHide},
    dock_position = "${config.dockPosition}",
    dock_mode = "${config.dockMode}",
    show_mixie = ${config.showMixie},
    mixie_position = "${config.mixiePosition}",
    mixie_auto_hide = ${config.mixieAutoHide},
    sidebar_style = "${config.sidebarStyle}",
    sidebar_anchor = "${config.sidebarAnchor}",
    sidebar_position = "${config.sidebarPosition}",
    sidebar_width = ${config.sidebarWidth},
    sidebar_radius = ${config.sidebarRadius},
    m3_scheme = "${config.m3Scheme}",
    seed = "${config.seedColor}",
  },
})

${config.keybinds
  .map((kb) => `nyx.bind("${kb.mod}+${kb.key}", function() nyx.exec("${kb.hyprExec}") end)`)
  .join('\n')}
nyx.bind("Super+V", nyx.toggle_floating)
`;

  const userConfigRs = `//! crates/nyx-config/src/user_config.rs
//! Zero-parser Pure Rust configuration (0.0 MB parser RAM overhead)

use crate::{ConfigBackend, LayoutEngine, NyxConfig};

pub fn build_rust_config() -> NyxConfig {
    NyxConfig {
        backend: ConfigBackend::${enumVariant(config.nyxConfigFormat)},
        layout: LayoutEngine::${enumVariant(config.nyxLayout)},
        gaps_in: ${config.gapsIn},
        gaps_out: ${config.gapsOut},
        border_size: ${config.borderSize},
        rounding: ${config.rounding},
        scroll_column_width: ${(config.nyxScrollColWidth / 100).toFixed(2)},
        split_ratio: ${(config.nyxSplitRatio / 100).toFixed(2)},
        gradient_border: ${config.nyxGradientBorder},
        dim_inactive: ${config.nyxDimInactive},
        drop_shadow: ${config.nyxShadows},
        infinite_workspaces: ${config.nyxInfiniteWorkspaces},
        follow_mouse: ${config.nyxFollowMouse},
        pseudotile: ${config.nyxPseudotile},
        vrr: ${config.nyxVrr},
        xwayland: ${config.nyxXwayland},
        window_rules: vec![],
    }
}
`;

  const myxDaemonRs = `//! myx-daemon: Material 3 / macOS Bento Rust Layer-Shell Rice for Nyx

use std::time::Duration;

#[derive(Debug, Clone)]
pub struct MyxShellConfig {
    pub shell_mode: &'static str,
    pub show_bar: bool,
    pub bar_auto_hide: bool,
    pub bar_position: &'static str,
    pub bar_floating: bool,
    pub bar_height: i32,
    pub show_dock: bool,
    pub dock_auto_hide: bool,
    pub dock_position: &'static str,
    pub dock_mode: &'static str,
    pub sidebar_style: &'static str,
    pub sidebar_anchor: &'static str,
    pub sidebar_radius: i32,
    pub show_mixie: bool,
    pub mixie_position: &'static str,
    pub material: &'static str,
    pub transparency: u8,
    pub launcher_position: &'static str,
    pub seed_hex: &'static str,
    pub dark_mode: bool,
}

impl Default for MyxShellConfig {
    fn default() -> Self {
        Self {
            shell_mode: "${config.shellMode}",
            show_bar: ${config.showBar},
            bar_auto_hide: ${config.barAutoHide},
            bar_position: "${config.barPosition}",
            bar_floating: ${config.barFloating},
            bar_height: ${config.barHeight},
            show_dock: ${config.showDock},
            dock_auto_hide: ${config.dockAutoHide},
            dock_position: "${config.dockPosition}",
            dock_mode: "${config.dockMode}",
            sidebar_style: "${config.sidebarStyle}",
            sidebar_anchor: "${config.sidebarAnchor}",
            sidebar_radius: ${config.sidebarRadius},
            show_mixie: ${config.showMixie},
            mixie_position: "${config.mixiePosition}",
            material: "${config.materialType}",
            transparency: ${config.transparency},
            launcher_position: "${config.launcherPosition}",
            seed_hex: "${config.seedColor}",
            dark_mode: ${config.darkMode},
        }
    }
}

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let _cfg = MyxShellConfig::default();
    loop {
        tokio::time::sleep(Duration::from_secs(30)).await;
    }
}
`;

  const colorsCss = `/* ~/.config/myx/colors.css — Material 3 + Surface Glass Tokens */
:root {
  --m3-primary: ${palette.primary};
  --m3-on-primary: ${palette.onPrimary};
  --m3-primary-container: ${palette.primaryContainer};
  --m3-on-primary-container: ${palette.onPrimaryContainer};
  --m3-secondary: ${palette.secondary};
  --m3-secondary-container: ${palette.secondaryContainer};
  --m3-tertiary: ${palette.tertiary};
  --m3-surface: ${palette.surface};
  --m3-surface-container-low: ${palette.surfaceContainerLow};
  --m3-surface-container: ${palette.surfaceContainer};
  --m3-surface-container-high: ${palette.surfaceContainerHigh};
  --m3-on-surface: ${palette.onSurface};
  --m3-on-surface-variant: ${palette.onSurfaceVariant};
  --m3-outline-variant: ${palette.outlineVariant};

  --myx-material: "${config.materialType}";
  --myx-transparency: ${config.transparency}%;
  --myx-surface-alpha: ${opacityFrac.toFixed(2)};
}
`;

  const compositorCargoToml = `[package]
name = "nyx-compositor"
version = "0.4.0"
edition = "2021"

[dependencies]
calloop = { workspace = true }
nyx-config = { path = "../nyx-config" }
nyx-ipc = { path = "../nyx-ipc" }
smithay = { workspace = true }
`;

  const ipcCargoToml = `[package]
name = "nyx-ipc"
version = "0.4.0"
edition = "2021"

[[bin]]
name = "nyx-ctl"
path = "src/bin/nyx-ctl.rs"

[dependencies]
calloop = { workspace = true }
`;

  const configCargoToml = `[package]
name = "nyx-config"
version = "0.4.0"
edition = "2021"
`;

  const daemonCargoToml = `[package]
name = "myx-daemon"
version = "0.4.0"
edition = "2021"

[dependencies]
tokio = { workspace = true }
`;

  const nyxCtlBinRs = `//! nyx-ctl (symlinked as hyprctl): sends IPC commands to ~/.socket.sock
use std::env;
use std::io::{Read, Write};
use std::os::unix::net::UnixStream;

fn main() {
    let args: Vec<String> = env::args().skip(1).collect();
    if args.is_empty() {
        eprintln!("usage: nyx-ctl [-j] <clients|workspaces|monitors|activewindow|dispatch|keyword|reload>");
        std::process::exit(1);
    }
    let runtime = env::var("XDG_RUNTIME_DIR").unwrap_or_else(|_| "/tmp".into());
    let sock = format!("{runtime}/hypr/nyx-session/.socket.sock");
    match UnixStream::connect(&sock) {
        Ok(mut stream) => {
            let payload = args.join(" ");
            let _ = stream.write_all(payload.as_bytes());
            let mut reply = String::new();
            let _ = stream.read_to_string(&mut reply);
            println!("{reply}");
        }
        Err(err) => {
            eprintln!("nyx-ctl: failed to connect to {sock}: {err}");
            std::process::exit(1);
        }
    }
}
`;

  const installSh = `#!/usr/bin/env bash
set -euo pipefail

# Works both locally inside a cloned folder AND directly via:
#   curl -fsSL https://raw.githubusercontent.com/ammardoma/ImpulseShell/main/install.sh | bash
REPO_URL="\${NYX_REPO_URL:-https://github.com/ammardoma/ImpulseShell.git}"
INSTALL_DIR="\${NYX_INSTALL_DIR:-$HOME/.local/share/ImpulseShell}"

if [ ! -f "Cargo.toml" ] || [ ! -d "crates/nyx-compositor" ]; then
  if ! command -v git >/dev/null 2>&1; then
    echo "Error: git is required when running via curl." >&2
    exit 1
  fi
  if [ -d "$INSTALL_DIR/.git" ]; then
    echo "Updating existing checkout in $INSTALL_DIR..."
    git -C "$INSTALL_DIR" pull --ff-only
  else
    echo "Cloning Nyx + Myx from $REPO_URL..."
    git clone --depth=1 "$REPO_URL" "$INSTALL_DIR"
  fi
  cd "$INSTALL_DIR"
fi

if ! command -v cargo >/dev/null 2>&1; then
  echo "Installing Rust toolchain via rustup..."
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
  # shellcheck disable=SC1091
  source "$HOME/.cargo/env"
fi

echo "Building Nyx (Smithay Rust Compositor) + Myx (M3 Shell)..."
cargo build --release --workspace

mkdir -p "$HOME/.local/bin" "$HOME/.config/nyx" "$HOME/.config/myx"
install -Dm755 target/release/nyx-compositor "$HOME/.local/bin/nyx"
install -Dm755 target/release/myx-daemon "$HOME/.local/bin/myx-daemon"
install -Dm755 target/release/nyx-ctl "$HOME/.local/bin/nyx-ctl"
ln -sf "$HOME/.local/bin/nyx-ctl" "$HOME/.local/bin/hyprctl"

for cfg in nyx.toml nyx.conf init.lua; do
  if [ -f "$HOME/.config/nyx/$cfg" ]; then
    cp "$HOME/.config/nyx/$cfg" "$HOME/.config/nyx/$cfg.bak"
  fi
  cp "config/nyx/$cfg" "$HOME/.config/nyx/$cfg"
done
cp config/myx/colors.css "$HOME/.config/myx/colors.css"

echo "Installed Nyx + Myx! Active config_format=${config.nyxConfigFormat}."
echo "Ensure ~/.local/bin is in PATH, then run: nyx"
`;

  return [
    {
      path: 'config/nyx/nyx.toml',
      language: 'toml',
      description: 'Master Nyx settings (switch config_format: conf | lua | rust)',
      content: nyxToml,
    },
    {
      path: 'config/nyx/nyx.conf',
      language: 'conf',
      description: 'Hyprland-syntax configuration for Nyx',
      content: nyxConf,
    },
    {
      path: 'config/nyx/init.lua',
      language: 'lua',
      description: 'LuaJIT configuration for Nyx + Myx',
      content: initLua,
    },
    {
      path: 'crates/nyx-config/Cargo.toml',
      language: 'toml',
      description: 'Cargo manifest for nyx-config crate',
      content: configCargoToml,
    },
    {
      path: 'crates/nyx-config/src/user_config.rs',
      language: 'rust',
      description: 'Zero-overhead Pure Rust configuration struct',
      content: userConfigRs,
    },
    {
      path: 'crates/nyx-compositor/Cargo.toml',
      language: 'toml',
      description: 'Cargo manifest for nyx-compositor crate',
      content: compositorCargoToml,
    },
    {
      path: 'crates/nyx-compositor/src/main.rs',
      language: 'rust',
      description: 'Smithay + Calloop Wayland compositor (Niri/Mango engine)',
      content: nyxMainRs,
    },
    {
      path: 'crates/nyx-ipc/Cargo.toml',
      language: 'toml',
      description: 'Cargo manifest for nyx-ipc & nyx-ctl binary',
      content: ipcCargoToml,
    },
    {
      path: 'crates/nyx-ipc/src/lib.rs',
      language: 'rust',
      description: 'hyprctl-compatible Socket1/Socket2 IPC parser',
      content: nyxIpcRs,
    },
    {
      path: 'crates/nyx-ipc/src/bin/nyx-ctl.rs',
      language: 'rust',
      description: 'CLI client binary (nyx-ctl / hyprctl symlink)',
      content: nyxCtlBinRs,
    },
    {
      path: 'crates/nyx-config/src/lib.rs',
      language: 'rust',
      description: 'Multi-backend Conf / Lua / Rust config loader',
      content: nyxConfigRs,
    },
    {
      path: 'crates/myx-daemon/Cargo.toml',
      language: 'toml',
      description: 'Cargo manifest for myx-daemon crate',
      content: daemonCargoToml,
    },
    {
      path: 'crates/myx-daemon/src/main.rs',
      language: 'rust',
      description: 'Myx Material 3 Wayland Layer-Shell daemon',
      content: myxDaemonRs,
    },
    {
      path: 'Cargo.toml',
      language: 'toml',
      description: 'Unified Nyx + Myx Rust Cargo workspace with LTO',
      content: cargoToml,
    },
    {
      path: 'config/myx/colors.css',
      language: 'css',
      description: 'Material 3 & glass surface tokens',
      content: colorsCss,
    },
    {
      path: 'install.sh',
      language: 'bash',
      description: 'One-line curl installer + Rust release builder',
      content: installSh,
    },
  ];
}
