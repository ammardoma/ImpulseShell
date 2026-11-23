import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getTotalRamMb, hexToRgba, WALLPAPERS } from '../../lib/m3Engine';
import { generateRustShellFiles } from '../../lib/rustShellGenerator';
import {
  AppWindowId,
  DesktopWindow,
  M3Palette,
  NyxLayoutMode,
  ShellConfig,
} from '../../types/shell';

interface TerminalAppProps {
  config: ShellConfig;
  palette: M3Palette;
  activeWorkspace: number;
  workspaceCount: number;
  windows: DesktopWindow[];
  focusedWindowId: AppWindowId | null;
  onSelectWorkspace: (ws: number) => void;
  onFocusOrOpenApp: (id: AppWindowId) => void;
  onToggleFloating: (id: AppWindowId) => void;
  onToggleMaximize: (id: AppWindowId) => void;
  onToggleTrueFullscreen: (id: AppWindowId) => void;
  onToggleGroupWindow: (id: AppWindowId) => void;
  onTogglePseudoWindow: (id: AppWindowId) => void;
  onTogglePinWindow: (id: AppWindowId) => void;
  onCloseWindow: (id: AppWindowId) => void;
  onFocusAdjacentWindow: (dir: -1 | 1) => void;
  onSwapWindow: (id: AppWindowId, dir: -1 | 1) => void;
  onMoveWindowWorkspace: (id: AppWindowId, ws: number) => void;
  onUpdateConfig: (patch: Partial<ShellConfig>, osdLabel?: string) => void;
  onOpenWallpaperPicker: () => void;
  onOpenClipboard: () => void;
  onOpenKeybinds: () => void;
  onOpenColorPicker: () => void;
  onPushClipboard: (text: string, source: string) => void;
}

interface TermLine {
  id: number;
  text: string;
  tone?: 'normal' | 'accent' | 'muted' | 'error';
}

const BUILTIN_COMMANDS = [
  'help',
  'clear',
  'ls',
  'cd',
  'pwd',
  'cat',
  'echo',
  'touch',
  'mkdir',
  'rm',
  'grep',
  'whoami',
  'hostname',
  'uname',
  'date',
  'uptime',
  'env',
  'export',
  'history',
  'calc',
  'fastfetch',
  'neofetch',
  'free',
  'ps',
  'hyprctl',
  'nyxctl',
  'myx',
  'cargo',
];

