import React, { useMemo, useState } from 'react';
import { Check, Copy, Download, FileCode2 } from 'lucide-react';
import { hexToRgba } from '../../lib/m3Engine';
import { generateRustShellFiles } from '../../lib/rustShellGenerator';
import { M3Palette, ShellConfig } from '../../types/shell';

interface CodeExportAppProps {
  config: ShellConfig;
  palette: M3Palette;
  onDownloadZip: () => void;
  onPushClipboard?: (text: string, source: string) => void;
}

export const CodeExportApp: React.FC<CodeExportAppProps> = ({
  config,
  palette,
  onDownloadZip,
  onPushClipboard,
}) => {
  const files = useMemo(() => generateRustShellFiles(config, palette), [config, palette]);
  const [selectedPath, setSelectedPath] = useState(files[0].path);
  const [copied, setCopied] = useState(false);

  const activeFile = files.find((f) => f.path === selectedPath) ?? files[0];

  const handleCopy = async () => {
    onPushClipboard?.(activeFile.content, activeFile.path);
    try {
      await navigator.clipboard.writeText(activeFile.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0" style={{ color: palette.onSurface }}>
      {/* Top Action Bar */}
      <div
        className="flex items-center justify-between gap-3 px-4 py-2.5 border-b shrink-0"
        style={{ borderColor: hexToRgba(palette.outlineVariant, 0.45) }}
      >
        <div className="min-w-0">
          <div className="text-xs font-semibold truncate">{activeFile.path}</div>
          <div className="text-[11px] truncate" style={{ color: palette.onSurfaceVariant }}>
            {activeFile.description}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer"
            style={{
              backgroundColor: palette.surfaceContainerHigh,
              color: palette.onSurface,
            }}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy File'}</span>
          </button>

          <button
            type="button"
            onClick={onDownloadZip}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-transform active:scale-95 cursor-pointer"
            style={{
              backgroundColor: palette.primary,
              color: palette.onPrimary,
            }}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Linux DE (.zip)</span>
          </button>
        </div>
      </div>

      {/* Split Explorer + Code Pane */}
      <div className="flex flex-1 min-h-0">
        <aside
          className="w-52 border-r overflow-y-auto p-2 flex flex-col gap-1 shrink-0"
          style={{
            borderColor: hexToRgba(palette.outlineVariant, 0.4),
            backgroundColor: palette.surfaceContainer,
          }}
        >
          {files.map((f) => {
            const active = f.path === activeFile.path;
            return (
              <button
                key={f.path}
                type="button"
                onClick={() => setSelectedPath(f.path)}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs transition-colors cursor-pointer"
                style={{
                  backgroundColor: active ? palette.primaryContainer : 'transparent',
                  color: active ? palette.onPrimaryContainer : palette.onSurfaceVariant,
                }}
              >
                <FileCode2 className="w-3.5 h-3.5 shrink-0" />
                <span className="font-mono-code text-[11px] truncate">{f.path}</span>
              </button>
            );
          })}
        </aside>

        <div className="flex-1 overflow-auto p-4" style={{ backgroundColor: palette.surfaceContainerLowest }}>
          <pre className="font-mono-code text-xs leading-relaxed whitespace-pre select-text">
            {activeFile.content}
          </pre>
        </div>
      </div>
    </div>
  );
};
