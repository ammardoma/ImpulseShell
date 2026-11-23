import React, { useMemo, useState } from 'react';
import { Clipboard, Pin, Plus, Search, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { hexToRgba } from '../lib/m3Engine';
import { getSurfaceStyles } from '../lib/surfaceMaterial';
import { ClipboardItem, M3Palette, ShellConfig } from '../types/shell';

interface ClipboardModalProps {
  open: boolean;
  config: ShellConfig;
  palette: M3Palette;
  items: ClipboardItem[];
  bezierPoints: [number, number, number, number];
  onClose: () => void;
  onCopyItem: (item: ClipboardItem) => void;
  onAddItem: (text: string) => void;
  onTogglePin: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onClearUnpinned: () => void;
}

export const ClipboardModal: React.FC<ClipboardModalProps> = ({
  open,
  config,
  palette,
  items,
  bezierPoints,
  onClose,
  onCopyItem,
  onAddItem,
  onTogglePin,
  onDeleteItem,
  onClearUnpinned,
}) => {
  const [query, setQuery] = useState('');
  const [newClip, setNewClip] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...items].sort((a, b) => Number(b.pinned) - Number(a.pinned));
    if (!q) return sorted;
    return sorted.filter(
      (i) => i.text.toLowerCase().includes(q) || i.source.toLowerCase().includes(q)
    );
  }, [items, query]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 16, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 12, scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.25 * config.animSpeed, ease: bezierPoints }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl flex flex-col max-h-[80vh] overflow-hidden"
            style={{
              borderRadius: Math.max(18, config.rounding + 6),
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
            {/* Header */}
            <div
              className="flex items-center justify-between gap-3 px-4 py-3 border-b"
              style={{ borderColor: hexToRgba(palette.outlineVariant, 0.45) }}
            >
              <div className="flex items-center gap-2">
                <Clipboard className="w-4 h-4" style={{ color: palette.primary }} />
                <h2 className="text-sm font-display font-semibold">
                  Clipboard Ring (myx-clip)
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClearUnpinned}
                  className="text-xs px-2.5 py-1 rounded-full hover:opacity-80 cursor-pointer"
                  style={{
                    backgroundColor: palette.surfaceContainerHigh,
                    color: palette.onSurfaceVariant,
                  }}
                >
                  Clear unpinned
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close clipboard"
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:opacity-80 cursor-pointer"
                  style={{ backgroundColor: palette.surfaceContainerHigh }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search + Add Clip */}
            <div
              className="p-3 border-b space-y-2"
              style={{ borderColor: hexToRgba(palette.outlineVariant, 0.35) }}
            >
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ backgroundColor: hexToRgba(palette.surfaceContainerHigh, 0.72) }}
              >
                <Search className="w-3.5 h-3.5 shrink-0" style={{ color: palette.onSurfaceVariant }} />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search clipboard history..."
                  className="w-full bg-transparent text-xs outline-none"
                />
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newClip.trim()) return;
                  onAddItem(newClip.trim());
                  setNewClip('');
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={newClip}
                  onChange={(e) => setNewClip(e.target.value)}
                  placeholder="Save a new snippet to clipboard..."
                  className="flex-1 px-3 py-1.5 rounded-xl text-xs outline-none"
                  style={{ backgroundColor: hexToRgba(palette.surfaceContainer, 0.8) }}
                />
                <button
                  type="submit"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
                  style={{ backgroundColor: palette.primary, color: palette.onPrimary }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </form>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filtered.length === 0 ? (
                <div className="py-10 text-center text-xs" style={{ color: palette.onSurfaceVariant }}>
                  Clipboard ring is empty. Copy text anywhere or add a snippet above.
                </div>
              ) : (
                filtered.map((item) => (
                  <div
                    key={item.id}
                    className="group flex items-start justify-between gap-3 p-3 rounded-2xl transition-colors"
                    style={{
                      backgroundColor: item.pinned
                        ? hexToRgba(palette.primaryContainer, 0.45)
                        : hexToRgba(palette.surfaceContainer, 0.75),
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onCopyItem(item);
                        onClose();
                      }}
                      className="flex-1 min-w-0 text-left cursor-pointer"
                    >
                      <pre className="font-mono-code text-xs whitespace-pre-wrap break-all leading-relaxed">
                        {item.text}
                      </pre>
                      <div
                        className="flex items-center gap-1.5 text-[11px] mt-1"
                        style={{ color: palette.onSurfaceVariant }}
                      >
                        <span>{item.source}</span>
                        <span>·</span>
                        <span>{item.timestamp}</span>
                        {item.pinned && (
                          <>
                            <span>·</span>
                            <span style={{ color: palette.primary }}>Pinned</span>
                          </>
                        )}
                      </div>
                    </button>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onTogglePin(item.id)}
                        title={item.pinned ? 'Unpin' : 'Pin'}
                        className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 cursor-pointer"
                        style={{
                          color: item.pinned ? palette.primary : palette.onSurfaceVariant,
                        }}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteItem(item.id)}
                        title="Delete clip"
                        className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 cursor-pointer"
                        style={{ color: palette.onSurfaceVariant }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
