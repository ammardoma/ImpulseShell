import React from 'react';
import { getConfigFormatRamOverhead, getTotalRamMb, hexToRgba } from '../../lib/m3Engine';
import { M3Palette, ShellConfig } from '../../types/shell';

interface TelemetryAppProps {
  config: ShellConfig;
  palette: M3Palette;
}

export const TelemetryApp: React.FC<TelemetryAppProps> = ({ config, palette }) => {
  const ram = getTotalRamMb(config);
  const cfgOverhead = getConfigFormatRamOverhead(config);
  const enabledModules = config.modules.filter((m) => m.enabled);
  const totalBinaryKb = enabledModules.reduce((acc, m) => acc + m.binaryKb, 0);

  const comparisons = [
    {
      shell: `Nyx (Smithay) + Myx Shell [${config.nyxConfigFormat.toUpperCase()} config]`,
      ramMb: ram.totalMb,
      runtime: 'Pure Rust compositor + single-binary M3 shell (zero GC)',
      highlight: true,
    },
    {
      shell: 'Niri (Smithay) + Quickshell (Qt6/QML)',
      ramMb: 146.0,
      runtime: 'Rust compositor + Qt Quick QML scenegraph',
      highlight: false,
    },
    {
      shell: 'Hyprland (C++) + AGS v1 (end-4 default)',
      ramMb: 192.5,
      runtime: 'wlroots/Aquamarine + SpiderMonkey JS + GTK3',
      highlight: false,
    },
    {
      shell: 'Wayland WM + Electron / WebView Shell',
      ramMb: 318.0,
      runtime: 'Chromium / WebKitGTK multi-process',
      highlight: false,
    },
  ];

  const maxRam = 340;

  return (
    <div className="h-full overflow-y-auto p-4 space-y-5" style={{ color: palette.onSurface }}>
      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Nyx + Myx RSS', value: `${ram.totalMb.toFixed(1)} MB` },
          { label: 'Nyx Compositor', value: `${ram.compositorMb.toFixed(1)} MB` },
          { label: 'Myx Shell', value: `${ram.shellMb.toFixed(1)} MB` },
          { label: 'Config Overhead', value: `${cfgOverhead.toFixed(1)} MB` },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="p-3 rounded-xl"
            style={{
              backgroundColor: hexToRgba(palette.surfaceContainer, 0.72),
              border: `1px solid ${hexToRgba(palette.outlineVariant, 0.35)}`,
            }}
          >
            <div className="text-[11px]" style={{ color: palette.onSurfaceVariant }}>
              {kpi.label}
            </div>
            <div
              className="text-lg font-display font-bold tabular-nums mt-0.5"
              style={{ color: palette.primary }}
            >
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Full Stack Comparison */}
      <section
        className="p-4 rounded-2xl space-y-3"
        style={{ backgroundColor: hexToRgba(palette.surfaceContainer, 0.72) }}
      >
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-display font-semibold">
              Compositor + Shell Memory Comparison
            </h3>
            <p className="text-xs" style={{ color: palette.onSurfaceVariant }}>
              Combined Resident Set Size (RSS) for compositor + bar + dock + launcher + sidebar
            </p>
          </div>
          <span className="text-xs font-mono-code tabular-nums" style={{ color: palette.onSurfaceVariant }}>
            Bin {(totalBinaryKb / 1024).toFixed(2)} MB
          </span>
        </div>

        <div className="space-y-3 pt-1">
          {comparisons.map((row) => {
            const pct = Math.min(100, Math.round((row.ramMb / maxRam) * 100));
            return (
              <div key={row.shell} className="space-y-1">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className={row.highlight ? 'font-semibold' : 'font-medium'}>
                    {row.shell}
                  </span>
                  <span
                    className="font-mono-code tabular-nums shrink-0"
                    style={{ color: row.highlight ? palette.primary : palette.onSurfaceVariant }}
                  >
                    {row.ramMb.toFixed(1)} MB
                  </span>
                </div>
                <div
                  className="h-2.5 w-full rounded-full overflow-hidden"
                  style={{ backgroundColor: palette.surfaceContainerHighest }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: row.highlight ? palette.primary : palette.outline,
                    }}
                  />
                </div>
                <div className="text-[11px]" style={{ color: palette.onSurfaceVariant }}>
                  {row.runtime}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Per-Crate Allocation Table */}
      <section
        className="rounded-2xl overflow-hidden border"
        style={{
          borderColor: hexToRgba(palette.outlineVariant, 0.4),
          backgroundColor: hexToRgba(palette.surfaceContainer, 0.72),
        }}
      >
        <table className="w-full text-left text-xs">
          <thead>
            <tr
              className="border-b"
              style={{
                borderColor: hexToRgba(palette.outlineVariant, 0.4),
                color: palette.onSurfaceVariant,
              }}
            >
              <th className="py-2.5 px-3.5 font-semibold">Rust Crate</th>
              <th className="py-2.5 px-3.5 font-semibold">State</th>
              <th className="py-2.5 px-3.5 font-semibold text-right">Binary</th>
              <th className="py-2.5 px-3.5 font-semibold text-right">RAM RSS</th>
            </tr>
          </thead>
          <tbody>
            {config.modules.map((m) => (
              <tr
                key={m.id}
                className="border-b last:border-b-0"
                style={{ borderColor: hexToRgba(palette.outlineVariant, 0.25) }}
              >
                <td className="py-2.5 px-3.5">
                  <div className="font-medium">{m.label}</div>
                  <div className="font-mono-code text-[11px]" style={{ color: palette.onSurfaceVariant }}>
                    {m.crateName}
                  </div>
                </td>
                <td className="py-2.5 px-3.5 font-mono-code">
                  <span style={{ color: m.enabled ? palette.primary : palette.onSurfaceVariant }}>
                    {m.enabled ? 'active' : 'disabled'}
                  </span>
                </td>
                <td className="py-2.5 px-3.5 text-right font-mono-code tabular-nums">
                  {m.binaryKb} KB
                </td>
                <td className="py-2.5 px-3.5 text-right font-mono-code tabular-nums font-semibold">
                  {m.enabled ? `${m.ramMb.toFixed(1)} MB` : '0.0 MB'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};
