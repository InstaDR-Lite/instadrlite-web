'use client';

import { useEffect, useState } from 'react';

import AuditPanel, { MOCK_LOGS, CptCode } from './AuditPanel';


// ─── MAIN DRAWER ────────────────────────────────────────────────────────────

export default function CallLogDrawer({ onClose }: { onClose: () => void }) {
  const [search, setSearch] = useState('');
  // const [selectedLog, setSelectedLog] = useState<typeof MOCK_LOGS[0] | null>(null);

  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedLog, setSelectedLog] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<any>(null);

    // In UpNext — map summary to AuditPanel log shape
  function mapToAuditLog(summary: any, cptCodes: CptCode[]) {
    const durationSecs = summary.session_duration_secs ?? 0;
    const mins = Math.floor(durationSecs / 60);
    const secs = durationSecs % 60;

    return {
      id: `CR-${summary.id.slice(0, 8).toUpperCase()}`,
      date: new Date(summary.session_ended_at).toLocaleDateString('en-US', {
        month: '2-digit', day: '2-digit', year: '2-digit'
      }),
      roomId: summary.room?.room_reference_id ?? '',
      patientName: summary.patient_name,
      duration: `${mins}m ${String(secs).padStart(2, '0')}s`,
      geoState: summary.geo_verified ? 'CA' : 'N/A',
      geoOk: summary.geo_verified,
      consent: summary.consent_signed,
      payAmount: Number(summary.payment_amount ?? 0),
      payStatus: summary.payment_status ?? 'unpaid',
      payType: summary.payment_type ?? 'self_pay',
      stream: 'LOCKED',
      cptCodes, // pass through for CPT section
    };
  }

  function mapAppointmentToLog(a: any) {
    console.log('[mapAppointmentToLog] a', a)
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
  async function handleViewLog(appointmentId: string) {
    const summaryRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/appointments/${appointmentId}/summary`,
      { credentials: 'include' }
    );
      const { appointment: summary, cptCodes } = await summaryRes.json();
    const log = mapToAuditLog(summary, cptCodes);
    setSummaryData(log);
    setSelectedLog(appointmentId);
  }

  useEffect(() => {
    const fetchCallLog = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/appointments/call-log`,
          { credentials: 'include' }
        );
        const { appointments } = await res.json();
        setFiltered(appointments.map(mapAppointmentToLog));
      } catch (err) {
        console.error('[CallLog]', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCallLog();
  }, []);


  

  // const filtered = MOCK_LOGS.filter(log =>
  //   log.patientName.toLowerCase().includes(search.toLowerCase()) ||
  //   log.roomId.includes(search) ||
  //   log.id.toLowerCase().includes(search.toLowerCase())
  // );

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <span className="font-mono text-[11px] tracking-widest text-[#7A9A7A] uppercase">
        loading records...
      </span>
    </div>
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
                        onClick={() => handleViewLog(log.appointmentId)}
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
      {selectedLog && summaryData && (
        <AuditPanel
          log={summaryData}
          onClose={() => {
            setSelectedLog(null);
            setSummaryData(null);
          }}
        />
      )}
    </>
  );
}