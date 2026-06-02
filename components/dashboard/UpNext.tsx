'use client';

import { Appointment } from '@/lib/mockData';
import { useVideoSession } from '@/hooks/useVideoSession';
import SessionView from '../session/SessionView';

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
    endSession,
    toggleMute,
    toggleVideo,
    expandFullscreen,
    collapseFullscreen,
  } = useVideoSession();
    
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
        onEnd={endSession}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        onCollapse={collapseFullscreen}
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

  const canStart = appointment.status === 'ready';

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
              {appointment.status === 'ready'
                ? 'READY TO CONNECT'
                : appointment.status === 'checking_in'
                ? 'CHECKING IN...'
                : 'SCHEDULED'}
            </span>
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
                  ? 'border border-[#007A40] text-[#007A40] hover:bg-[#007A40] hover:text-[#F5F0E8]'
                  : 'border border-[rgba(0,80,40,0.18)] text-[#7A9A7A] cursor-not-allowed'
              }`}
            >
              {session.status === 'requesting_token' ? '// requesting token...'
                : session.status === 'connecting' ? '// connecting...'
                : canStart ? '[ START SESSION ]'
                : '// patient not ready'}
            </button>

            <button
              onClick={expandFullscreen}
              className="border border-[rgba(0,80,40,0.18)] px-3 text-[10px] tracking-widest uppercase text-[#7A9A7A] hover:border-[#007A40] hover:text-[#007A40] transition-all"
            >
              ↗
            </button>
          </div>
        )}
      </div>

      {/* State 2 — video preview when connecting/active */}
      {/* Compact video preview — desktop only */}
      {!isMobile && (session.status === 'connecting' ||
        session.status === 'local_only' ||
        session.status === 'active') && (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 bg-[#1A2E1A] relative flex items-center justify-center m-4">
            <span className="text-[10px] text-[#3D5C3D] tracking-widest uppercase">
                initializing video pipeline...
            </span>
            {/* Expand button */}
            <button
              onClick={expandFullscreen}
              className="absolute top-2 right-2 border border-[rgba(0,255,140,0.22)] px-2 py-1 text-[9px] tracking-widest text-[#7A9A7A] hover:text-[#007A40] transition-all"
            >
              ↗ expand
            </button>
          </div>
        </div>
      )}
    </div>
  );
}