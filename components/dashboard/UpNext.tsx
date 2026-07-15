'use client';


import { Appointment } from '@/app/dashboard/page';
import { useVideoSession } from '@/hooks/useVideoSession';
import SessionView from '../session/SessionView';
import AuditPanel from '../callLogDrawer/AuditPanel';
import { Provider, useRef, useState } from 'react';

interface Props {
  appointment: Appointment | null;
  isMobile?:   boolean;
}


export default function UpNext({ appointment, isMobile = false }: Props) {

  const {
    session,
    localStream,
    remoteStream,
    localVideoRef,
    remoteVideoRef,
    startSession,
    handleAdmitClick,
    endSession,
    onSessionEnded,
    toggleMute,
    toggleVideo,
    expandFullscreen,
    collapseFullscreen,
  } = useVideoSession();
  
  // once a session is complete
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const [patientAdmitted, setPatientAdmitted] = useState(false)

  const [postSessionData, setPostSessionData] = useState<any>();

  // UpNext
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  function startTimer() {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setElapsedSecs(prev => prev + 1);
    }, 1000);
  }

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      setElapsedSecs(0);
    }
  }
  
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
    
  // State 3 — fullscreen overlay
  if (session.view === 'fullscreen') {
    return (
      <SessionView
        appointment={appointment!}
        session={session}
        localStream={localStream}
        remoteStream={remoteStream}
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
        handleAdmit={handleAdmitClick}
        onEnd={endSession}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        onCollapse={collapseFullscreen}
        patientAdmitted={patientAdmitted}
        onPatientAdmitted={setPatientAdmitted}
        onStartTimer={startTimer}
        elapsedSeconds={elapsedSecs}
      />
    );
  }

  // State 1 — idle, no appointment selected
  if (!appointment) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[11px] text-[#7A9A7A] tracking-widest uppercase">
          awaiting next session to be selected...
        </p>
      </div>
    );
  }

  const time = appointment.startsAt.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true
  });


  const canStart = appointment.status === 'ready' || appointment.status === 'in_session';

  return (
    <div className="flex-1 flex flex-col">

      {/* Appointment Details */}
      <div className="p-6 border-b border-[rgba(0,80,40,0.12)]">
        <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase mb-1">
          upcoming session
        </div>
        <div className="text-xl font-semibold text-[#1A2E1A] tracking-wide mb-1">
          {appointment.patientName}
        </div>
        <div className="text-[11px] text-[#7A9A7A] tracking-widest mb-4">
          [{time}] · {appointment.startsAt.toLocaleDateString('en-US', {
            month: 'short', day: 'numeric'
          })}
        </div>

        {/* Status rows */}
        <div className="flex flex-col gap-2 mb-5">
          <div className="flex items-center gap-2 text-[11px] tracking-wide">
            <span className={`w-1.5 h-1.5 rounded-full ${
              appointment.geoVerified ? 'bg-[#007A40]' : 'bg-[#8B6914]'
            }`} />
            <span className="text-[#7A9A7A]">Geo-verify:</span>
            <span className={appointment.geoVerified ? 'text-[#007A40]' : 'text-[#8B6914]'}>
              {appointment.geoVerified ? 'California (GPS Match)' : 'Pending Browser GPS'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] tracking-wide">
            <span className={`w-1.5 h-1.5 rounded-full ${
              appointment.paymentStatus === 'paid' ? 'bg-[#007A40]' : 'bg-[#8B6914]'
            }`} />
            <span className="text-[#7A9A7A]">Copay:</span>
            <span className={
              appointment.paymentStatus === 'paid' ? 'text-[#007A40]' : 'text-[#8B6914]'
            }>
              {appointment.paymentStatus === 'paid'
                ? 'Paid ($35.00 via Stripe)'
                : appointment.paymentStatus === 'authenticating'
                ? 'Authenticating Card...'
                : 'Unpaid'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] tracking-wide">
            <span className={`w-1.5 h-1.5 rounded-full ${
              appointment.status === 'ready' ? 'bg-[#007A40]' : 'bg-[#7A9A7A]'
            }`} />
            <span className="text-[#7A9A7A]">Status:</span>
            <span className={
              appointment.status === 'ready' ? 'text-[#007A40]' : 'text-[#7A9A7A]'
            }>
              {appointment.status === 'completed' ? 'COMPLETED'
              : appointment.status === 'ready' ? 'READY TO CONNECT'
              : appointment.status === 'checking_in' ? 'CHECKING IN...'
              : appointment.status === 'in_session' ? 'IN SESSION'
              : 'SCHEDULED'}
            </span>
            {/* Copy invite link */}
          </div>
      
          <div>
            <button
              onClick={() => navigator.clipboard.writeText(
                `${process.env.NEXT_PUBLIC_WEB_URL}/room/${appointment.roomId}`
              )}
              className="py-2 px-4 border border-[rgba(0,80,40,0.18)] text-[10px] tracking-widest uppercase text-[#7A9A7A] hover:border-[#007A40] hover:text-[#007A40] transition-all mb-3"
            >
              copy invite link
            </button>
          </div>
        </div>


        {/* START SESSION + Expand */}
        {/* Only show button when idle or ready
        // button visible    idle → requesting → connecting
        // button hidden     local_only → active → ending → ended
        // end session       lives in fullscreen SessionView only */}
        {(session.status === 'idle' ||
          session.status === 'requesting_token' ||
          session.status === 'connecting') && (
          <div className="flex gap-2 mt-5">
            <button
              onClick={() => startSession(appointment.roomId, isMobile)}
              disabled={!canStart || session.status !== 'idle'}
              className={`flex-1 py-3 text-xs tracking-widest uppercase transition-all ${
                canStart && session.status === 'idle'
                  ? 'border border-[#007A40] text-[#007A40] hover:bg-[#007A40] hover:text-[#edf1f7]'
                  : 'border border-[rgba(0,80,40,0.18)] text-[#7A9A7A] cursor-not-allowed'
              }`}
            >
              {session.status === 'requesting_token' ? '// requesting token...'
                : session.status === 'connecting' ? '// connecting...'
                : appointment.status === 'completed' ? '// session completed'
                : canStart ? '[ START SESSION ]'
                : '// patient not ready'}
            </button>
          </div>
        )}
      </div>

      {/* collapse was clicked */}
      {session.status === 'active' && (
        <div className="flex gap-2 m-5">
          <button
            onClick={expandFullscreen}
            className='flex-1 py-3 text-xs tracking-widest uppercase transition-all border border-[#007A40] text-[#007A40] hover:bg-[#007A40] hover:text-[#edf1f7]'
          >
            [REJOIN SESSION]
          </button>
          <button
              onClick={expandFullscreen}
              className="border border-[rgba(0,80,40,0.18)] px-3 text-[10px] tracking-widest uppercase text-[#7A9A7A] hover:border-[#007A40] hover:text-[#007A40] transition-all"
            >
              ↗
          </button>
        </div>
      )}

      {/* End Session Confirmation Modal */}
      {session.status === 'ending' &&  (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#1A2E1A]/40 animate-fadeIn">
          <div className="bg-[#F5F0E8] border border-[rgba(0,80,40,0.18)] p-6 w-[300px] animate-slideUp">
            <div className="font-mono text-[10px] tracking-widest text-[#7A9A7A] uppercase mb-2">
              // end session
            </div>
            <p className="font-mono text-[13px] text-[#1A2E1A] mb-6">
              Mark this session as complete?
            </p>
            <p className="font-mono text-[11px] text-[#7A9A7A] mb-6">
              This will finalize the session record and generate your call log entry.
            </p>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  onSessionEnded();
                  
                  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/${appointment.id}/session-end`, {
                    method: 'POST',
                    credentials: 'include',
                  });

                  // stops the session timer
                  stopTimer();
                  
                  // After session-end POST succeeds
                  const summaryRes = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/appointments/${appointment.id}/summary`,
                    { credentials: 'include' }
                  );
                  const { appointment: summary, cptCodes } = await summaryRes.json();
                  console.log('[UpNext] Session summary', summary);
                  const log = mapToAuditLog(summary, cptCodes);

                  setPostSessionData(log);
                  setTimeout(() => setShowSessionSummary(true), 500);

                }}
                className="flex-1 py-2.5 border border-[#CC2200] text-[10px] tracking-widest uppercase text-[#CC2200] hover:bg-[#CC2200] hover:text-white transition-all font-mono"
              >
                Yes, complete
              </button>
              <button
                onClick={() => startSession(appointment.roomId, isMobile)}
                className="flex-1 py-2.5 border border-[rgba(0,80,40,0.18)] text-[10px] tracking-widest uppercase text-[#7A9A7A] hover:border-[#007A40] hover:text-[#007A40] transition-all font-mono"
              >
                Reconnect
              </button>
            </div>
          </div>
        </div>
      )}


      {session.status === 'ended' && showSessionSummary && (
        <AuditPanel
          log={postSessionData}
          onClose={() => setShowSessionSummary(false)}
        // showOptOut={true}
        />
      )}
      
    </div>
  );
}