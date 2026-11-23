#!/usr/bin/env bash
set -euo pipefail

# ImpulseShell — Real Linux Wayland Desktop Environment Installer
# One-line install:
#   curl -fsSL https://raw.githubusercontent.com/ammardoma/ImpulseShell/main/install.sh | bash

REPO_URL="${IMPULSE_REPO_URL:-https://github.com/ammardoma/ImpulseShell.git}"
INSTALL_DIR="${IMPULSE_DIR:-$HOME/.local/share/ImpulseShell}"
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
  sudo pacman -Syu --needed --noconfirm \
    hyprland waybar swaync fuzzel kitty swww \
    hyprlock hypridle hyprpicker hyprsunset \
    grim slurp wl-clipboard cliphist \
    playerctl brightnessctl wireplumber pavucontrol \
    xdg-desktop-portal-hyprland polkit-gnome \
    network-manager-applet blueman \
    ttf-jetbrains-mono-nerd noto-fonts qt5-wayland qt6-wayland || true
elif command -v dnf >/dev/null 2>&1; then
  sudo dnf install -y \
    hyprland waybar SwayNotificationCenter fuzzel kitty swww \
    hyprlock hypridle hyprpicker \
    grim slurp wl-clipboard \
    playerctl brightnessctl pavucontrol \
    xdg-desktop-portal-hyprland polkit-gnome \
    network-manager-applet blueman qt5-qtwayland qt6-qtwayland || true
elif command -v apt-get >/dev/null 2>&1; then
  sudo apt-get update
  sudo apt-get install -y \
    hyprland waybar sway-notification-center fuzzel kitty \
    grim slurp wl-clipboard playerctl brightnessctl pavucontrol \
    policykit-1-gnome network-manager-gnome blueman \
    fonts-jetbrains-mono qtwayland5 || true
else
  echo "Warning: Unknown package manager. Please install hyprland, waybar, swaync, fuzzel, kitty, swww, grim, slurp, wl-clipboard manually."
fi

# 3. Back up existing user configs safely & install ImpulseShell configs
echo "[3/5] Installing ImpulseShell configs (backups in $BACKUP_DIR)..."
mkdir -p "$HOME/.config/hypr" "$HOME/.config/niri" "$HOME/.config/waybar" \
         "$HOME/.config/swaync" "$HOME/.config/fuzzel" "$HOME/.config/kitty" \
         "$HOME/.config/gtk-3.0" "$HOME/.config/gtk-4.0" \
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
c1 = hex_rgb("#101313")
c2 = hex_rgb("#3d5c59")
c3 = hex_rgb("#bcbdd2")
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
png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', zlib.compress(bytes(rows), 6)) + chunk(b'IEND', b'')
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
if [ -n "${HYPRLAND_INSTANCE_SIGNATURE:-}" ]; then
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
