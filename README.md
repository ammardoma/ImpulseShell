# ImpulseShell

A complete, daily-driver **Linux Wayland Desktop Environment** combining **Hyprland** (plus optional **Niri** infinite-scrolling config) with a Material 3 / Liquid Glass desktop shell (**Mixie Dynamic Island** or **M3 Top Bar** via Waybar, **SwayNC** Control Center, **Fuzzel** `Alt+Space` launcher, **Kitty** terminal, **Hyprlock**, **Hypridle**, **Hyprsunset**, and **Hyprpicker**).

## One-Line Install (Linux)

```bash
curl -fsSL https://raw.githubusercontent.com/ammardoma/ImpulseShell/main/install.sh | bash
```

Supports **Arch / CachyOS / EndeavourOS / Manjaro** (`pacman`), **Fedora / Nobara** (`dnf`), and **Ubuntu / Debian** (`apt`).

## How to Launch
1. Log out of your current desktop session.
2. On your login screen (SDDM / GDM / greetd), select **ImpulseShell** and log in.
3. Or from a TTY, run: `impulse-session`

## Core Keybindings
| Shortcut | Action |
|---|---|
| `Alt + Space` / `Super + Space` | App Launcher (Fuzzel) |
| `Super + Enter` / `Alt + Enter` | Terminal (Kitty) |
| `Super + N` / `Alt + N` | Control Center & Notifications (SwayNC) |
| `Super + Q` | Close active window |
| `Super + F` / `Super + Shift + F` | Toggle Floating / True Fullscreen |
| `Super + G` / `Super + Tab` | Tabbed Window Group / Cycle Tabs |
| `Super + S` | Scratchpad Special Workspace |
| `Super + Shift + S` | Region Screenshot (`grim + slurp`) |
| `Super + Shift + P` | Color Picker (`hyprpicker`) |
| `Super + Shift + N` | Toggle Night Light (`hyprsunset`) |
| `Super + L` | Lock Screen (`hyprlock`) |
| `Super + 1..9` | Switch Workspaces |
