
// ─── AUDIT LOG PANEL ────────────────────────────────────────────────────────
export const MOCK_LOGS = [
  {
    id: 'CR-00412',
    date: '07/10/26',
    roomId: '_cf0075a4',
    patientName: 'Todd Siegel',
    duration: '45m 02s',
    geoState: 'CA',
    geoOk: true,
    consent: true,
    payAmount: 150.00,
    payStatus: 'paid',
    payType: 'self_pay',
    stream: 'LOCKED',
  },
  {
    id: 'CR-00411',
    date: '07/08/26',
    roomId: '_ae8219d2',
    patientName: 'M. Chen',
    duration: '28m 14s',
    geoState: 'CA',
    geoOk: true,
    consent: true,
    payAmount: 150.00,
    payStatus: 'paid',
    payType: 'insurance',
    stream: 'LOCKED',
  },
  {
    id: 'CR-00410',
    date: '07/05/26',
    roomId: '_bc9310fa',
    patientName: 'R. Okafor',
    duration: '42m 50s',
    geoState: 'NY',
    geoOk: false,
    consent: true,
    payAmount: 200.00,
    payStatus: 'paid',
    payType: 'insurance',
    stream: 'LOCKED',
  },
  {
    id: 'CR-00409',
    date: '07/04/26',
    roomId: '_88d21c8b',
    patientName: 'A. Singh',
    duration: '22m 11s',
    geoState: 'CA',
    geoOk: true,
    consent: true,
    payAmount: 150.00,
    payStatus: 'paid',
    payType: 'self_pay',
    stream: 'LOCKED',
  },
  {
    id: 'CR-00408',
    date: '07/02/26',
    roomId: '_71f0ea3a',
    patientName: 'J. Williams',
    duration: '31m 45s',
    geoState: 'CA',
    geoOk: true,
    consent: false,
    payAmount: 150.00,
    payStatus: 'paid',
    payType: 'self_pay',
    stream: 'LOCKED',
  },
];

