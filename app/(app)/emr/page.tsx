'use client';

import { useState, useEffect } from 'react';
import AuditPanel from '@/components/callLogDrawer/AuditPanel';

const PAGE_SIZE = 10;

function mapAppointmentToLog(a: any) {
  const secs = a.session_duration_secs ?? 0;
  const mins = Math.floor(secs / 60);
  const s = secs % 60;

  return {
    appointmentId: a.id,
    id: `CR-${a.id.slice(0, 8).toUpperCase()}`,
    date: new Date(a.session_ended_at).toLocaleDateString('en-US', {
      month: '2-digit', day: '2-digit', year: '2-digit'
    }),
    roomId: a.room?.room_reference_id ?? '',
    patientName: a.patient_name,
    duration: `${mins}m ${String(s).padStart(2, '0')}s`,
    geoOk: a.geo_verified,
    geoState: 'CA',
    consent: a.consent_signed,
    payAmount: Number(a.payment_amount ?? 0),
    payStatus: a.payment_status ?? 'unpaid',
    payType: a.payment_type ?? 'self_pay',
    stream: 'LOCKED',
  };
}

export default function EMRLitePage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [summaryData, setSummaryData] = useState<any>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/appointments/call-log?page=${page}&limit=${PAGE_SIZE}`,
          { credentials: 'include' }
        );
        const { appointments, total } = await res.json();
        setLogs(appointments.map(mapAppointmentToLog));
        setTotal(total);
      } catch (err) {
        console.error('[EMRLite]', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [page]);

  const filtered = logs.filter(log =>
    log.patientName.toLowerCase().includes(search.toLowerCase()) ||
    log.roomId.includes(search) ||
    log.id.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(total / PAGE_SIZE);

  async function handleViewLog(appointmentId: string) {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/appointments/${appointmentId}/summary`,
      { credentials: 'include' }
    );
    const data = await res.json();
    setSummaryData(mapAppointmentToLog(data.appointment));
    setSelectedLog(appointmentId);
  }

  return (
    <div className="h-full flex flex-col bg-[#edf1f7] font-mono">

      {/* Header */}
      <div className="px-8 pt-8 pb-4">
        <div className="text-[10px] tracking-widest text-[#7A9A7A] uppercase mb-1">
          // EMRLite
        </div>
        <h1 className="text-2xl font-semibold text-[#1A2E1A] tracking-tight">
          Call Log — Write-Once Records
        </h1>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 px-8 pb-4">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="// Search patient name, room ID..."
          className="flex-1 max-w-[360px] bg-[#EDE8DC] border border-[rgba(0,80,40,0.18)]
                     px-3 py-2 text-[12px] text-[#1A2E1A] placeholder-[#7A9A7A]
                     focus:outline-none focus:border-[#007A40] transition-all"
        />
        <span className="text-[10px] text-[#7A9A7A] tracking-widest ml-auto">
          {total} encounters
        </span>
        <button className="border border-[rgba(0,80,40,0.18)] px-3 py-2 text-[10px]
                           tracking-widest uppercase text-[#7A9A7A]
                           hover:border-[#007A40] hover:text-[#007A40] transition-all">
          Download
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-8">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[rgba(0,80,40,0.18)]">
              {['CALL ID', 'DATE', 'PATIENT', 'DURATION', 'GEO', 'COMPLIANCE', 'PAYMENT', ''].map((h, i) => (
                <th key={i} className="px-3 py-2 text-left text-[10px] tracking-widest
                                       text-[#7A9A7A] uppercase font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-[11px]
                                           text-[#7A9A7A] tracking-widest">
                  // loading records...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-[11px]
                                           text-[#7A9A7A] tracking-widest">
                  // no records found
                </td>
              </tr>
            ) : filtered.map(log => (
              <tr key={log.id}
                  className="border-b border-[rgba(0,80,40,0.08)]
                             hover:bg-[rgba(0,122,64,0.04)] transition-all">
                <td className="px-3 py-3 text-[11px] text-[#007A40]">{log.id}</td>
                <td className="px-3 py-3 text-[11px] text-[#7A9A7A]">{log.date}</td>
                <td className="px-3 py-3 text-[12px] text-[#1A2E1A]">{log.patientName}</td>
                <td className="px-3 py-3 text-[11px] text-[#1A2E1A]">{log.duration}</td>
                <td className="px-3 py-3 text-[11px]">
                  <span className={log.geoOk ? 'text-[#007A40]' : 'text-[#CC2200]'}>
                    {log.geoState} {log.geoOk ? '[✓]' : '[✕]'}
                  </span>
                </td>
                <td className="px-3 py-3 text-[11px]">
                  <span className={log.consent ? 'text-[#007A40]' : 'text-[#CC2200]'}>
                    {log.consent ? '[✓]' : '[✕]'}
                  </span>
                </td>
                <td className="px-3 py-3 text-[11px] text-[#007A40]">
                  ${log.payAmount.toFixed(2)} {log.payStatus === 'paid' ? '[✓]' : '[⏳]'}
                </td>
                <td className="px-3 py-3">
                  <button
                    onClick={() => handleViewLog(log.appointmentId)}
                    className="text-[10px] tracking-widest uppercase
                               border border-[rgba(0,122,64,0.3)] px-3 py-1
                               text-[#007A40] hover:bg-[rgba(0,122,64,0.08)] transition-all"
                  >
                    ▶ View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-8 py-4
                        border-t border-[rgba(0,80,40,0.12)]">
          <span className="text-[10px] text-[#7A9A7A] tracking-widest">
            // page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-[10px] tracking-widest uppercase
                         border border-[rgba(0,80,40,0.18)] text-[#7A9A7A]
                         hover:border-[#007A40] hover:text-[#007A40]
                         disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-[10px] tracking-widest uppercase
                         border border-[rgba(0,80,40,0.18)] text-[#7A9A7A]
                         hover:border-[#007A40] hover:text-[#007A40]
                         disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Audit Panel */}
      {selectedLog && summaryData && (
        <AuditPanel
          log={summaryData}
          onClose={() => { setSelectedLog(null); setSummaryData(null); }}
        />
      )}
    </div>
  );
}