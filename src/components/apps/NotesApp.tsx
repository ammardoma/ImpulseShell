import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { hexToRgba } from '../../lib/m3Engine';
import { M3Palette } from '../../types/shell';

interface NotesAppProps {
  palette: M3Palette;
}

const NOTES_STORAGE_KEY = 'myx_scratchpad_notes_v1';

const DEFAULT_NOTE = `# Myx + Nyx Scratchpad

- Compositor: Nyx (Smithay + Calloop)
- Rice: Myx (Material 3 + Glass)
- Try running \`hyprctl dispatch workspace 2\` or \`hyprctl keyword general:layout scrolling\` in nyx-term!
`;

export const NotesApp: React.FC<NotesAppProps> = ({ palette }) => {
  const [content, setContent] = useState(() => {
    try {
      return window.localStorage.getItem(NOTES_STORAGE_KEY) ?? DEFAULT_NOTE;
    } catch {
      return DEFAULT_NOTE;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(NOTES_STORAGE_KEY, content);
    } catch {
      // Ignore storage error cleanly
    }
  }, [content]);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div className="flex flex-col h-full min-h-0" style={{ color: palette.onSurface }}>
      <div
        className="flex items-center justify-between px-4 py-2 border-b text-xs shrink-0"
        style={{
          borderColor: hexToRgba(palette.outlineVariant, 0.4),
          color: palette.onSurfaceVariant,
        }}
      >
        <span className="font-mono-code tabular-nums">
          ~/Documents/scratchpad.md · {wordCount} words
        </span>
        <button
          type="button"
          onClick={() => setContent('')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:opacity-80 cursor-pointer"
          style={{
            backgroundColor: palette.surfaceContainerHigh,
            color: palette.onSurface,
          }}
        >
          <Trash2 className="w-3 h-3" />
          <span>Clear</span>
        </button>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write quick notes, keybinds, or Hyprland snippets..."
        className="flex-1 w-full p-4 bg-transparent outline-none resize-none font-mono-code text-xs leading-relaxed"
      />
    </div>
  );
};
