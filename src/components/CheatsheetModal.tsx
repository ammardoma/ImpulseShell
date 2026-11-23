import React, { useEffect, useMemo, useState } from 'react';
import { Keyboard, RotateCcw, Search, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { DEFAULT_KEYBINDS, hexToRgba } from '../lib/m3Engine';
import { getSurfaceStyles } from '../lib/surfaceMaterial';
import { KeybindActionId, KeybindEntry, M3Palette, ShellConfig } from '../types/shell';

interface CheatsheetModalProps {
  open: boolean;
  config: ShellConfig;
  palette: M3Palette;
  bezierPoints: [number, number, number, number];
  onClose: () => void;
  onUpdateKeybinds: (keybinds: KeybindEntry[]) => void;
}

const MODS: KeybindEntry['mod'][] = ['Alt', 'Ctrl+Alt', 'Shift+Alt'];
const CATEGORIES: ('All' | KeybindEntry['category'])[] = [
  'All',
  'Shell',
  'Windows',
  'Workspaces',
  'Utilities',
];

export const CheatsheetModal: React.FC<CheatsheetModalProps> = ({
  open,
  config,
  palette,
  bezierPoints,
  onClose,
  onUpdateKeybinds,
}) => {
  const [capturingId, setCapturingId] = useState<KeybindActionId | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'All' | KeybindEntry['category']>('All');

  useEffect(() => {
    if (!open) {
      setCapturingId(null);
      setQuery('');
      setCategory('All');
    }
  }, [open]);

  useEffect(() => {
    if (!capturingId) return;

    const onKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Escape') {
        setCapturingId(null);
        return;
      }
      if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;

      const normalizedKey =
        e.code === 'Space' ? 'Space' : e.key.length === 1 ? e.key.toLowerCase() : e.key;

      const mod: KeybindEntry['mod'] = e.ctrlKey
        ? 'Ctrl+Alt'
        : e.shiftKey
          ? 'Shift+Alt'
          : 'Alt';

      onUpdateKeybinds(
        config.keybinds.map((kb) =>
          kb.id === capturingId ? { ...kb, mod, key: normalizedKey } : kb
        )
      );
      setCapturingId(null);
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [capturingId, config.keybinds, onUpdateKeybinds]);

  const cycleMod = (id: KeybindActionId) => {
    onUpdateKeybinds(
      config.keybinds.map((kb) => {
        if (kb.id !== id) return kb;
        const nextMod = MODS[(MODS.indexOf(kb.mod) + 1) % MODS.length];
        return { ...kb, mod: nextMod };
      })
    );
  };

  const filteredKeybinds = useMemo(() => {
    const q = query.trim().toLowerCase();
    return config.keybinds.filter((kb) => {
      if (category !== 'All' && kb.category !== category) return false;
      if (!q) return true;
      return (
        kb.label.toLowerCase().includes(q) ||
        kb.category.toLowerCase().includes(q) ||
        kb.hyprExec.toLowerCase().includes(q) ||
        `${kb.mod}+${kb.key}`.toLowerCase().includes(q)
      );
    });
  }, [config.keybinds, query, category]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            setCapturingId(null);
            onClose();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.24 * config.animSpeed, ease: bezierPoints }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl p-5 flex flex-col gap-3.5 max-h-[85vh] overflow-hidden"
            style={{
              borderRadius: Math.max(18, config.rounding + 4),
              color: palette.onSurface,
              ...getSurfaceStyles(
                config.materialType,
                config.transparency,
                palette,
                config.darkMode,
                { elevation: 'overlay', blurPasses: config.blurPasses }
              ),
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Keyboard className="w-4 h-4" style={{ color: palette.primary }} />
                <div>
                  <h2 className="text-base font-display font-semibold">
                    Myx + Nyx Keybind Editor
                  </h2>
                  <p className="text-xs" style={{ color: palette.onSurfaceVariant }}>
                    Click any key badge to press a new shortcut, or click the modifier to cycle it
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateKeybinds(DEFAULT_KEYBINDS)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium cursor-pointer"
                  style={{
                    backgroundColor: palette.surfaceContainerHigh,
                    color: palette.onSurfaceVariant,
                  }}
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close keybinds editor"
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 cursor-pointer"
                  style={{ backgroundColor: palette.surfaceContainerHigh }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search & Category Filter */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div
                className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ backgroundColor: hexToRgba(palette.surfaceContainerHigh, 0.72) }}
              >
                <Search className="w-3.5 h-3.5 shrink-0" style={{ color: palette.onSurfaceVariant }} />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter keybinds by action, key, or command..."
                  className="w-full bg-transparent text-xs outline-none"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    aria-label="Clear search"
                    className="opacity-65 hover:opacity-100 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div
                className="flex items-center gap-1 p-1 rounded-xl overflow-x-auto shrink-0"
                style={{ backgroundColor: hexToRgba(palette.surfaceContainer, 0.72) }}
              >
                {CATEGORIES.map((cat) => {
                  const active = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap cursor-pointer"
                      style={{
                        backgroundColor: active ? palette.primaryContainer : 'transparent',
                        color: active ? palette.onPrimaryContainer : palette.onSurfaceVariant,
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="overflow-y-auto space-y-2 pr-1">
              {filteredKeybinds.length === 0 ? (
                <div className="py-8 text-center text-xs" style={{ color: palette.onSurfaceVariant }}>
                  No keybinds match "{query}".
                </div>
              ) : (
                filteredKeybinds.map((kb) => {
                  const isCapturing = capturingId === kb.id;
                  return (
                    <div
                      key={kb.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-2xl"
                      style={{ backgroundColor: hexToRgba(palette.surfaceContainer, 0.72) }}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate">{kb.label}</div>
                        <div
                          className="text-[11px] font-mono-code truncate"
                          style={{ color: palette.onSurfaceVariant }}
                        >
                          {kb.category} · {kb.hyprExec}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => cycleMod(kb.id)}
                          title="Click to cycle modifier"
                          className="px-2.5 py-1 rounded-lg font-mono-code text-xs font-medium cursor-pointer"
                          style={{
                            backgroundColor: palette.surfaceContainerHighest,
                            color: palette.onSurfaceVariant,
                          }}
                        >
                          {kb.mod}
                        </button>
                        <span className="text-xs opacity-50">+</span>
                        <button
                          type="button"
                          onClick={() => setCapturingId(isCapturing ? null : kb.id)}
                          className="min-w-[68px] px-3 py-1 rounded-lg font-mono-code text-xs font-semibold cursor-pointer transition-colors"
                          style={{
                            backgroundColor: isCapturing
                              ? palette.primary
                              : palette.primaryContainer,
                            color: isCapturing
                              ? palette.onPrimary
                              : palette.onPrimaryContainer,
                          }}
                        >
                          {isCapturing ? 'Press key...' : kb.key.toUpperCase()}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}

              {(category === 'All' || category === 'Workspaces') && !query.trim() && (
                <div className="grid sm:grid-cols-2 gap-2 pt-1">
                  <div
                    className="flex items-center justify-between gap-3 p-3 rounded-2xl text-xs"
                    style={{ backgroundColor: hexToRgba(palette.surfaceContainer, 0.5) }}
                  >
                    <span style={{ color: palette.onSurfaceVariant }}>
                      Switch Workspace {config.nyxInfiniteWorkspaces ? '1 – 9' : '1 – 5'}
                    </span>
                    <kbd
                      className="font-mono-code px-2.5 py-1 rounded-lg shrink-0"
                      style={{ backgroundColor: palette.surfaceContainerHighest }}
                    >
                      {config.nyxInfiniteWorkspaces ? 'Alt + 1..9' : 'Alt + 1..5'}
                    </kbd>
                  </div>
                  <div
                    className="flex items-center justify-between gap-3 p-3 rounded-2xl text-xs"
                    style={{ backgroundColor: hexToRgba(palette.surfaceContainer, 0.5) }}
                  >
                    <span style={{ color: palette.onSurfaceVariant }}>
                      Move Window to WS {config.nyxInfiniteWorkspaces ? '1 – 9' : '1 – 5'}
                    </span>
                    <kbd
                      className="font-mono-code px-2.5 py-1 rounded-lg shrink-0"
                      style={{ backgroundColor: palette.surfaceContainerHighest }}
                    >
                      {config.nyxInfiniteWorkspaces ? 'Shift+Alt + 1..9' : 'Shift+Alt + 1..5'}
                    </kbd>
                  </div>
                  <div
                    className="flex items-center justify-between gap-3 p-3 rounded-2xl text-xs"
                    style={{ backgroundColor: hexToRgba(palette.surfaceContainer, 0.5) }}
                  >
                    <span style={{ color: palette.onSurfaceVariant }}>
                      Focus Prev / Next Column
                    </span>
                    <kbd
                      className="font-mono-code px-2.5 py-1 rounded-lg shrink-0"
                      style={{ backgroundColor: palette.surfaceContainerHighest }}
                    >
                      Alt + ← / →
                    </kbd>
                  </div>
                  <div
                    className="flex items-center justify-between gap-3 p-3 rounded-2xl text-xs"
                    style={{ backgroundColor: hexToRgba(palette.surfaceContainer, 0.5) }}
                  >
                    <span style={{ color: palette.onSurfaceVariant }}>
                      Swap Column Left / Right
                    </span>
                    <kbd
                      className="font-mono-code px-2.5 py-1 rounded-lg shrink-0"
                      style={{ backgroundColor: palette.surfaceContainerHighest }}
                    >
                      Shift+Alt + ← / →
                    </kbd>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
