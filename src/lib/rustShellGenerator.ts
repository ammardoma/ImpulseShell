import { BEZIER_PRESETS, WALLPAPERS } from './m3Engine';
import { M3Palette, ShellConfig } from '../types/shell';

export interface GeneratedDotfile {
  path: string;
  language: 'bash' | 'conf' | 'json' | 'css' | 'ini' | 'kdl' | 'markdown' | 'toml';
  description: string;
  content: string;
}

function hexNoHash(hex: string): string {
  return hex.replace('#', '');
}

function hexToRgbaCss(hex: string, alpha: number): string {
  const clean = hexNoHash(hex);
  const r = parseInt(clean.slice(0, 2), 16) || 20;
  const g = parseInt(clean.slice(2, 4), 16) || 20;
  const b = parseInt(clean.slice(4, 6), 16) || 28;
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
}

export function generateRustShellFiles(config: ShellConfig, palette: M3Palette): GeneratedDotfile[] {
  const bezier = BEZIER_PRESETS.find((b) => b.id === config.bezierPreset) ?? BEZIER_PRESETS[0];
  const wallpaper = WALLPAPERS.find((w) => w.id === config.wallpaperId) ?? WALLPAPERS[0];

  const animDuration = (baseDs: number) => Math.max(1, Math.round(baseDs * config.animSpeed));
  const opacityFrac = Math.max(0.45, Math.min(1, 1 - config.transparency / 100));
  const surfaceAlpha = Math.max(0.38, Math.min(0.96, 1 - (config.transparency * 0.72) / 100));
  const blurSize =
    config.materialType === 'solid_m3'
      ? 0
      : config.materialType === 'liquid_glass'
        ? Math.round(6 + config.transparency * 0.08)
        : config.materialType === 'frosted_glass'
          ? Math.round(18 + config.transparency * 0.18)
          : Math.round(12 + config.transparency * 0.12);

  const isMixie = config.shellMode === 'mixi';
  const barPos = isMixie ? config.mixiePosition : config.barPosition;
  const hyprLayout = config.nyxLayout === 'master' ? 'master' : 'dwindle';

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
      const matcher = `class:^(${r.appClass})$`;
      if (r.forceFloating) rules.push(`windowrulev2 = float, ${matcher}`);
      if (r.pin) rules.push(`windowrulev2 = pin, ${matcher}`);
      if (r.defaultWorkspace) rules.push(`windowrulev2 = workspace ${r.defaultWorkspace}, ${matcher}`);
      if (r.opacityOverride !== undefined) {
        const o = (r.opacityOverride / 100).toFixed(2);
        rules.push(`windowrulev2 = opacity ${o} ${o}, ${matcher}`);
      }
      if (r.noBlur) rules.push(`windowrulev2 = noblur, ${matcher}`);
      return rules;
    })
    .join('\n');

  const hyprlandConf = `# ~/.config/hypr/hyprland.conf — ImpulseShell (Nyx + Myx) Real Linux Wayland DE
# Wallpaper Preset: ${wallpaper.name} | M3 Seed: ${config.seedColor} (${config.darkMode ? 'Dark' : 'Light'})
# Shell Mode: ${isMixie ? 'Mixie Dynamic Island' : 'Material 3 Top Bar'} | Material: ${config.materialType}

# === Monitors (Auto-fallback catches any connected display) ===
monitor = , preferred, auto, 1
${monitorLines}

# === Environment Variables ===
env = XDG_CURRENT_DESKTOP,Hyprland
env = XDG_SESSION_TYPE,wayland
env = XDG_SESSION_DESKTOP,Hyprland
env = QT_QPA_PLATFORM,wayland;xcb
env = QT_QPA_PLATFORMTHEME,qt6ct
env = GDK_BACKEND,wayland,x11,*
env = SDL_VIDEODRIVER,wayland
env = MOZ_ENABLE_WAYLAND,1
env = ELECTRON_OZONE_PLATFORM_HINT,auto
env = XCURSOR_SIZE,24

# === Core ImpulseShell Daemons ===
exec-once = waybar
exec-once = swaync
exec-once = swww-daemon && sleep 0.4 && swww img ~/.config/impulse/wallpaper.png --transition-type grow --transition-fps 60
exec-once = wl-paste --type text --watch cliphist store
exec-once = wl-paste --type image --watch cliphist store
exec-once = /usr/lib/polkit-gnome/polkit-gnome-authentication-agent-1 || /usr/libexec/polkit-gnome-authentication-agent-1 || hyprpolkitagent
exec-once = nm-applet --indicator
${config.nightLightEnabled ? `exec-once = hyprsunset -t ${config.nightTempK}` : '# exec-once = hyprsunset -t ' + config.nightTempK}
${config.idleLockMinutes > 0 ? 'exec-once = hypridle' : '# exec-once = hypridle'}
${!isMixie && config.showDock ? 'exec-once = command -v nwg-dock-hyprland >/dev/null && nwg-dock-hyprland -d -i 38 -mb 10' : '# Dock disabled in Mixie mode'}

# === General & Borders ===
general {
    gaps_in = ${config.gapsIn}
    gaps_out = ${config.gapsOut}
    border_size = ${config.borderSize}
    col.active_border = ${
      config.nyxGradientBorder
        ? `rgb(${hexNoHash(palette.primary)}) rgb(${hexNoHash(palette.tertiary)}) 45deg`
        : `rgb(${hexNoHash(palette.primary)})`
    }
    col.inactive_border = rgba(${hexNoHash(palette.outlineVariant)}88)
    resize_on_border = true
    allow_tearing = false
    layout = ${hyprLayout}
}

# === Input & Gestures ===
input {
    kb_layout = us
    follow_mouse = ${config.nyxFollowMouse ? 1 : 0}
    sensitivity = 0
    touchpad {
        natural_scroll = true
        tap-to-click = true
    }
}

gestures {
    workspace_swipe = true
    workspace_swipe_fingers = 3
}

# === Tabbed Window Groups ===
group {
    col.border_active = rgb(${hexNoHash(palette.primary)})
    col.border_inactive = rgba(${hexNoHash(palette.outlineVariant)}88)
    groupbar {
        enabled = true
        font_family = JetBrainsMono Nerd Font
        font_size = 11
        height = 20
        col.active = rgb(${hexNoHash(palette.primaryContainer)})
        col.inactive = rgb(${hexNoHash(palette.surfaceContainer)})
        text_color = rgb(${hexNoHash(palette.onSurface)})
    }
}

# === Layout Engines ===
dwindle {
    pseudotile = ${config.nyxPseudotile}
    preserve_split = true
    default_split_ratio = ${((config.nyxSplitRatio / 100) * 2).toFixed(2)}
}

master {
    new_status = master
    mfact = ${(config.nyxSplitRatio / 100).toFixed(2)}
}

# === Surface Material, Rounding, Blur & Shadows ===
decoration {
    rounding = ${config.rounding}
    active_opacity = ${opacityFrac.toFixed(2)}
    inactive_opacity = ${
      config.nyxDimInactive
        ? Math.max(0.6, opacityFrac - 0.12).toFixed(2)
        : Math.max(0.75, opacityFrac - 0.04).toFixed(2)
    }
    dim_inactive = ${config.nyxDimInactive}
    dim_strength = 0.16

    shadow {
        enabled = ${config.nyxShadows}
        range = 20
        render_power = 3
        color = rgba(00000055)
    }

    blur {
        enabled = ${config.materialType !== 'solid_m3' ? 'true' : 'false'}
        size = ${Math.max(1, blurSize)}
        passes = ${Math.max(1, config.blurPasses)}
        new_optimizations = true
        xray = false
        noise = ${config.materialType === 'frosted_glass' ? '0.03' : '0.01'}
        vibrancy = ${config.materialType === 'liquid_glass' ? '0.28' : '0.16'}
    }
}

# === Layer Shell Blur (Mixie Island / Waybar / SwayNC / Fuzzel) ===
layerrule = blur, waybar
layerrule = ignorezero, waybar
layerrule = blur, swaync-control-center
layerrule = blur, swaync-notification-window
layerrule = ignorezero, swaync-control-center
layerrule = ignorezero, swaync-notification-window
layerrule = blur, launcher
layerrule = ignorezero, launcher

# === Animations ===
animations {
    enabled = true
    bezier = impulse, ${bezier.points.join(', ')}
    animation = windows, 1, ${animDuration(4)}, impulse, popin 86%
    animation = windowsOut, 1, ${animDuration(4)}, impulse, popin 86%
    animation = border, 1, ${animDuration(6)}, default
    animation = fade, 1, ${animDuration(4)}, impulse
    animation = workspaces, 1, ${animDuration(5)}, impulse, slide
    animation = specialWorkspace, 1, ${animDuration(4)}, impulse, slidevert
}

misc {
    force_default_wallpaper = 0
    disable_hyprland_logo = true
    disable_splash_rendering = true
    vrr = ${config.nyxVrr ? 1 : 0}
}

# === Window Rules ===
windowrulev2 = suppressevent maximize, class:.*
windowrulev2 = float, class:^(pavucontrol|blueman-manager|nm-connection-editor)$
${windowRuleLines}

# === Keybindings ===
$mainMod = SUPER
$altMod = ALT

# Core Apps & ImpulseShell Overlays
bind = $altMod, SPACE, exec, pgrep -x fuzzel >/dev/null && pkill fuzzel || fuzzel
bind = $mainMod, SPACE, exec, pgrep -x fuzzel >/dev/null && pkill fuzzel || fuzzel
bind = $mainMod, RETURN, exec, kitty
bind = $altMod, RETURN, exec, kitty
bind = $mainMod, E, exec, nautilus || thunar || dolphin || kitty -e yazi
bind = $mainMod, B, exec, firefox || chromium || xdg-open https://
bind = $mainMod, N, exec, swaync-client -t -sw
bind = $altMod, N, exec, swaync-client -t -sw
bind = $mainMod, L, exec, hyprlock
bind = $mainMod, V, exec, cliphist list | fuzzel --dmenu -p "Clipboard " | cliphist decode | wl-copy
bind = $mainMod SHIFT, S, exec, impulse-screenshot region
bind = , PRINT, exec, impulse-screenshot full
bind = $mainMod SHIFT, P, exec, impulse-picker
bind = $mainMod SHIFT, N, exec, impulse-sunset

# Window Management (Hyprland Parity)
bind = $mainMod, Q, killactive,
bind = $altMod, Q, killactive,
bind = $mainMod, F, togglefloating,
bind = $mainMod SHIFT, F, fullscreen, 0
bind = $mainMod, M, fullscreen, 1
bind = $mainMod, P, pseudo,
bind = $mainMod, J, togglesplit,
bind = $mainMod, G, togglegroup,
bind = $mainMod, TAB, changegroupactive, f
bind = $altMod, TAB, cyclenext,
bind = $mainMod, S, togglespecialworkspace, scratchpad
bind = $mainMod SHIFT, D, movetoworkspace, special:scratchpad

# Focus & Move (Arrow Keys + Vim Keys)
bind = $mainMod, left, movefocus, l
bind = $mainMod, right, movefocus, r
bind = $mainMod, up, movefocus, u
bind = $mainMod, down, movefocus, d
bind = $mainMod, H, movefocus, l
bind = $mainMod, K, movefocus, u

# Workspaces 1..9 + Scroll Wheel
bind = $mainMod, 1, workspace, 1
bind = $mainMod, 2, workspace, 2
bind = $mainMod, 3, workspace, 3
bind = $mainMod, 4, workspace, 4
bind = $mainMod, 5, workspace, 5
bind = $mainMod, 6, workspace, 6
bind = $mainMod, 7, workspace, 7
bind = $mainMod, 8, workspace, 8
bind = $mainMod, 9, workspace, 9
bind = $mainMod SHIFT, 1, movetoworkspace, 1
bind = $mainMod SHIFT, 2, movetoworkspace, 2
bind = $mainMod SHIFT, 3, movetoworkspace, 3
bind = $mainMod SHIFT, 4, movetoworkspace, 4
bind = $mainMod SHIFT, 5, movetoworkspace, 5
bind = $mainMod SHIFT, 6, movetoworkspace, 6
bind = $mainMod SHIFT, 7, movetoworkspace, 7
bind = $mainMod SHIFT, 8, movetoworkspace, 8
bind = $mainMod SHIFT, 9, movetoworkspace, 9
bind = $mainMod, mouse_down, workspace, e+1
bind = $mainMod, mouse_up, workspace, e-1

# Mouse Move / Resize Floating & Tiled Windows
bindm = $mainMod, mouse:272, movewindow
bindm = $mainMod, mouse:273, resizewindow

# Media, Volume & Brightness Hardware Keys
bindel = , XF86AudioRaiseVolume, exec, wpctl set-volume -l 1.5 @DEFAULT_AUDIO_SINK@ 5%+
bindel = , XF86AudioLowerVolume, exec, wpctl set-volume @DEFAULT_AUDIO_SINK@ 5%-
bindl = , XF86AudioMute, exec, wpctl set-mute @DEFAULT_AUDIO_SINK@ toggle
bindl = , XF86AudioPlay, exec, playerctl play-pause
bindl = , XF86AudioNext, exec, playerctl next
bindl = , XF86AudioPrev, exec, playerctl previous
bindel = , XF86MonBrightnessUp, exec, brightnessctl set +5%
bindel = , XF86MonBrightnessDown, exec, brightnessctl set 5%-
`;

  const niriKdl = `// ~/.config/niri/config.kdl — Optional Niri Infinite-Scrolling Session for ImpulseShell
// Launch via: niri-session (if you installed niri alongside Hyprland)

input {
    keyboard {
        xkb {
            layout "us"
        }
    }
    touchpad {
        tap
        natural-scroll
    }
    ${config.nyxFollowMouse ? 'focus-follows-mouse' : '// focus-follows-mouse'}
}

layout {
    gaps ${config.gapsIn}
    center-focused-column "on-overflow"
    default-column-width { proportion ${(config.nyxScrollColWidth / 100).toFixed(2)}; }
    preset-column-widths {
        proportion 0.33333
        proportion 0.5
        proportion 0.66667
        proportion 0.85
    }
    focus-ring {
        width ${config.borderSize}
        active-color "${palette.primary}"
        inactive-color "${palette.outlineVariant}"
    }
}

window-rule {
    geometry-corner-radius ${config.rounding}
    clip-to-geometry true
}

spawn-at-startup "waybar"
spawn-at-startup "swaync"
spawn-at-startup "swww-daemon"
${config.nightLightEnabled ? `spawn-at-startup "hyprsunset" "-t" "${config.nightTempK}"` : ''}

binds {
    Alt+Space { spawn "fuzzel"; }
    Mod+Return { spawn "kitty"; }
    Mod+N { spawn "swaync-client" "-t" "-sw"; }
    Mod+Q { close-window; }
    Mod+Left { focus-column-left; }
    Mod+Right { focus-column-right; }
    Mod+Shift+Left { move-column-left; }
    Mod+Shift+Right { move-column-right; }
    Mod+R { switch-preset-column-width; }
    Mod+F { maximize-column; }
    Mod+Shift+F { fullscreen-window; }
    Mod+1 { focus-workspace 1; }
    Mod+2 { focus-workspace 2; }
    Mod+3 { focus-workspace 3; }
    Mod+4 { focus-workspace 4; }
    Mod+Shift+E { quit; }
}
`;

  const hypridleConf = `# ~/.config/hypr/hypridle.conf — Auto-lock & Screen Sleep
general {
    lock_cmd = pidof hyprlock || hyprlock
    before_sleep_cmd = loginctl lock-session
    after_sleep_cmd = hyprctl dispatch dpms on
}

listener {
    timeout = ${Math.max(60, (config.idleLockMinutes || 5) * 60)}
    on-timeout = loginctl lock-session
}

listener {
    timeout = ${Math.max(120, (config.idleLockMinutes || 5) * 60 + 120)}
    on-timeout = hyprctl dispatch dpms off
    on-resume = hyprctl dispatch dpms on
}
`;

  const hyprlockConf = `# ~/.config/hypr/hyprlock.conf — ImpulseShell Material 3 Lock Screen
general {
    hide_cursor = true
    grace = 2
}

background {
    monitor =
    path = screenshot
    blur_passes = 3
    blur_size = 8
    brightness = 0.72
}

label {
    monitor =
    text = $TIME
    color = rgb(${hexNoHash(palette.onSurface)})
    font_size = 76
    font_family = JetBrainsMono Nerd Font Bold
    position = 0, 110
    halign = center
    valign = center
}

label {
    monitor =
    text = cmd[update:60000] date +"%A, %B %d"
    color = rgb(${hexNoHash(palette.onSurfaceVariant)})
    font_size = 18
    font_family = JetBrainsMono Nerd Font
    position = 0, 35
    halign = center
    valign = center
}

input-field {
    monitor =
    size = 280, 48
    outline_thickness = 2
    dots_size = 0.25
    dots_spacing = 0.25
    outer_color = rgb(${hexNoHash(palette.primary)})
    inner_color = rgba(${hexNoHash(palette.surfaceContainer)}cc)
    font_color = rgb(${hexNoHash(palette.onSurface)})
    fade_on_empty = false
    rounding = ${Math.max(14, config.rounding)}
    placeholder_text = <span foreground="##${hexNoHash(palette.onSurfaceVariant)}">Unlock ImpulseShell...</span>
    position = 0, -55
    halign = center
    valign = center
}
`;

  const waybarConfig = isMixie
    ? `{
  "layer": "top",
  "position": "${barPos}",
  "margin-top": ${barPos === 'top' ? 10 : 0},
  "margin-bottom": ${barPos === 'bottom' ? 10 : 0},
  "exclusive": true,
  "passthrough": false,
  "gtk-layer-shell": true,

  "modules-left": [],
  "modules-center": [
    "custom/mixie-launcher",
    ${config.mixieShowWorkspaces ? '"hyprland/workspaces",' : ''}
    ${config.mixieShowMedia ? '"mpris",' : ''}
    "clock",
    "pulseaudio",
    "network",
    "battery",
    "custom/control-center"
  ],
  "modules-right": [],

  "custom/mixie-launcher": {
    "format": "●",
    "tooltip-format": "ImpulseShell Search (Alt+Space)",
    "on-click": "pgrep -x fuzzel >/dev/null && pkill fuzzel || fuzzel",
    "on-click-right": "swaync-client -t -sw"
  },
  "hyprland/workspaces": {
    "format": "{icon}",
    "on-click": "activate",
    "format-icons": {
      "active": "●",
      "default": "○"
    },
    "persistent-workspaces": {
      "*": 4
    }
  },
  "mpris": {
    "format": "♪ {title}",
    "format-paused": "⏸ {title}",
    "max-length": 22,
    "on-click": "playerctl play-pause"
  },
  "clock": {
    "format": "{:%H:%M}",
    "format-alt": "{:%a %b %d  %H:%M}",
    "tooltip-format": "<tt>{calendar}</tt>"
  },
  "pulseaudio": {
    "format": "{icon} {volume}%",
    "format-muted": "󰝟",
    "format-icons": { "default": ["󰕿", "󰖀", "󰕾"] },
    "on-click": "wpctl set-mute @DEFAULT_AUDIO_SINK@ toggle",
    "on-click-right": "pavucontrol"
  },
  "network": {
    "format-wifi": "󰤨",
    "format-ethernet": "󰈀",
    "format-disconnected": "󰤭",
    "tooltip-format": "{essid} ({signalStrength}%)"
  },
  "battery": {
    "format": "{icon} {capacity}%",
    "format-icons": ["󰁺", "󰁼", "󰁾", "󰂀", "󰁹"]
  },
  "custom/control-center": {
    "format": "󰂚",
    "tooltip-format": "Open ImpulseShell Control Center (Super+N)",
    "on-click": "swaync-client -t -sw"
  }
}
`
    : `{
  "layer": "top",
  "position": "${barPos}",
  "height": ${config.barHeight},
  "margin-top": ${config.barFloating && barPos === 'top' ? 8 : 0},
  "margin-bottom": ${config.barFloating && barPos === 'bottom' ? 8 : 0},
  "margin-left": ${config.barFloating ? 12 : 0},
  "margin-right": ${config.barFloating ? 12 : 0},
  "spacing": 6,

  "modules-left": ["custom/launcher", "hyprland/workspaces", "hyprland/window"],
  "modules-center": ["clock", "mpris"],
  "modules-right": ["tray", "cpu", "memory", "pulseaudio", "network", "battery", "custom/control-center"],

  "custom/launcher": {
    "format": "󰀻",
    "tooltip-format": "App Launcher (Alt+Space)",
    "on-click": "pgrep -x fuzzel >/dev/null && pkill fuzzel || fuzzel"
  },
  "hyprland/workspaces": {
    "format": "{id}",
    "on-click": "activate",
    "persistent-workspaces": { "*": 5 }
  },
  "hyprland/window": {
    "max-length": 36,
    "separate-outputs": true
  },
  "clock": {
    "format": "{:%a %b %d   %H:%M}",
    "tooltip-format": "<tt>{calendar}</tt>"
  },
  "mpris": {
    "format": "♪ {title}",
    "max-length": 24,
    "on-click": "playerctl play-pause"
  },
  "cpu": { "format": "󰻠 {usage}%" },
  "memory": { "format": "󰍛 {percentage}%" },
  "pulseaudio": {
    "format": "{icon} {volume}%",
    "format-muted": "󰝟 Muted",
    "format-icons": { "default": ["󰕿", "󰖀", "󰕾"] },
    "on-click": "wpctl set-mute @DEFAULT_AUDIO_SINK@ toggle",
    "on-click-right": "pavucontrol"
  },
  "network": {
    "format-wifi": "󰤨 {essid}",
    "format-ethernet": "󰈀 Wired",
    "format-disconnected": "󰤭 Offline"
  },
  "battery": {
    "format": "{icon} {capacity}%",
    "format-icons": ["󰁺", "󰁼", "󰁾", "󰂀", "󰁹"]
  },
  "tray": { "spacing": 8 },
  "custom/control-center": {
    "format": "󰂚",
    "tooltip-format": "Control Center (Super+N)",
    "on-click": "swaync-client -t -sw"
  }
}
`;

  const waybarStyleCss = `/* ~/.config/waybar/style.css — ImpulseShell (${isMixie ? 'Mixie Dynamic Island' : 'Material 3 Bar'}) */
* {
  font-family: "JetBrainsMono Nerd Font", "Inter", sans-serif;
  font-size: 12.5px;
  font-weight: 600;
  border: none;
  min-height: 0;
}

window#waybar {
  background: ${isMixie ? 'transparent' : hexToRgbaCss(palette.surfaceContainer, surfaceAlpha)};
  color: ${palette.onSurface};
  border-radius: ${isMixie ? 0 : config.barFloating ? Math.max(12, config.rounding) : 0}px;
  border: ${isMixie ? 'none' : `1px solid ${hexToRgbaCss(palette.outlineVariant, 0.45)}`};
}

${
  isMixie
    ? `.modules-center {
  background: ${hexToRgbaCss(palette.surfaceContainerLowest, Math.min(0.94, surfaceAlpha + 0.08))};
  border: 1px solid ${hexToRgbaCss(palette.outlineVariant, 0.5)};
  border-radius: 999px;
  padding: 5px 14px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
}`
    : `.modules-left, .modules-center, .modules-right {
  padding: 2px 8px;
}`
}

#custom-mixie-launcher,
#custom-launcher {
  color: ${palette.primary};
  font-size: 15px;
  padding: 0 10px 0 4px;
}

#workspaces button {
  color: ${palette.onSurfaceVariant};
  padding: 2px 8px;
  margin: 2px 2px;
  border-radius: 999px;
  transition: all 160ms ease;
}

#workspaces button.active {
  background: ${palette.primary};
  color: ${palette.onPrimary};
}

#workspaces button:hover {
  background: ${palette.surfaceContainerHigh};
  color: ${palette.onSurface};
}

#clock,
#mpris,
#pulseaudio,
#network,
#battery,
#cpu,
#memory,
#custom-control-center {
  padding: 3px 10px;
  margin: 2px 2px;
  border-radius: 999px;
  background: ${isMixie ? 'transparent' : hexToRgbaCss(palette.surfaceContainerHigh, 0.65)};
  color: ${palette.onSurface};
}

#mpris {
  color: ${palette.primary};
}

#custom-control-center {
  background: ${palette.primaryContainer};
  color: ${palette.onPrimaryContainer};
}
`;

  const swayncConfig = `{
  "positionX": "${config.sidebarPosition}",
  "positionY": "top",
  "layer": "overlay",
  "control-center-layer": "top",
  "layer-shell": true,
  "cssPriority": "user",
  "control-center-margin-top": ${config.sidebarAnchor === 'popover' ? 14 : 0},
  "control-center-margin-bottom": ${config.sidebarAnchor === 'popover' ? 14 : 0},
  "control-center-margin-right": ${config.sidebarAnchor === 'popover' ? 14 : 0},
  "control-center-margin-left": ${config.sidebarAnchor === 'popover' ? 14 : 0},
  "control-center-width": ${config.sidebarWidth},
  "notification-window-width": 360,
  "widgets": [
    "title",
    "buttons-grid",
    "volume",
    "backlight",
    "mpris",
    "dnd",
    "notifications"
  ],
  "widget-config": {
    "title": {
      "text": "ImpulseShell Control Center",
      "clear-all-button": true,
      "button-text": "Clear All"
    },
    "dnd": {
      "text": "Do Not Disturb"
    },
    "volume": {
      "label": "󰕾"
    },
    "backlight": {
      "label": "󰃠"
    },
    "mpris": {
      "image-size": 56,
      "image-radius": 12
    },
    "buttons-grid": {
      "actions": [
        { "label": "󰤨 Wi-Fi", "command": "nm-connection-editor" },
        { "label": "󰂯 BT", "command": "blueman-manager" },
        { "label": "󰖔 Sunset", "command": "impulse-sunset" },
        { "label": "󰈊 Picker", "command": "impulse-picker" },
        { "label": "󰄀 Snip", "command": "impulse-screenshot region" },
        { "label": "󰌾 Lock", "command": "hyprlock" }
      ]
    }
  }
}
`;

  const swayncStyleCss = `/* ~/.config/swaync/style.css — ImpulseShell ${config.sidebarStyle.toUpperCase()} Control Center */
* {
  font-family: "Inter", "JetBrainsMono Nerd Font", sans-serif;
}

.control-center {
  background: ${hexToRgbaCss(palette.surfaceContainer, Math.min(0.95, surfaceAlpha + 0.06))};
  border: 1px solid ${hexToRgbaCss(palette.outlineVariant, 0.55)};
  border-radius: ${config.sidebarAnchor === 'popover' ? config.sidebarRadius : 0}px;
  color: ${palette.onSurface};
  padding: 14px;
}

.widget-title {
  color: ${palette.onSurface};
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 10px;
}

.widget-title > button {
  background: ${palette.surfaceContainerHigh};
  color: ${palette.onSurface};
  border-radius: 10px;
  padding: 4px 10px;
}

.widget-buttons-grid {
  background: ${hexToRgbaCss(palette.surfaceContainerLow, 0.85)};
  border-radius: ${Math.max(12, Math.min(20, config.sidebarRadius))}px;
  padding: 8px;
  margin-bottom: 10px;
}

.widget-buttons-grid > flowbox > flowboxchild > button {
  background: ${palette.surfaceContainerHigh};
  color: ${palette.onSurface};
  border-radius: 12px;
  padding: 10px 8px;
  margin: 4px;
  font-size: 12px;
  font-weight: 600;
}

.widget-buttons-grid > flowbox > flowboxchild > button:hover {
  background: ${palette.primaryContainer};
  color: ${palette.onPrimaryContainer};
}

.widget-volume,
.widget-backlight,
.widget-mpris,
.widget-dnd {
  background: ${hexToRgbaCss(palette.surfaceContainerLow, 0.85)};
  border-radius: 14px;
  padding: 10px 12px;
  margin-bottom: 8px;
}

scale trough {
  background: ${palette.surfaceContainerHigh};
  border-radius: 999px;
  min-height: 8px;
}

scale highlight {
  background: ${palette.primary};
  border-radius: 999px;
}

.notification {
  background: ${palette.surfaceContainerHigh};
  border: 1px solid ${hexToRgbaCss(palette.outlineVariant, 0.45)};
  border-radius: 14px;
  padding: 10px;
  color: ${palette.onSurface};
}
`;

  const fuzzelIni = `# ~/.config/fuzzel/fuzzel.ini — ImpulseShell Alt+Space Launcher
[main]
font=JetBrainsMono Nerd Font:size=12
prompt="Search ImpulseShell ❯ "
icon-theme=Papirus-Dark
width=42
lines=8
horizontal-pad=18
vertical-pad=14
inner-pad=8
layer=overlay

[colors]
background=${hexNoHash(palette.surfaceContainer)}ee
text=${hexNoHash(palette.onSurface)}ff
prompt=${hexNoHash(palette.primary)}ff
input=${hexNoHash(palette.onSurface)}ff
match=${hexNoHash(palette.primary)}ff
selection=${hexNoHash(palette.primaryContainer)}ff
selection-text=${hexNoHash(palette.onPrimaryContainer)}ff
selection-match=${hexNoHash(palette.primary)}ff
border=${hexNoHash(palette.primary)}cc

[border]
width=${Math.max(1, config.borderSize)}
radius=${Math.max(14, config.rounding)}
`;

  const kittyConf = `# ~/.config/kitty/kitty.conf — ImpulseShell GPU Wayland Terminal
font_family JetBrainsMono Nerd Font
font_size 11.5
window_padding_width 14
confirm_os_window_close 0
background_opacity ${opacityFrac.toFixed(2)}

foreground ${palette.onSurface}
background ${palette.surfaceContainerLowest}
cursor ${palette.primary}
selection_foreground ${palette.onPrimaryContainer}
selection_background ${palette.primaryContainer}

color0 ${palette.surfaceContainer}
color1 #f38ba8
color2 #a6e3a1
color3 #f9e2af
color4 ${palette.primary}
color5 ${palette.tertiary}
color6 ${palette.secondary}
color7 ${palette.onSurface}
`;

  const gtkCss = `/* ~/.config/gtk-4.0/gtk.css & gtk-3.0/gtk.css — ImpulseShell Material 3 Palette */
@define-color accent_color ${palette.primary};
@define-color accent_bg_color ${palette.primary};
@define-color accent_fg_color ${palette.onPrimary};
@define-color window_bg_color ${palette.surface};
@define-color window_fg_color ${palette.onSurface};
@define-color view_bg_color ${palette.surfaceContainerLow};
@define-color view_fg_color ${palette.onSurface};
@define-color headerbar_bg_color ${palette.surfaceContainer};
@define-color headerbar_fg_color ${palette.onSurface};
@define-color card_bg_color ${palette.surfaceContainerHigh};
@define-color card_fg_color ${palette.onSurface};
@define-color popover_bg_color ${palette.surfaceContainerHigh};
@define-color popover_fg_color ${palette.onSurface};
`;

  const colorsCss = `/* ~/.config/myx/colors.css — Material 3 & Glass Tokens */
:root {
  --m3-primary: ${palette.primary};
  --m3-on-primary: ${palette.onPrimary};
  --m3-primary-container: ${palette.primaryContainer};
  --m3-on-primary-container: ${palette.onPrimaryContainer};
  --m3-secondary: ${palette.secondary};
  --m3-tertiary: ${palette.tertiary};
  --m3-surface: ${palette.surface};
  --m3-surface-container: ${palette.surfaceContainer};
  --m3-surface-container-high: ${palette.surfaceContainerHigh};
  --m3-on-surface: ${palette.onSurface};
  --m3-on-surface-variant: ${palette.onSurfaceVariant};
  --m3-outline-variant: ${palette.outlineVariant};
}
`;

  const desktopEntry = `[Desktop Entry]
Name=ImpulseShell
Comment=ImpulseShell Wayland Desktop Environment (Hyprland + Mixie/M3 Shell)
Exec=/usr/local/bin/impulse-session
Type=Application
DesktopNames=Hyprland
`;

  const impulseSessionSh = `#!/usr/bin/env bash
# Launches the real ImpulseShell Linux Wayland Desktop Environment
export XDG_CURRENT_DESKTOP=Hyprland
export XDG_SESSION_TYPE=wayland
export XDG_SESSION_DESKTOP=Hyprland
export PATH="$HOME/.local/bin:$PATH"

if command -v Hyprland >/dev/null 2>&1; then
  exec Hyprland
elif command -v start-hyprland >/dev/null 2>&1; then
  exec start-hyprland
elif command -v niri-session >/dev/null 2>&1; then
  exec niri-session
else
  echo "Error: Neither Hyprland nor niri is installed." >&2
  exit 1
fi
`;

  const impulseScreenshotSh = `#!/usr/bin/env bash
set -euo pipefail
mkdir -p "$HOME/Pictures/Screenshots"
OUT="$HOME/Pictures/Screenshots/impulse-$(date +%Y%m%d-%H%M%S).png"
MODE="\${1:-region}"

if [ "$MODE" = "full" ]; then
  grim "$OUT"
else
  GEOM="$(slurp)" || exit 0
  grim -g "$GEOM" "$OUT"
fi

if command -v wl-copy >/dev/null 2>&1; then
  wl-copy < "$OUT"
fi
command -v notify-send >/dev/null 2>&1 && notify-send "ImpulseShell Screenshot" "Saved & copied: $OUT"
`;

  const impulsePickerSh = `#!/usr/bin/env bash
set -euo pipefail
HEX="$(hyprpicker -a 2>/dev/null || true)"
if [ -n "$HEX" ]; then
  command -v notify-send >/dev/null 2>&1 && notify-send "ImpulseShell Color Picker" "Copied $HEX to clipboard"
fi
`;

  const impulseSunsetSh = `#!/usr/bin/env bash
set -euo pipefail
TEMP="\${1:-${config.nightTempK}}"
if pgrep -x hyprsunset >/dev/null 2>&1; then
  pkill -x hyprsunset
  command -v notify-send >/dev/null 2>&1 && notify-send "ImpulseShell Night Light" "Disabled"
else
  nohup hyprsunset -t "$TEMP" >/dev/null 2>&1 &
  command -v notify-send >/dev/null 2>&1 && notify-send "ImpulseShell Night Light" "Enabled (\${TEMP}K)"
fi
`;

  const readmeMd = `# ImpulseShell

A complete, daily-driver **Linux Wayland Desktop Environment** combining **Hyprland** (plus optional **Niri** infinite-scrolling config) with a Material 3 / Liquid Glass desktop shell (**Mixie Dynamic Island** or **M3 Top Bar** via Waybar, **SwayNC** Control Center, **Fuzzel** \`Alt+Space\` launcher, **Kitty** terminal, **Hyprlock**, **Hypridle**, **Hyprsunset**, and **Hyprpicker**).

## One-Line Install (Linux)

\`\`\`bash
curl -fsSL https://raw.githubusercontent.com/ammardoma/ImpulseShell/main/install.sh | bash
\`\`\`

Supports **Arch / CachyOS / EndeavourOS / Manjaro** (\`pacman\`), **Fedora / Nobara** (\`dnf\`), and **Ubuntu / Debian** (\`apt\`).

## How to Launch
1. Log out of your current desktop session.
2. On your login screen (SDDM / GDM / greetd), select **ImpulseShell** and log in.
3. Or from a TTY, run: \`impulse-session\`

## Core Keybindings
| Shortcut | Action |
|---|---|
| \`Alt + Space\` / \`Super + Space\` | App Launcher (Fuzzel) |
| \`Super + Enter\` / \`Alt + Enter\` | Terminal (Kitty) |
| \`Super + N\` / \`Alt + N\` | Control Center & Notifications (SwayNC) |
| \`Super + Q\` | Close active window |
| \`Super + F\` / \`Super + Shift + F\` | Toggle Floating / True Fullscreen |
| \`Super + G\` / \`Super + Tab\` | Tabbed Window Group / Cycle Tabs |
| \`Super + S\` | Scratchpad Special Workspace |
| \`Super + Shift + S\` | Region Screenshot (\`grim + slurp\`) |
| \`Super + Shift + P\` | Color Picker (\`hyprpicker\`) |
| \`Super + Shift + N\` | Toggle Night Light (\`hyprsunset\`) |
| \`Super + L\` | Lock Screen (\`hyprlock\`) |
| \`Super + 1..9\` | Switch Workspaces |
`;

  const installSh = `#!/usr/bin/env bash
set -euo pipefail

# ImpulseShell — Real Linux Wayland Desktop Environment Installer
# One-line install:
#   curl -fsSL https://raw.githubusercontent.com/ammardoma/ImpulseShell/main/install.sh | bash

REPO_URL="\${IMPULSE_REPO_URL:-https://github.com/ammardoma/ImpulseShell.git}"
INSTALL_DIR="\${IMPULSE_DIR:-$HOME/.local/share/ImpulseShell}"
BACKUP_DIR="$HOME/.config-backup-impulse-$(date +%Y%m%d-%H%M%S)"

echo "=================================================="
echo "  ImpulseShell — Real Linux Wayland DE Installer  "
echo "=================================================="

if [ "$(uname -s)" != "Linux" ]; then
  echo "Error: ImpulseShell is a Linux Wayland Desktop Environment." >&2
  exit 1
fi

# 1. Clone or update repo when invoked via curl | bash
if [ ! -f "config/hypr/hyprland.conf" ]; then
  if ! command -v git >/dev/null 2>&1; then
    echo "Error: git is required. Install git and re-run." >&2
    exit 1
  fi
  if [ -d "$INSTALL_DIR/.git" ]; then
    echo "[1/5] Updating ImpulseShell in $INSTALL_DIR..."
    git -C "$INSTALL_DIR" fetch --depth=1 origin main && git -C "$INSTALL_DIR" reset --hard origin/main
  else
    echo "[1/5] Cloning ImpulseShell from $REPO_URL..."
    git clone --depth=1 "$REPO_URL" "$INSTALL_DIR"
  fi
  cd "$INSTALL_DIR"
fi

# 2. Install real Wayland DE packages for the detected Linux distro
echo "[2/5] Installing Wayland compositor & ImpulseShell packages..."
if command -v pacman >/dev/null 2>&1; then
  sudo pacman -Syu --needed --noconfirm \\
    hyprland waybar swaync fuzzel kitty swww \\
    hyprlock hypridle hyprpicker hyprsunset \\
    grim slurp wl-clipboard cliphist \\
    playerctl brightnessctl wireplumber pavucontrol \\
    xdg-desktop-portal-hyprland polkit-gnome \\
    network-manager-applet blueman \\
    ttf-jetbrains-mono-nerd noto-fonts qt5-wayland qt6-wayland || true
elif command -v dnf >/dev/null 2>&1; then
  sudo dnf install -y \\
    hyprland waybar SwayNotificationCenter fuzzel kitty swww \\
    hyprlock hypridle hyprpicker \\
    grim slurp wl-clipboard \\
    playerctl brightnessctl pavucontrol \\
    xdg-desktop-portal-hyprland polkit-gnome \\
    network-manager-applet blueman qt5-qtwayland qt6-qtwayland || true
elif command -v apt-get >/dev/null 2>&1; then
  sudo apt-get update
  sudo apt-get install -y \\
    hyprland waybar sway-notification-center fuzzel kitty \\
    grim slurp wl-clipboard playerctl brightnessctl pavucontrol \\
    policykit-1-gnome network-manager-gnome blueman \\
    fonts-jetbrains-mono qtwayland5 || true
else
  echo "Warning: Unknown package manager. Please install hyprland, waybar, swaync, fuzzel, kitty, swww, grim, slurp, wl-clipboard manually."
fi

# 3. Back up existing user configs safely & install ImpulseShell configs
echo "[3/5] Installing ImpulseShell configs (backups in $BACKUP_DIR)..."
mkdir -p "$HOME/.config/hypr" "$HOME/.config/niri" "$HOME/.config/waybar" \\
         "$HOME/.config/swaync" "$HOME/.config/fuzzel" "$HOME/.config/kitty" \\
         "$HOME/.config/gtk-3.0" "$HOME/.config/gtk-4.0" \\
         "$HOME/.config/impulse" "$HOME/.config/myx" "$HOME/.local/bin"

backup_if_exists() {
  local target="$1"
  if [ -e "$target" ]; then
    mkdir -p "$BACKUP_DIR"
    cp -r "$target" "$BACKUP_DIR/"
  fi
}

backup_if_exists "$HOME/.config/hypr/hyprland.conf"
backup_if_exists "$HOME/.config/waybar"
backup_if_exists "$HOME/.config/swaync"
backup_if_exists "$HOME/.config/fuzzel"
backup_if_exists "$HOME/.config/kitty/kitty.conf"

cp config/hypr/hyprland.conf "$HOME/.config/hypr/hyprland.conf"
cp config/hypr/hypridle.conf "$HOME/.config/hypr/hypridle.conf"
cp config/hypr/hyprlock.conf "$HOME/.config/hypr/hyprlock.conf"
cp config/niri/config.kdl "$HOME/.config/niri/config.kdl"
cp config/waybar/config.jsonc "$HOME/.config/waybar/config.jsonc"
cp config/waybar/style.css "$HOME/.config/waybar/style.css"
cp config/swaync/config.json "$HOME/.config/swaync/config.json"
cp config/swaync/style.css "$HOME/.config/swaync/style.css"
cp config/fuzzel/fuzzel.ini "$HOME/.config/fuzzel/fuzzel.ini"
cp config/kitty/kitty.conf "$HOME/.config/kitty/kitty.conf"
cp config/gtk-4.0/gtk.css "$HOME/.config/gtk-4.0/gtk.css"
cp config/gtk-4.0/gtk.css "$HOME/.config/gtk-3.0/gtk.css"
cp config/myx/colors.css "$HOME/.config/myx/colors.css"

# Generate default Material 3 gradient wallpaper if user doesn't have one yet
if [ ! -f "$HOME/.config/impulse/wallpaper.png" ]; then
  if command -v python3 >/dev/null 2>&1; then
    python3 - << 'PYEOF' || true
import struct, zlib, os
w, h = 640, 360
def hex_rgb(s):
    s = s.lstrip('#')
    return tuple(int(s[i:i+2], 16) for i in (0, 2, 4))
c1 = hex_rgb("${palette.surface}")
c2 = hex_rgb("${palette.primaryContainer}")
c3 = hex_rgb("${palette.tertiary}")
rows = bytearray()
for y in range(h):
    rows.append(0)
    ty = y / max(1, h - 1)
    for x in range(w):
        tx = x / max(1, w - 1)
        r = int(c1[0] * (1 - tx * 0.55) + c2[0] * (tx * 0.45) + c3[0] * (ty * 0.18))
        g = int(c1[1] * (1 - tx * 0.55) + c2[1] * (tx * 0.45) + c3[1] * (ty * 0.18))
        b = int(c1[2] * (1 - tx * 0.55) + c2[2] * (tx * 0.45) + c3[2] * (ty * 0.18))
        rows.extend((min(255, r), min(255, g), min(255, b)))
def chunk(tag, data):
    return struct.pack('!I', len(data)) + tag + data + struct.pack('!I', zlib.crc32(tag + data) & 0xffffffff)
ihdr = struct.pack('!IIBBBBB', w, h, 8, 2, 0, 0, 0)
png = b'\\x89PNG\\r\\n\\x1a\\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', zlib.compress(bytes(rows), 6)) + chunk(b'IEND', b'')
with open(os.path.expanduser('~/.config/impulse/wallpaper.png'), 'wb') as f:
    f.write(png)
PYEOF
  fi
fi

# 4. Install ImpulseShell helper binaries & Wayland login session
echo "[4/5] Installing binaries and Wayland display-manager session..."
install -Dm755 bin/impulse-session "$HOME/.local/bin/impulse-session"
install -Dm755 bin/impulse-screenshot "$HOME/.local/bin/impulse-screenshot"
install -Dm755 bin/impulse-picker "$HOME/.local/bin/impulse-picker"
install -Dm755 bin/impulse-sunset "$HOME/.local/bin/impulse-sunset"

if command -v sudo >/dev/null 2>&1; then
  sudo install -Dm755 bin/impulse-session /usr/local/bin/impulse-session || true
  sudo install -Dm644 sessions/impulseshell.desktop /usr/share/wayland-sessions/impulseshell.desktop || true
fi

# Ensure ~/.local/bin is in PATH for bash, zsh, and fish
if [ -f "$HOME/.bashrc" ] && ! grep -q '.local/bin' "$HOME/.bashrc"; then
  echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.bashrc"
fi
if [ -d "$HOME/.config/fish" ]; then
  mkdir -p "$HOME/.config/fish/conf.d"
  echo 'fish_add_path "$HOME/.local/bin"' > "$HOME/.config/fish/conf.d/impulseshell.fish"
fi

# 5. Live reload if already inside Hyprland
echo "[5/5] Finalizing..."
if [ -n "\${HYPRLAND_INSTANCE_SIGNATURE:-}" ]; then
  hyprctl reload || true
  pkill -x waybar 2>/dev/null || true
  nohup waybar >/dev/null 2>&1 &
  pkill -x swaync 2>/dev/null || true
  nohup swaync >/dev/null 2>&1 &
  echo "Reloaded live Hyprland + Waybar + SwayNC session!"
fi

echo ""
echo "ImpulseShell Linux Desktop Environment installed!"
echo "-> Log out and choose 'ImpulseShell' on your login screen (SDDM/GDM/greetd),"
echo "   OR run 'impulse-session' from a Linux TTY."
`;

  return [
    {
      path: 'install.sh',
      language: 'bash',
      description: 'Real Linux Wayland DE installer (Arch/Fedora/Ubuntu + curl | bash ready)',
      content: installSh,
    },
    {
      path: 'README.md',
      language: 'markdown',
      description: 'ImpulseShell GitHub README & curl install instructions',
      content: readmeMd,
    },
    {
      path: 'config/hypr/hyprland.conf',
      language: 'conf',
      description: 'Real Hyprland compositor config (monitors, blur, animations, groups, binds)',
      content: hyprlandConf,
    },
    {
      path: 'config/waybar/config.jsonc',
      language: 'json',
      description: isMixie ? 'Waybar configured as Mixie Dynamic Island' : 'Waybar configured as Material 3 Top Bar',
      content: waybarConfig,
    },
    {
      path: 'config/waybar/style.css',
      language: 'css',
      description: 'Material 3 / Liquid Glass CSS styling for Waybar',
      content: waybarStyleCss,
    },
    {
      path: 'config/swaync/config.json',
      language: 'json',
      description: 'SwayNC Control Center widgets (toggles, sliders, MPRIS, notifications)',
      content: swayncConfig,
    },
    {
      path: 'config/swaync/style.css',
      language: 'css',
      description: 'SwayNC Material 3 / macOS Bento Control Center CSS',
      content: swayncStyleCss,
    },
    {
      path: 'config/fuzzel/fuzzel.ini',
      language: 'ini',
      description: 'Native Wayland Alt+Space launcher (Fuzzel) themed with M3 tokens',
      content: fuzzelIni,
    },
    {
      path: 'config/kitty/kitty.conf',
      language: 'conf',
      description: 'GPU Wayland terminal (Kitty) themed with your M3 palette',
      content: kittyConf,
    },
    {
      path: 'config/hypr/hyprlock.conf',
      language: 'conf',
      description: 'Blurred Material 3 Wayland lock screen (Hyprlock)',
      content: hyprlockConf,
    },
    {
      path: 'config/hypr/hypridle.conf',
      language: 'conf',
      description: 'Auto-lock & screen sleep daemon config (Hypridle)',
      content: hypridleConf,
    },
    {
      path: 'config/niri/config.kdl',
      language: 'kdl',
      description: 'Optional Niri infinite-scrolling Wayland compositor config',
      content: niriKdl,
    },
    {
      path: 'config/gtk-4.0/gtk.css',
      language: 'css',
      description: 'GTK3 / GTK4 Material 3 app color palette',
      content: gtkCss,
    },
    {
      path: 'config/myx/colors.css',
      language: 'css',
      description: 'ImpulseShell Material 3 CSS custom properties',
      content: colorsCss,
    },
    {
      path: 'sessions/impulseshell.desktop',
      language: 'ini',
      description: 'Login screen Wayland session entry (/usr/share/wayland-sessions)',
      content: desktopEntry,
    },
    {
      path: 'bin/impulse-session',
      language: 'bash',
      description: 'Wayland session launcher (Hyprland / Niri)',
      content: impulseSessionSh,
    },
    {
      path: 'bin/impulse-screenshot',
      language: 'bash',
      description: 'Region/full screenshot tool (grim + slurp + wl-copy)',
      content: impulseScreenshotSh,
    },
    {
      path: 'bin/impulse-picker',
      language: 'bash',
      description: 'Screen color picker helper (hyprpicker)',
      content: impulsePickerSh,
    },
    {
      path: 'bin/impulse-sunset',
      language: 'bash',
      description: 'Night light Kelvin toggle helper (hyprsunset)',
      content: impulseSunsetSh,
    },
  ];
}
