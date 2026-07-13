'use client';

import { useState } from 'react';

import AuditPanel, { MOCK_LOGS } from './AuditPanel';

// ─── MAIN DRAWER ────────────────────────────────────────────────────────────

export default function CallLogDrawer({ onClose }: { onClose: () => void }) {
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<typeof MOCK_LOGS[0] | null>(null);

  const filtered = MOCK_LOGS.filter(log =>
    log.patientName.toLowerCase().includes(search.toLowerCase()) ||
    log.roomId.includes(search) ||
    log.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="fixed inset-0 z-[150] flex items-end">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-[#1A2E1A] opacity-30 animate-fadeIn" onClick={onClose} />

        {/* Drawer */}
        <div className="relative z-10 w-full bg-[#F5F0E8] border border-[rgba(0,80,40,0.18)] border-b-0 animate-slideUp" style={{ maxHeight: '60vh' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-[rgba(0,80,40,0.18)]">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] tracking-widest text-[#7A9A7A] uppercase">
                Call Log — Write-Once Records
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-mono text-[10px] text-[#7A9A7A]">Showing 1–{filtered.length} of {MOCK_LOGS.length} encounters</span>
              <button
                onClick={onClose}
                className="text-[#7A9A7A] hover:text-[#1A2E1A] transition-all text-sm"
              >✕</button>
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center gap-3 px-6 py-3 border-b border-[rgba(0,80,40,0.12)]">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="// Search patient name, room ID..."
              className="flex-1 bg-transparent font-mono text-[12px] text-[#1A2E1A] placeholder-[#7A9A7A] outline-none border border-[rgba(0,80,40,0.18)] px-3 py-2"
            />
            <button className="font-mono text-[10px] tracking-widest uppercase text-[#7A9A7A] border border-[rgba(0,80,40,0.18)] px-3 py-2 hover:border-[#007A40] hover:text-[#007A40] transition-all">
              Filter: All Dates
            </button>
            <button className="font-mono text-[10px] tracking-widest uppercase text-[#007A40] border border-[#007A40] px-3 py-2 hover:bg-[rgba(0,122,64,0.08)] transition-all">
              Download
            </button>
          </div>

          {/* Table */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(60vh - 100px)' }}>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[rgba(0,80,40,0.18)]">
                  {['CALL ID', 'DATE', 'PATIENT', 'DURATION', 'GEO-VERIFY', 'COMPLIANCE', 'PAYMENT', ''].map((h, i) => (
                    <th key={i} className="px-4 py-2 text-left font-mono text-[10px] tracking-widest text-[#7A9A7A] uppercase font-normal">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(log => (
                  <tr
                    key={log.id}
                    className="border-b border-[rgba(0,80,40,0.08)] hover:bg-[rgba(0,122,64,0.04)] transition-all"
                  >
                    <td className="px-4 py-3 font-mono text-[11px] text-[#007A40]">{log.id}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[#7A9A7A]">{log.date}</td>
                    <td className="px-4 py-3 font-mono text-[12px] text-[#1A2E1A]">{log.patientName}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[#1A2E1A]">{log.duration}</td>
                    <td className="px-4 py-3 font-mono text-[11px]">
                      <span className={log.geoOk ? 'text-[#007A40]' : 'text-[#CC2200]'}>
                        {log.geoState} {log.geoOk ? '[✓ OK]' : '[✕ ERR]'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px]">
                      <span className={log.consent ? 'text-[#007A40]' : 'text-[#CC2200]'}>
                        CONSENT {log.consent ? '[✓]' : '[✕]'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px]">
                      <span className="text-[#007A40]">
                        ${log.payAmount.toFixed(2)} {log.payStatus === 'paid' ? '[✓ PAID]' : '[PENDING]'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="font-mono text-[10px] tracking-widest text-[#007A40] border border-[rgba(0,122,64,0.3)] px-3 py-1 hover:bg-[rgba(0,122,64,0.08)] transition-all uppercase"
                      >
                        ▶ View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Audit Log Panel */}
      {selectedLog && (
        <AuditPanel
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </>
  );
}