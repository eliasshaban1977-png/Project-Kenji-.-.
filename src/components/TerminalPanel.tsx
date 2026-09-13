import React, { useRef, useEffect, useState } from 'react';
import { TerminalLogEntry } from '../types';
import { Copy, Trash2, Pause, Play, Check } from 'lucide-react';

interface TerminalPanelProps {
  logs: TerminalLogEntry[];
  onClearLogs: () => void;
  isStreamPaused: boolean;
  onToggleStreamPause: () => void;
}

export const TerminalPanel: React.FC<TerminalPanelProps> = ({
  logs,
  onClearLogs,
  isStreamPaused,
  onToggleStreamPause,
}) => {
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleCopyLogs = () => {
    const fullText = logs
      .map((l) => `[${l.timestamp}] ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="w-full mt-3">
      <div className="flex items-center justify-between pb-1 px-1 text-[10px] text-gray-400 font-mono">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[#00ff00] animate-pulse"></span>
          <span className="text-[#00ffaa] font-bold">TELEMETRY STREAM // MUDOS-6G IO</span>
          <span className="text-gray-500">({logs.length} events)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleStreamPause}
            className="flex items-center gap-1 px-2 py-0.5 bg-[#111] hover:bg-[#222] border border-[#4a4a4a] text-[#b87333] hover:text-[#00ffaa] rounded text-[10px]"
            title={isStreamPaused ? 'Resume Telemetry Stream' : 'Pause Telemetry Stream'}
          >
            {isStreamPaused ? <Play size={10} /> : <Pause size={10} />}
            {isStreamPaused ? 'RESUME' : 'PAUSE'}
          </button>
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2 py-0.5 border text-[10px] rounded ${
              autoScroll
                ? 'bg-[#00ffaa]/10 border-[#00ffaa] text-[#00ffaa]'
                : 'bg-[#111] border-[#4a4a4a] text-gray-400'
            }`}
            title="Toggle Auto Scroll"
          >
            AUTO-SCROLL
          </button>
          <button
            onClick={handleCopyLogs}
            className="flex items-center gap-1 px-2 py-0.5 bg-[#111] hover:bg-[#222] border border-[#4a4a4a] text-gray-300 hover:text-white rounded text-[10px]"
            title="Copy all telemetry logs"
          >
            {copied ? <Check size={10} className="text-[#00ff00]" /> : <Copy size={10} />}
            {copied ? 'COPIED' : 'COPY'}
          </button>
          <button
            onClick={onClearLogs}
            className="flex items-center gap-1 px-2 py-0.5 bg-[#111] hover:bg-[#222] border border-[#4a4a4a] text-gray-400 hover:text-red-400 rounded text-[10px]"
            title="Clear logs"
          >
            <Trash2 size={10} />
            CLEAR
          </button>
        </div>
      </div>

      <div
        id="terminalLog"
        ref={terminalRef}
        className="terminal-block terminal-scrollbar"
        style={{
          background: '#000000',
          color: 'var(--terminal-green, #00ff00)',
          padding: '15px',
          border: '1px solid var(--border-gray, #4a4a4a)',
          borderLeft: '4px solid var(--cyan-accent, #00ffaa)',
          height: '150px',
          overflowY: 'auto',
          textAlign: 'left',
          fontSize: '11px',
          whiteSpace: 'pre-wrap',
          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
        }}
      >
        {logs.map((entry) => (
          <div key={entry.id} className="leading-relaxed hover:bg-[#081808]/50 py-0.5">
            <span className="text-gray-500">[{entry.timestamp}] </span>
            <span
              className={
                entry.message.includes('BOOLEAN')
                  ? 'text-[#00ffaa] font-bold'
                  : entry.message.includes('PARTNER') || entry.message.includes('Google')
                  ? 'text-[#88ccff] font-bold'
                  : entry.message.includes('DAYLIGHT')
                  ? 'text-[#ffaa00]'
                  : entry.message.includes('NIGHT')
                  ? 'text-[#8844aa]'
                  : 'text-[#00ff00]'
              }
            >
              {entry.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