export default function AuditPanel({ log=MOCK_LOGS[0], onClose }: { log?: typeof MOCK_LOGS[0]; onClose: () => void }) {
  const durationMins = parseInt(log.duration);
  
  // CPT suggestion based on duration
  const cptCode = durationMins >= 53 ? { code: '90837', desc: 'Psychotherapy, 60 min' }
    : durationMins >= 38 ? { code: '90834', desc: 'Psychotherapy, 45 min' }
    : durationMins >= 16 ? { code: '90832', desc: 'Psychotherapy, 30 min' }
    : null;

  const summaryText = [
    `SESSION AUDIT LOG // ROOM_${log.roomId.toUpperCase()}`,
    `Date: ${log.date}`,
    `Duration: ${log.duration}`,
    `Patient: ${log.patientName}`,
    `Geo-Verify: ${log.geoState} ${log.geoOk ? '[✓ VERIFIED]' : '[✕ ERROR]'}`,
    `Consent: ${log.consent ? '[✓ SIGNED]' : '[✕ MISSING]'}`,
    `Payment: $${log.payAmount.toFixed(2)} ${log.payStatus === 'paid' ? '[✓ SETTLED]' : '[PENDING]'}`,
    cptCode && log.payType === 'insurance' ? `CPT: ${cptCode.code} — ${cptCode.desc}` : null,
  ].filter(Boolean).join('\n');

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center">
      <div className="absolute inset-0 bg-[#1A2E1A] opacity-30 animate-fadeIn" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[900px] bg-[#F5F0E8] border border-[rgba(0,80,40,0.18)] border-b-0 animate-slideUp max-h-[80vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-[rgba(0,80,40,0.18)] sticky top-0 bg-[#F5F0E8]">
          <span className="font-mono text-[10px] tracking-widest text-[#7A9A7A] uppercase">
            Session Audit Log // {log.id}
          </span>
          <button onClick={onClose} className="text-[#7A9A7A] hover:text-[#1A2E1A] transition-all text-sm">✕</button>
        </div>

        <div className="p-6 font-mono text-[12px] leading-[1.8]">
          
          {/* Divider */}
          <div className="text-[#7A9A7A] text-[11px]">{'='.repeat(72)}</div>
          <div className="text-[#007A40] font-semibold">SESSION AUDIT LOG // ROOM_{log.roomId.toUpperCase()}</div>
          <div className="text-[#7A9A7A] text-[11px]">{'='.repeat(72)}</div>

          {/* General Metadata */}
          <div className="mt-4">
            <div className="text-[#007A40]">[ GENERAL METADATA ]</div>
            <div className="text-[#7A9A7A] text-[11px]">{'-'.repeat(72)}</div>
            <div className="flex gap-3"><span className="text-[#7A9A7A] w-[160px]">Date/Time</span><span className="text-[#1A2E1A]">{log.date}</span></div>
            <div className="flex gap-3"><span className="text-[#7A9A7A] w-[160px]">Session Duration</span><span className="text-[#1A2E1A]">{log.duration}</span></div>
            <div className="flex gap-3"><span className="text-[#7A9A7A] w-[160px]">Patient</span><span className="text-[#1A2E1A]">{log.patientName}</span></div>
          </div>

          {/* Compliance */}
          <div className="mt-4">
            <div className="text-[#007A40]">[ COMPLIANCE & JURISDICTION DATA ]</div>
            <div className="text-[#7A9A7A] text-[11px]">{'-'.repeat(72)}</div>
            <div className="flex gap-3"><span className="text-[#7A9A7A] w-[160px]">GPS Geo-Verify</span><span className="text-[#1A2E1A]">{log.geoState}</span></div>
            <div className={log.geoOk ? 'text-[#007A40]' : 'text-[#CC2200]'}>
              {'  '}↳ Status: {log.geoOk ? 'VERIFIED [Inside Clinician Licensed State]' : 'ERROR [Outside Licensed State]'}
            </div>
          </div>

          {/* Patient Attestation */}
          <div className="mt-4">
            <div className="text-[#007A40]">[ PATIENT ATTESTATION ]</div>
            <div className="text-[#7A9A7A] text-[11px]">{'-'.repeat(72)}</div>
            <div className={log.consent ? 'text-[#007A40]' : 'text-[#CC2200]'}>
              {log.consent ? '[✓]' : '[✕]'} Direct Telehealth Delivery Agreement {log.consent ? 'Signed' : 'Missing'}
            </div>
            {log.consent && (
              <div className="text-[#007A40]">[✓] Patient Confirmed Secure, Confidential Physical Space</div>
            )}
          </div>

          {/* Financial */}
          <div className="mt-4">
            <div className="text-[#007A40]">[ FINANCIAL VELOCITY CAPTURE ]</div>
            <div className="text-[#7A9A7A] text-[11px]">{'-'.repeat(72)}</div>
            <div className="flex gap-3"><span className="text-[#7A9A7A] w-[160px]">Merchant Line</span><span className="text-[#1A2E1A]">Stripe Connect Direct Account</span></div>
            <div className="flex gap-3"><span className="text-[#7A9A7A] w-[160px]">Base Session Fee</span><span className="text-[#1A2E1A]">${log.payAmount.toFixed(2)}</span></div>
            <div className="flex gap-3"><span className="text-[#7A9A7A] w-[160px]">Platform Cut</span><span className="text-[#1A2E1A]">$0.00 (100% Provider Retained)</span></div>
            <div className={log.payStatus === 'paid' ? 'text-[#007A40]' : 'text-[#CC2200]'}>
              {log.payStatus === 'paid' ? '[✓ SETTLED & DISBURSED]' : '[⏳ PENDING]'}
            </div>
          </div>

          {/* CPT Codes — insurance only */}
          {log.payType === 'insurance' && cptCode && (
            <div className="mt-4">
              <div className="text-[#007A40]">[ CPT PROCEDURE CODES ]</div>
              <div className="text-[#7A9A7A] text-[11px]">{'-'.repeat(72)}</div>
              <div className="mt-2 border border-[rgba(0,80,40,0.18)] p-3 flex items-center justify-between">
                <span className="text-[#007A40] font-semibold">{cptCode.code}</span>
                <span className="text-[#3D5C3D] flex-1 mx-4">{cptCode.desc}</span>
                <span className="text-[#1A2E1A]">${log.payAmount.toFixed(2)}</span>
              </div>
              <div className="text-[#7A9A7A] text-[10px] mt-1">⚡ Suggested — verify before insurance submission</div>
            </div>
          )}

          <div className="text-[#7A9A7A] text-[11px] mt-4">{'-'.repeat(72)}</div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={() => navigator.clipboard.writeText(summaryText)}
            className="flex items-center gap-2 px-4 py-2 border border-[rgba(0,80,40,0.18)] text-[10px] tracking-widest uppercase text-[#7A9A7A] hover:border-[#007A40] hover:text-[#007A40] transition-all font-mono"
          >
            Copy compliance summary for EHR charting
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-[rgba(0,80,40,0.18)] text-[10px] tracking-widest uppercase text-[#7A9A7A] hover:border-[#007A40] hover:text-[#007A40] transition-all font-mono">
            Export record
          </button>
        </div>
      </div>
    </div>
  );
}