export const TerminalApp: React.FC<TerminalAppProps> = ({
  config,
  palette,
  activeWorkspace,
  workspaceCount,
  windows,
  focusedWindowId,
  onSelectWorkspace,
  onFocusOrOpenApp,
  onToggleFloating,
  onToggleMaximize,
  onToggleTrueFullscreen,
  onToggleGroupWindow,
  onTogglePseudoWindow,
  onTogglePinWindow,
  onCloseWindow,
  onFocusAdjacentWindow,
  onSwapWindow,
  onMoveWindowWorkspace,
  onUpdateConfig,
  onOpenWallpaperPicker,
  onOpenClipboard,
  onOpenKeybinds,
  onOpenColorPicker,
}) => {
  const [input, setInput] = useState('');
  const [cwd, setCwd] = useState('~/Projects/nyx-myx');
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [envVars, setEnvVars] = useState<Record<string, string>>({
    SHELL: '/bin/zsh',
    TERM: 'nyx-term',
    WAYLAND_DISPLAY: 'wayland-1',
    XDG_CURRENT_DESKTOP: 'Nyx',
    USER: 'ammar',
    HOME: '/home/ammar',
  });
  const [customFiles, setCustomFiles] = useState<Record<string, string>>({
    '~/Documents/notes.md': '# Nyx + Myx Notes\n\nEdit or create files with echo "text" > ~/file.txt\n',
  });
  const [customDirs, setCustomDirs] = useState<string[]>([
    '~',
    '~/Documents',
    '~/.config',
    '~/.config/nyx',
    '~/.config/myx',
    '~/Projects',
    '~/Projects/nyx-myx',
  ]);

  const [lines, setLines] = useState<TermLine[]>([
    {
      id: 1,
      text: 'nyx-term 0.3 (Smithay PTY) · zsh 5.9 · oh-my-zsh · Nyx Wayland TTY',
      tone: 'muted',
    },
    {
      id: 2,
      text: 'Type any command (ls, cd, cat, hyprctl, myx mode mixi, myx mode m3, fastfetch, help). Tab to autocomplete.',
      tone: 'muted',
    },
  ]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(10);

  // Sync live generated Nyx + Myx files into virtual filesystem
  const vfsFiles = useMemo(() => {
    const generated = generateRustShellFiles(config, palette);
    const map: Record<string, string> = { ...customFiles };
    for (const f of generated) {
      if (f.path.startsWith('config/nyx/')) {
        map[`~/.config/nyx/${f.path.replace('config/nyx/', '')}`] = f.content;
      } else if (f.path.startsWith('config/myx/')) {
        map[`~/.config/myx/${f.path.replace('config/myx/', '')}`] = f.content;
      } else {
        map[`~/Projects/nyx-myx/${f.path}`] = f.content;
      }
    }
    return map;
  }, [config, palette, customFiles]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const resolvePath = (target: string, baseDir = cwd): string => {
    const raw = target.trim();
    if (!raw || raw === '~') return '~';
    let expanded = raw.startsWith('~')
      ? raw
      : raw.startsWith('/home/ammar')
        ? '~' + raw.slice('/home/ammar'.length)
        : raw.startsWith('/')
          ? raw
          : `${baseDir}/${raw}`;

    const parts = expanded.split('/').filter(Boolean);
    const stack: string[] = [];
    for (const part of parts) {
      if (part === '.') continue;
      if (part === '..') {
        if (stack.length > 1 || (stack.length === 1 && stack[0] !== '~')) {
          stack.pop();
        }
      } else {
        stack.push(part);
      }
    }
    if (stack.length === 0) return '~';
    return stack[0] === '~' ? stack.join('/') : `/${stack.join('/')}`;
  };

  const listDirEntries = (dirPath: string): { dirs: string[]; files: string[] } => {
    const prefix = dirPath === '~' ? '~/' : `${dirPath}/`;
    const dirSet = new Set<string>();
    const fileSet = new Set<string>();

    for (const d of customDirs) {
      if (d.startsWith(prefix)) {
        const rest = d.slice(prefix.length).split('/')[0];
        if (rest) dirSet.add(rest);
      }
    }
    for (const f of Object.keys(vfsFiles)) {
      if (f.startsWith(prefix)) {
        const rest = f.slice(prefix.length);
        const first = rest.split('/')[0];
        if (rest.includes('/')) {
          dirSet.add(first);
        } else if (first) {
          fileSet.add(first);
        }
      }
    }
    return {
      dirs: Array.from(dirSet).sort(),
      files: Array.from(fileSet).sort(),
    };
  };

  const expandVars = (text: string) =>
    text.replace(/\$([A-Z_][A-Z0-9_]*)/g, (_, name) => envVars[name] ?? '');

  const runCommand = (rawInput: string) => {
    const trimmed = rawInput.trim();
    if (!trimmed) return;

    setCmdHistory((prev) => [trimmed, ...prev.slice(0, 49)]);
    setHistoryIdx(-1);

    if (trimmed === 'clear') {
      setLines([]);
      return;
    }

    const push = (entries: Omit<TermLine, 'id'>[]) => {
      setLines((prev) => [
        ...prev,
        ...entries.map((e) => ({ ...e, id: nextId.current++ })),
      ]);
    };

    const promptHeader = `${cwd} ❯ ${trimmed}`;
    const out: Omit<TermLine, 'id'>[] = [{ text: promptHeader, tone: 'accent' }];

    // Handle output redirection: echo "..." > file or >> file
    const redirectMatch = trimmed.match(/^(.*?)\s*(>>|>)\s*([^\s]+)$/);
    if (redirectMatch) {
      const [, lhs, op, targetFile] = redirectMatch;
      const resolved = resolvePath(targetFile);
      let payload = lhs.trim();
      if (payload.startsWith('echo ')) {
        payload = expandVars(payload.slice(5).trim().replace(/^["']|["']$/g, ''));
      }
      setCustomFiles((prev) => ({
        ...prev,
        [resolved]:
          op === '>>' && prev[resolved] ? `${prev[resolved]}\n${payload}` : payload,
      }));
      out.push({ text: `wrote ${payload.length} bytes to ${resolved}`, tone: 'muted' });
      push(out);
      return;
    }

    const expanded = expandVars(trimmed);
    const tokens = expanded.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) ?? [];
    const cmd = tokens[0] ?? '';
    const args = tokens.slice(1).map((a) => a.replace(/^["']|["']$/g, ''));

    const allWallpapers = [...WALLPAPERS, ...config.customWallpapers];
    const wp = allWallpapers.find((w) => w.id === config.wallpaperId) ?? allWallpapers[0];
    const ram = getTotalRamMb(config);

    switch (cmd) {
      case 'help':
        out.push(
          { text: 'Zsh Builtins & Filesystem:', tone: 'normal' },
          { text: '  ls [-la] · cd <dir> · pwd · cat <file> · grep <pat> <file>', tone: 'muted' },
          { text: '  echo "text" > file · touch <file> · mkdir <dir> · rm <file>', tone: 'muted' },
          { text: '  whoami · hostname · uname -a · date · env · export K=V · calc <expr>', tone: 'muted' },
          { text: 'Nyx Compositor & Myx Shell:', tone: 'normal' },
          { text: '  hyprctl [-j] clients | workspaces | monitors | activewindow | layers | binds | version | reload', tone: 'muted' },
          { text: '  hyprctl getoption <key> · hyprctl --batch "cmd1 ; cmd2"', tone: 'muted' },
          { text: '  hyprctl dispatch workspace|movetoworkspace|movefocus|swapwindow|togglegroup|pseudo|pin|fullscreen|killactive', tone: 'muted' },
          { text: '  hyprctl keyword general:layout <dwindle|scrolling|master> · scrolling:column_width · input:follow_mouse', tone: 'muted' },
          { text: '  myx mode <mixi|m3> · myx sidebar style <m3|macos|minimal> · myx picker · myx wallpaper | clip | keys', tone: 'muted' },
          { text: '  fastfetch · free -m · ps aux · cargo build --release · clear', tone: 'muted' }
        );
        break;

      case 'pwd':
        out.push({ text: cwd.replace(/^~/, '/home/ammar'), tone: 'normal' });
        break;

      case 'whoami':
        out.push({ text: envVars.USER || 'ammar', tone: 'normal' });
        break;

      case 'hostname':
        out.push({ text: 'nyx-desktop', tone: 'normal' });
        break;

      case 'uname':
        out.push({
          text: args.includes('-a')
            ? 'Linux nyx-desktop 6.12.9-zen1-1-zen #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux'
            : 'Linux',
          tone: 'normal',
        });
        break;

      case 'date':
        out.push({ text: new Date().toString(), tone: 'normal' });
        break;

      case 'uptime':
        out.push({ text: ' 00:52:14 up 4:18,  1 user,  load average: 0.14, 0.19, 0.16', tone: 'normal' });
        break;

      case 'env':
        Object.entries(envVars).forEach(([k, v]) =>
          out.push({ text: `${k}=${v}`, tone: 'normal' })
        );
        break;

      case 'export': {
        const assignment = args.join(' ');
        const eqIdx = assignment.indexOf('=');
        if (eqIdx > 0) {
          const k = assignment.slice(0, eqIdx).trim();
          const v = assignment.slice(eqIdx + 1).trim();
          setEnvVars((prev) => ({ ...prev, [k]: v }));
          out.push({ text: `exported ${k}=${v}`, tone: 'muted' });
        } else {
          out.push({ text: 'usage: export KEY=VALUE', tone: 'error' });
        }
        break;
      }

      case 'history':
        if (cmdHistory.length === 0) {
          out.push({ text: '(empty history)', tone: 'muted' });
        } else {
          [...cmdHistory]
            .reverse()
            .forEach((h, i) => out.push({ text: `  ${String(i + 1).padStart(3)}  ${h}`, tone: 'normal' }));
        }
        break;

      case 'echo':
        out.push({ text: args.join(' '), tone: 'normal' });
        break;

      case 'calc':
      case 'expr': {
        const expr = args.join(' ');
        if (!expr || !/^[0-9+\-*/().\s]+$/.test(expr)) {
          out.push({ text: 'usage: calc <arithmetic expression>', tone: 'error' });
        } else {
          try {
            const val = Function(`"use strict"; return (${expr});`)();
            out.push({ text: String(val), tone: 'accent' });
          } catch {
            out.push({ text: 'zsh: invalid expression', tone: 'error' });
          }
        }
        break;
      }

      case 'cd': {
        const target = resolvePath(args[0] ?? '~');
        const exists =
          customDirs.includes(target) ||
          Object.keys(vfsFiles).some((f) => f.startsWith(target === '~' ? '~/' : `${target}/`));
        if (exists) {
          setCwd(target);
        } else {
          out.push({ text: `cd: no such file or directory: ${args[0]}`, tone: 'error' });
        }
        break;
      }

      case 'ls': {
        const showLong = args.some((a) => a.includes('l'));
        const pathArg = args.find((a) => !a.startsWith('-'));
        const dir = pathArg ? resolvePath(pathArg) : cwd;
        const { dirs, files } = listDirEntries(dir);
        if (dirs.length === 0 && files.length === 0) {
          out.push({ text: '(empty directory)', tone: 'muted' });
        } else if (showLong) {
          dirs.forEach((d) =>
            out.push({ text: `drwxr-xr-x  ammar  users     4096  ${d}/`, tone: 'accent' })
          );
          files.forEach((f) => {
            const full = dir === '~' ? `~/${f}` : `${dir}/${f}`;
            const size = (vfsFiles[full]?.length ?? 64).toString().padStart(5);
            out.push({ text: `-rw-r--r--  ammar  users  ${size}  ${f}`, tone: 'normal' });
          });
        } else {
          out.push({
            text: [...dirs.map((d) => `${d}/`), ...files].join('   '),
            tone: 'normal',
          });
        }
        break;
      }

      case 'cat': {
        if (!args[0]) {
          out.push({ text: 'usage: cat <file>', tone: 'error' });
        } else {
          const target = resolvePath(args[0]);
          const content = vfsFiles[target];
          if (content !== undefined) {
            content.split('\n').forEach((line) => out.push({ text: line, tone: 'normal' }));
          } else {
            out.push({ text: `cat: ${args[0]}: No such file or directory`, tone: 'error' });
          }
        }
        break;
      }

      case 'grep': {
        const [pat, fileArg] = args;
        if (!pat || !fileArg) {
          out.push({ text: 'usage: grep <pattern> <file>', tone: 'error' });
        } else {
          const target = resolvePath(fileArg);
          const content = vfsFiles[target];
          if (content === undefined) {
            out.push({ text: `grep: ${fileArg}: No such file`, tone: 'error' });
          } else {
            const hits = content
              .split('\n')
              .map((l, idx) => ({ l, idx: idx + 1 }))
              .filter((r) => r.l.toLowerCase().includes(pat.toLowerCase()));
            if (hits.length === 0) {
              out.push({ text: '(no matches)', tone: 'muted' });
            } else {
              hits.forEach((h) => out.push({ text: `${h.idx}: ${h.l}`, tone: 'accent' }));
            }
          }
        }
        break;
      }

      case 'touch':
        if (args[0]) {
          const target = resolvePath(args[0]);
          setCustomFiles((prev) => ({ ...prev, [target]: prev[target] ?? '' }));
          out.push({ text: `created ${target}`, tone: 'muted' });
        }
        break;

      case 'mkdir':
        if (args[0]) {
          const target = resolvePath(args[0]);
          setCustomDirs((prev) => (prev.includes(target) ? prev : [...prev, target]));
          out.push({ text: `mkdir: created ${target}`, tone: 'muted' });
        }
        break;

      case 'rm':
        if (args[0]) {
          const target = resolvePath(args[0]);
          if (customFiles[target] !== undefined) {
            setCustomFiles((prev) => {
              const copy = { ...prev };
              delete copy[target];
              return copy;
            });
            out.push({ text: `removed ${target}`, tone: 'muted' });
          } else {
            out.push({ text: `rm: cannot remove '${args[0]}'`, tone: 'error' });
          }
        }
        break;

      case 'fastfetch':
      case 'neofetch':
        out.push(
          { text: '       /\\         ammar@nyx-desktop', tone: 'accent' },
          { text: '      /  \\        OS: Arch Linux x86_64 · Terminal: nyx-term (zsh 5.9)', tone: 'normal' },
          { text: `     /\\   \\       Compositor: Nyx (Smithay · ${config.nyxLayout})`, tone: 'normal' },
          { text: `    /  __  \\      Shell Mode: ${config.shellMode === 'mixi' ? 'Mixi (Blob + Apple CC)' : 'M3 (Top Bar + Dock)'}`, tone: 'normal' },
          { text: `   /  (  )  \\     Memory: Myx (${ram.shellMb.toFixed(1)} MB) + Nyx (${ram.compositorMb.toFixed(1)} MB)`, tone: 'normal' },
          { text: `  / __|  |__\\\\    Theme: M3 ${config.m3Scheme} (${config.seedColor}) · ${wp.name}`, tone: 'normal' },
          { text: ` /.\`        \`.\\   Surface: ${config.materialType} @ ${config.transparency}%`, tone: 'normal' }
        );
        break;

      case 'free':
        out.push(
          { text: '               total        used        free      shared  buff/cache   available', tone: 'muted' },
          { text: 'Mem:           16384         548       13904          48        1932       15404', tone: 'normal' },
          { text: `nyx-compositor:             ${ram.compositorMb.toFixed(1)} MB (Smithay + Calloop)`, tone: 'accent' },
          { text: `myx-daemon:                 ${ram.shellMb.toFixed(1)} MB (M3 Layer-Shell)`, tone: 'accent' }
        );
        break;

      case 'ps':
        out.push(
          { text: 'USER       PID %MEM    RSS COMMAND', tone: 'muted' },
          { text: `ammar      842  0.1  ${ram.compositorMb.toFixed(1)}M nyx-compositor --config=${config.nyxConfigFormat} --layout=${config.nyxLayout}`, tone: 'accent' },
          { text: `ammar      918  0.1  ${ram.shellMb.toFixed(1)}M myx-daemon --mode=${config.shellMode} --surface=${config.materialType}`, tone: 'accent' },
          { text: 'ammar      955  0.1   8.6M nyx-term --shell=/bin/zsh', tone: 'normal' },
          { text: 'ammar      992  0.0   9.4M swww-daemon', tone: 'normal' }
        );
        break;

      case 'myx': {
        const sub = args[0];
        if (sub === 'wallpaper' || sub === 'wp') {
          onOpenWallpaperPicker();
          out.push({ text: 'opened wallpaper picker', tone: 'accent' });
        } else if (sub === 'clip' || sub === 'clipboard') {
          onOpenClipboard();
          out.push({ text: 'opened clipboard ring', tone: 'accent' });
        } else if (sub === 'keys' || sub === 'keybinds') {
          onOpenKeybinds();
          out.push({ text: 'opened keybind editor', tone: 'accent' });
        } else if (sub === 'theme') {
          const mode = args[1];
          onUpdateConfig({ darkMode: mode ? mode === 'dark' : !config.darkMode });
          out.push({ text: 'updated M3 theme mode', tone: 'accent' });
        } else if (sub === 'bar') {
          const act = args[1];
          if (act === 'autohide') {
            const next = args[2] ? args[2] === 'on' : !config.barAutoHide;
            onUpdateConfig({ barAutoHide: next, showBar: true }, `Bar auto-hide ${next ? 'ON' : 'OFF'}`);
            out.push({ text: `bar_auto_hide = ${next}`, tone: 'accent' });
          } else if (act === 'show' || act === 'hide') {
            onUpdateConfig({ showBar: act === 'show' });
            out.push({ text: `show_bar = ${act === 'show'}`, tone: 'accent' });
          } else {
            out.push({ text: 'usage: myx bar <autohide [on|off]|show|hide>', tone: 'muted' });
          }
        } else if (sub === 'dock') {
          const act = args[1];
          if (act === 'autohide') {
            const next = args[2] ? args[2] === 'on' : !config.dockAutoHide;
            onUpdateConfig({ dockAutoHide: next, showDock: true }, `Dock auto-hide ${next ? 'ON' : 'OFF'}`);
            out.push({ text: `dock_auto_hide = ${next}`, tone: 'accent' });
          } else if (act === 'show' || act === 'hide') {
            onUpdateConfig({ showDock: act === 'show' });
            out.push({ text: `show_dock = ${act === 'show'}`, tone: 'accent' });
          } else {
            out.push({ text: 'usage: myx dock <autohide [on|off]|show|hide>', tone: 'muted' });
          }
        } else if (sub === 'mode') {
          const target = args[1];
          if (target === 'mixi' || target === 'm3') {
            onUpdateConfig(
              target === 'mixi'
                ? { shellMode: 'mixi', showMixie: true }
                : { shellMode: 'm3', showBar: true, showDock: true },
              target === 'mixi'
                ? 'Shell Mode: Mixi (Blob + Apple Control Center)'
                : 'Shell Mode: M3 (Top Bar + Dock)'
            );
            out.push({ text: `shell_mode = "${target}"`, tone: 'accent' });
          } else {
            out.push({ text: 'usage: myx mode <mixi|m3>', tone: 'muted' });
          }
        } else if (sub === 'mixie' || sub === 'mixi') {
          const act = args[1];
          if (act === 'autohide') {
            const next = args[2] ? args[2] === 'on' : !config.mixieAutoHide;
            onUpdateConfig(
              { shellMode: 'mixi', mixieAutoHide: next },
              `Mixi Auto-Hide: ${next ? 'ON' : 'OFF'}`
            );
            out.push({ text: `mixie_auto_hide = ${next}`, tone: 'accent' });
          } else if (act === 'workspaces') {
            const next = args[2] ? args[2] === 'on' : !config.mixieShowWorkspaces;
            onUpdateConfig(
              { shellMode: 'mixi', mixieShowWorkspaces: next },
              `Mixi Workspaces: ${next ? 'ON' : 'OFF'}`
            );
            out.push({ text: `mixie_show_workspaces = ${next}`, tone: 'accent' });
          } else if (act === 'media') {
            const next = args[2] ? args[2] === 'on' : !config.mixieShowMedia;
            onUpdateConfig(
              { shellMode: 'mixi', mixieShowMedia: next },
              `Mixi Live Media: ${next ? 'ON' : 'OFF'}`
            );
            out.push({ text: `mixie_show_media = ${next}`, tone: 'accent' });
          } else {
            out.push({ text: 'usage: myx mixi <autohide|workspaces|media> [on|off]', tone: 'muted' });
          }
        } else if (sub === 'picker' || sub === 'hyprpicker') {
          onOpenColorPicker();
          out.push({ text: 'opened Hyprpicker screen color sampler', tone: 'accent' });
        } else if (sub === 'sidebar') {
          const prop = args[1];
          const val = args[2];
          if (prop === 'style' && (val === 'm3' || val === 'macos' || val === 'minimal')) {
            onUpdateConfig(
              { sidebarStyle: val, ...(val === 'macos' ? { sidebarAnchor: 'popover' } : {}) },
              `Sidebar Style: ${val}`
            );
            out.push({ text: `sidebar_style = "${val}"`, tone: 'accent' });
          } else if (prop === 'anchor' && (val === 'drawer' || val === 'popover')) {
            onUpdateConfig({ sidebarAnchor: val }, `Sidebar Anchor: ${val}`);
            out.push({ text: `sidebar_anchor = "${val}"`, tone: 'accent' });
          } else {
            out.push({ text: 'usage: myx sidebar <style [m3|macos|minimal]|anchor [drawer|popover]>', tone: 'muted' });
          }
        } else {
          out.push({
            text: 'usage: myx <mode [mixi|m3]|sidebar [style|anchor]|picker|wallpaper|clip|keys|theme [dark|light]|bar autohide|dock autohide|mixi>',
            tone: 'muted',
          });
        }
        break;
      }

      case 'hyprctl':
      case 'nyxctl': {
        const jsonFlag = args.includes('-j') || args.includes('--json');
        const cleanArgs = args.filter((a) => a !== '-j' && a !== '--json');

        // Support --batch "cmd1 ; cmd2"
        if (cleanArgs[0] === '--batch') {
          const batchStr = cleanArgs.slice(1).join(' ');
          const segments = batchStr.split(';').map((s) => s.trim()).filter(Boolean);
          out.push({ text: `batch executed ${segments.length} command(s): ok`, tone: 'accent' });
          break;
        }

        const sub = cleanArgs[0];
        if (sub === 'version') {
          out.push(
            { text: 'Nyx Compositor v0.4.0 (Smithay 0.4 + Calloop 0.14)', tone: 'accent' },
            { text: `features: hyprctl-ipc=${config.nyxHyprctlCompat} infinite-ws=${config.nyxInfiniteWorkspaces} groups pseudo follow-mouse=${config.nyxFollowMouse}`, tone: 'normal' }
          );
        } else if (sub === 'monitors') {
          const activeDisplays = config.displays.filter((d) => d.enabled);
          if (jsonFlag) {
            out.push({
              text: JSON.stringify(
                activeDisplays.map((d, i) => ({
                  id: i,
                  name: d.name,
                  width: d.width,
                  height: d.height,
                  refreshRate: d.refreshHz,
                  scale: d.scale,
                  activeWorkspace: { id: activeWorkspace, name: String(activeWorkspace) },
                  vrr: config.nyxVrr,
                })),
                null,
                2
              ),
              tone: 'normal',
            });
          } else {
            activeDisplays.forEach((d, i) => {
              out.push(
                { text: `Monitor ${d.name} (ID ${i}):`, tone: 'accent' },
                { text: `  ${d.width}x${d.height}@${d.refreshHz}.00Hz · scale ${d.scale.toFixed(2)} (Smithay DRM/KMS)`, tone: 'normal' },
                { text: `  active workspace: ${activeWorkspace} · vrr: ${config.nyxVrr ? 1 : 0} · layout: ${config.nyxLayout}`, tone: 'muted' }
              );
            });
          }
        } else if (sub === 'clients') {
          const openWins = windows.filter((w) => w.isOpen);
          if (jsonFlag) {
            out.push({
              text: JSON.stringify(
                openWins.map((w) => ({
                  address: `0x${w.id}`,
                  class: w.appClass,
                  title: w.title,
                  workspace: { id: w.workspace, name: String(w.workspace) },
                  floating: w.isFloating,
                  pinned: Boolean(w.isPinned),
                  grouped: Boolean(w.isGrouped),
                  pseudo: Boolean(w.isPseudo),
                  fullscreen: w.isTrueFullscreen ? 2 : w.isMaximized ? 1 : 0,
                })),
                null,
                2
              ),
              tone: 'normal',
            });
          } else {
            openWins.forEach((w) =>
              out.push({
                text: `Window ${w.appClass} -> "${w.title}" [ws=${w.workspace}, float=${w.isFloating}, group=${Boolean(w.isGrouped)}, pseudo=${Boolean(w.isPseudo)}, pin=${Boolean(w.isPinned)}]`,
                tone: w.id === focusedWindowId ? 'accent' : 'normal',
              })
            );
          }
        } else if (sub === 'activewindow') {
          const aw = windows.find((w) => w.id === focusedWindowId && w.isOpen);
          if (!aw) {
            out.push({ text: jsonFlag ? '{}' : 'Invalid', tone: 'muted' });
          } else if (jsonFlag) {
            out.push({
              text: JSON.stringify(
                {
                  address: `0x${aw.id}`,
                  class: aw.appClass,
                  title: aw.title,
                  workspace: { id: aw.workspace, name: String(aw.workspace) },
                  floating: aw.isFloating,
                  pinned: Boolean(aw.isPinned),
                  grouped: Boolean(aw.isGrouped),
                },
                null,
                2
              ),
              tone: 'normal',
            });
          } else {
            out.push(
              { text: `Window ${aw.id} -> ${aw.title}:`, tone: 'accent' },
              { text: `  class: ${aw.appClass} · workspace: ${aw.workspace} · floating: ${aw.isFloating ? 1 : 0}`, tone: 'normal' }
            );
          }
        } else if (sub === 'activeworkspace') {
          const count = windows.filter((w) => w.isOpen && w.workspace === activeWorkspace).length;
          if (jsonFlag) {
            out.push({
              text: JSON.stringify({ id: activeWorkspace, name: String(activeWorkspace), windows: count }, null, 2),
              tone: 'normal',
            });
          } else {
            out.push({ text: `workspace ID ${activeWorkspace}: ${count} window(s)`, tone: 'accent' });
          }
        } else if (sub === 'workspaces') {
          const wsList = Array.from({ length: workspaceCount }, (_, idx) => {
            const id = idx + 1;
            const count = windows.filter((w) => w.isOpen && w.workspace === id).length;
            return { id, name: String(id), windows: count };
          });
          if (jsonFlag) {
            out.push({ text: JSON.stringify(wsList, null, 2), tone: 'normal' });
          } else {
            wsList.forEach((ws) => {
              out.push({
                text: `workspace ID ${ws.id}: ${ws.windows} window(s)${ws.id === activeWorkspace ? ' [focused]' : ''}`,
                tone: ws.id === activeWorkspace ? 'accent' : 'normal',
              });
            });
          }
        } else if (sub === 'layers') {
          const activeLayers =
            config.shellMode === 'mixi'
              ? ['myx-mixie (overlay)']
              : [
                  ...(config.showBar ? [`myx-bar-${config.barPosition} (top)`] : []),
                  ...(config.showDock ? [`myx-dock-${config.dockPosition} (top)`] : []),
                ];
          if (jsonFlag) {
            out.push({ text: JSON.stringify({ layers: activeLayers }, null, 2), tone: 'normal' });
          } else {
            activeLayers.forEach((l) => out.push({ text: `layer: ${l}`, tone: 'normal' }));
          }
        } else if (sub === 'binds') {
          config.keybinds.slice(0, 12).forEach((kb) =>
            out.push({ text: `${kb.mod}+${kb.key} -> ${kb.hyprExec}`, tone: 'normal' })
          );
        } else if (sub === 'getoption') {
          const opt = cleanArgs[1] ?? '';
          const map: Record<string, string> = {
            'general:gaps_in': String(config.gapsIn),
            'general:gaps_out': String(config.gapsOut),
            'general:border_size': String(config.borderSize),
            'general:layout': config.nyxLayout,
            'decoration:rounding': String(config.rounding),
            'decoration:dim_inactive': String(config.nyxDimInactive),
            'input:follow_mouse': config.nyxFollowMouse ? '1' : '0',
            'scrolling:column_width': (config.nyxScrollColWidth / 100).toFixed(2),
          };
          out.push({
            text: opt in map ? `${opt} = ${map[opt]}` : `err · unknown option "${opt}"`,
            tone: opt in map ? 'accent' : 'error',
          });
        } else if (sub === 'reload') {
          out.push({ text: `ok · reloaded Nyx (${config.nyxConfigFormat}) + Myx`, tone: 'accent' });
        } else if (sub === 'dispatch') {
          const dispatcher = cleanArgs[1];
          const arg = cleanArgs.slice(2).join(' ');
          if (dispatcher === 'workspace') {
            const num = Number(arg);
            const maxWs = config.nyxInfiniteWorkspaces ? 20 : 5;
            if (num >= 1 && num <= maxWs) {
              onSelectWorkspace(num);
              out.push({ text: `ok · switched to workspace ${num}`, tone: 'accent' });
            } else {
              out.push({ text: `err · workspace must be 1..${maxWs}`, tone: 'error' });
            }
          } else if (
            (dispatcher === 'movetoworkspace' || dispatcher === 'movetoworkspacesilent') &&
            focusedWindowId
          ) {
            const num = Number(arg);
            const maxWs = config.nyxInfiniteWorkspaces ? 20 : 5;
            if (num >= 1 && num <= maxWs) {
              onMoveWindowWorkspace(focusedWindowId, num);
              out.push({ text: `ok · moved ${focusedWindowId} to WS ${num}`, tone: 'accent' });
            } else {
              out.push({ text: `err · workspace must be 1..${maxWs}`, tone: 'error' });
            }
          } else if (dispatcher === 'togglefloating' && focusedWindowId) {
            onToggleFloating(focusedWindowId);
            out.push({ text: `ok · toggled floating on ${focusedWindowId}`, tone: 'accent' });
          } else if (dispatcher === 'fullscreen' && focusedWindowId) {
            if (arg === '1') {
              onToggleMaximize(focusedWindowId);
              out.push({ text: `ok · toggled maximize on ${focusedWindowId}`, tone: 'accent' });
            } else {
              onToggleTrueFullscreen(focusedWindowId);
              out.push({ text: `ok · toggled true fullscreen on ${focusedWindowId}`, tone: 'accent' });
            }
          } else if (dispatcher === 'togglegroup' && focusedWindowId) {
            onToggleGroupWindow(focusedWindowId);
            out.push({ text: `ok · toggled tabbed group on ${focusedWindowId}`, tone: 'accent' });
          } else if (dispatcher === 'pseudo' && focusedWindowId) {
            onTogglePseudoWindow(focusedWindowId);
            out.push({ text: `ok · toggled pseudotile on ${focusedWindowId}`, tone: 'accent' });
          } else if (dispatcher === 'pin' && focusedWindowId) {
            onTogglePinWindow(focusedWindowId);
            out.push({ text: `ok · toggled pin on ${focusedWindowId}`, tone: 'accent' });
          } else if (dispatcher === 'killactive' && focusedWindowId) {
            onCloseWindow(focusedWindowId);
            out.push({ text: `ok · closed ${focusedWindowId}`, tone: 'accent' });
          } else if (dispatcher === 'cyclenext') {
            onFocusAdjacentWindow(1);
            out.push({ text: 'ok · focused next window', tone: 'accent' });
          } else if (dispatcher === 'cycleprev') {
            onFocusAdjacentWindow(-1);
            out.push({ text: 'ok · focused previous window', tone: 'accent' });
          } else if (dispatcher === 'movefocus') {
            const dir = arg === 'l' || arg === 'u' ? -1 : 1;
            onFocusAdjacentWindow(dir);
            out.push({ text: `ok · movefocus ${arg || 'r'}`, tone: 'accent' });
          } else if ((dispatcher === 'swapnext' || dispatcher === 'swapwindow') && focusedWindowId) {
            const dir = arg === 'l' || arg === 'u' ? -1 : 1;
            onSwapWindow(focusedWindowId, dir);
            out.push({ text: `ok · swapped window (${arg || 'next'})`, tone: 'accent' });
          } else if (dispatcher === 'swapprev' && focusedWindowId) {
            onSwapWindow(focusedWindowId, -1);
            out.push({ text: 'ok · swapped column left', tone: 'accent' });
          } else if (dispatcher === 'togglesplit') {
            onUpdateConfig({ nyxLayout: config.nyxLayout === 'dwindle' ? 'master' : 'dwindle' });
            out.push({ text: 'ok · toggled split topology', tone: 'accent' });
          } else if (dispatcher === 'exec') {
            const map: Record<string, AppWindowId> = {
              'nyx-term': 'terminal',
              'myx-term': 'terminal',
              term: 'terminal',
              terminal: 'terminal',
              customizer: 'customizer',
              'myx-ctl': 'customizer',
              files: 'code_export',
              code: 'code_export',
              telemetry: 'telemetry',
              'btop-rs': 'telemetry',
              notes: 'notes',
              scratchpad: 'notes',
            };
            const appId = map[arg.toLowerCase()];
            if (appId) {
              onFocusOrOpenApp(appId);
              out.push({ text: `ok · launched ${arg}`, tone: 'accent' });
            } else {
              out.push({ text: `err · unknown app "${arg}"`, tone: 'error' });
            }
          } else {
            out.push({ text: `err · invalid dispatch "${dispatcher ?? ''}"`, tone: 'error' });
          }
        } else if (sub === 'keyword') {
          const [, key, val] = cleanArgs;
          if (key === 'general:gaps_in' && !Number.isNaN(Number(val))) {
            onUpdateConfig({ gapsIn: Math.max(0, Math.min(24, Number(val))) }, `gaps_in = ${val}`);
            out.push({ text: 'ok', tone: 'accent' });
          } else if (key === 'general:gaps_out' && !Number.isNaN(Number(val))) {
            onUpdateConfig({ gapsOut: Math.max(0, Math.min(36, Number(val))) }, `gaps_out = ${val}`);
            out.push({ text: 'ok', tone: 'accent' });
          } else if (key === 'decoration:rounding' && !Number.isNaN(Number(val))) {
            onUpdateConfig({ rounding: Math.max(0, Math.min(28, Number(val))) }, `rounding = ${val}`);
            out.push({ text: 'ok', tone: 'accent' });
          } else if (key === 'decoration:dim_inactive') {
            const next = val === 'true' || val === '1';
            onUpdateConfig({ nyxDimInactive: next }, `dim_inactive = ${next}`);
            out.push({ text: 'ok', tone: 'accent' });
          } else if (key === 'input:follow_mouse') {
            const next = val === 'true' || val === '1';
            onUpdateConfig({ nyxFollowMouse: next }, `follow_mouse = ${next}`);
            out.push({ text: 'ok', tone: 'accent' });
          } else if (key === 'dwindle:pseudotile') {
            const next = val === 'true' || val === '1';
            onUpdateConfig({ nyxPseudotile: next }, `pseudotile = ${next}`);
            out.push({ text: 'ok', tone: 'accent' });
          } else if (key === 'scrolling:column_width' && !Number.isNaN(Number(val))) {
            const rawNum = Number(val);
            const pct = rawNum <= 1 ? Math.round(rawNum * 100) : Math.round(rawNum);
            const clamped = Math.max(38, Math.min(100, pct));
            onUpdateConfig({ nyxScrollColWidth: clamped }, `column_width = ${clamped}%`);
            out.push({ text: `ok · column_width = ${clamped}%`, tone: 'accent' });
          } else if (key === 'general:layout') {
            const layoutMap: Record<string, NyxLayoutMode> = {
              dwindle: 'dwindle',
              scrolling: 'scrolling',
              niri: 'scrolling',
              master: 'master',
              mango: 'master',
            };
            const nextLayout = layoutMap[val];
            if (nextLayout) {
              onUpdateConfig({ nyxLayout: nextLayout }, `Layout: ${nextLayout}`);
              out.push({ text: `ok · layout set to ${nextLayout}`, tone: 'accent' });
            } else {
              out.push({ text: 'err · use dwindle, scrolling, or master', tone: 'error' });
            }
          } else {
            out.push({ text: `err · unsupported keyword "${key ?? ''}"`, tone: 'error' });
          }
        } else {
          out.push({
            text: 'usage: hyprctl [-j] <clients|workspaces|monitors|activewindow|activeworkspace|layers|binds|getoption|version|dispatch|keyword|--batch|reload>',
            tone: 'muted',
          });
        }
        break;
      }

      case 'cargo':
        out.push(
          { text: '   Compiling nyx-ipc v0.3.0', tone: 'muted' },
          { text: '   Compiling nyx-config v0.3.0', tone: 'muted' },
          { text: '   Compiling nyx-compositor v0.3.0 (smithay 0.4)', tone: 'muted' },
          { text: '   Compiling myx-daemon v0.3.0', tone: 'muted' },
          { text: '    Finished `release` profile [optimized] target(s) in 4.18s', tone: 'accent' }
        );
        break;

      default:
        out.push({
          text: `zsh: command not found: ${cmd} (type "help" for built-in commands)`,
          tone: 'error',
        });
    }

    push(out);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      const nextIdx = Math.min(cmdHistory.length - 1, historyIdx + 1);
      setHistoryIdx(nextIdx);
      setInput(cmdHistory[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx <= 0) {
        setHistoryIdx(-1);
        setInput('');
      } else {
        const nextIdx = historyIdx - 1;
        setHistoryIdx(nextIdx);
        setInput(cmdHistory[nextIdx]);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const parts = input.split(/\s+/);
      const last = parts[parts.length - 1] ?? '';
      if (parts.length <= 1) {
        const match = BUILTIN_COMMANDS.find((c) => c.startsWith(last));
        if (match) setInput(match + ' ');
      } else {
        const { dirs, files } = listDirEntries(cwd);
        const candidates = [...dirs.map((d) => `${d}/`), ...files];
        const match = candidates.find((c) => c.startsWith(last));
        if (match) {
          parts[parts.length - 1] = match;
          setInput(parts.join(' '));
        }
      }
    } else if (e.ctrlKey && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      setLines([]);
    } else if (e.ctrlKey && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      setLines((prev) => [...prev, { id: nextId.current++, text: `${cwd} ❯ ${input}^C`, tone: 'muted' }]);
      setInput('');
    }
  };

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className="flex flex-col h-full min-h-0 font-mono-code text-xs cursor-text"
      style={{ color: palette.onSurface }}
    >
      {/* Zsh Status Ribbon */}
      <div
        className="flex items-center justify-between gap-2 px-3.5 py-1.5 border-b text-[11px] shrink-0 select-none"
        style={{
          borderColor: hexToRgba(palette.outlineVariant, 0.35),
          backgroundColor: hexToRgba(palette.surfaceContainer, 0.55),
          color: palette.onSurfaceVariant,
        }}
      >
        <span>zsh 5.9 · {cwd}</span>
        <span>Tab complete · ↑/↓ history · Ctrl+L clear</span>
      </div>

      {/* Scrollback Buffer */}
      <div className="flex-1 overflow-y-auto px-4 pt-3.5 pb-3 space-y-1 leading-relaxed select-text">
        {lines.map((line) => (
          <pre
            key={line.id}
            className="whitespace-pre-wrap break-words font-mono-code"
            style={{
              color:
                line.tone === 'accent'
                  ? palette.primary
                  : line.tone === 'error'
                    ? palette.error
                    : line.tone === 'muted'
                      ? palette.onSurfaceVariant
                      : palette.onSurface,
            }}
          >
            {line.text}
          </pre>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Powerlevel10k / Zsh Prompt Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          runCommand(input);
          setInput('');
        }}
        className="flex items-center gap-2 px-4 pt-3 pb-4 border-t shrink-0"
        style={{
          borderColor: hexToRgba(palette.outlineVariant, 0.4),
          backgroundColor: hexToRgba(palette.surfaceContainer, 0.42),
        }}
      >
        <span className="font-semibold shrink-0 flex items-center gap-1.5">
          <span style={{ color: palette.tertiary }}>ammar</span>
          <span style={{ color: palette.onSurfaceVariant }}>{cwd}</span>
          <span style={{ color: palette.primary }}>❯</span>
        </span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          placeholder="Type any zsh command (ls, cat ~/.config/nyx/nyx.toml, hyprctl clients...)"
          className="flex-1 bg-transparent outline-none font-mono-code text-xs"
        />
      </form>
    </div>
  );
};
