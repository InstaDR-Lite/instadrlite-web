'use client';


import { Appointment } from '@/app/dashboard/page';
import { VideoSession } from '@/hooks/useVideoSession';
import { RefObject, useEffect, useState } from 'react';
import { RemoteVideo } from './RemoteVideo';
import { WebRTCSafetyBoundary } from '../WebRTCSafetyBoundary';

interface Props {
  appointment:    Appointment;
  session: VideoSession;
  localStream:    MediaStream | null;   // ← add
  remoteStream:   MediaStream | null;   // ← add
  localVideoRef:  RefObject<HTMLVideoElement | null>;  // ← add | null
  remoteVideoRef: RefObject<HTMLVideoElement | null>;  // ← add | null
  handleAdmit: () => void;
  onEnd:          () => void;
  onToggleMute:   () => void;
  onToggleVideo:  () => void;
  onCollapse:     () => void;
}

export default function SessionView({
  appointment,
  session,
  localStream,
  remoteStream,
  localVideoRef,
  remoteVideoRef,
  handleAdmit,
  onEnd,
  onToggleMute,
  onToggleVideo,
  onCollapse
}: Props) {

  const [patientAdmitted, setPatientAdmitted] = useState<boolean>(false);
  const [showLobbyUI, setShowLobbyUI] = useState(false);
  const [isAdmitting, setIsAdmitting] = useState(false);


  // Re-attach streams whenever SessionView mounts
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, localVideoRef]);  // fires on mount AND when stream changes

  useEffect(() => {
    // Give it a brief delay (e.g., 800ms) to let the main interface settle
    // before the absolute "Patient in the Lobby" overlay transitions in.
    const timer = setTimeout(() => {
      setShowLobbyUI(true);
    }, 800);

    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, remoteVideoRef]);
  
  return (
    <div className="fixed inset-0 z-[100] bg-[#0C100C] flex flex-col">

      {/* Top bar */}
      <div className="h-[44px] flex-shrink-0 flex items-center justify-between px-6 border-b border-[rgba(0,255,140,0.12)]">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00FF8C] animate-pulse" />
          <span className="text-xs tracking-widest text-[#E8F5E8] uppercase">
            {appointment.patientName}
          </span>
        </div>
        <button
          onClick={onCollapse}
          className="text-[10px] tracking-widest text-[#3D5C3D] hover:text-[#7A9A7A] uppercase"
        >
          ↙ collapse
        </button>
      </div>

      {/* video stuff wrapped in our silent guard */}
      <WebRTCSafetyBoundary>
        <RemoteVideo stream={remoteStream} status={session.status} />
      </WebRTCSafetyBoundary>

      {/* Local PiP — top right, guarded independently */}
      <WebRTCSafetyBoundary
        fallbackFallback={
          <div className="absolute top-[64px] right-4 w-[180px] h-[120px] border border-red-500/30 bg-[#0C100C] flex items-center justify-center">
            <span className="text-[10px] text-zinc-500">Cam Error</span>
          </div>
        }
      >
        <div
          className="absolute top-[64px] right-4 w-[180px] h-[120px] border border-[rgba(221,234,229,0.22)] bg-[#0C100C] overflow-hidden"
          style={{ transform: 'scaleX(-1)' }}
        >
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        </div>
      </WebRTCSafetyBoundary>

      {/* 4. The Admission Modal Popup */}
      {(showLobbyUI && !patientAdmitted) &&  (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl mx-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3 text-emerald-400 mb-4">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <h3 className="text-lg font-semibold text-slate-100">Patient in the Lobby</h3>
            </div>
            
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              A verified client is waiting securely in the virtual gate. Would you like to admit them to initiate the encrypted session?
            </p>

            <div className="flex space-x-3 justify-end">
              <button 
                onClick={() => {
                  setIsAdmitting(true);
                  handleAdmit();
                  setPatientAdmitted(true);
                  setIsAdmitting(false);
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-medium text-sm rounded-lg transition-colors shadow-lg shadow-emerald-900/20"
              >
                {isAdmitting ? 'Admitting...' : 'Admit Patient'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="h-[64px] flex-shrink-0 flex items-center justify-center gap-4 border-t border-[rgba(0,255,140,0.12)]">
        <button
          onClick={onToggleMute}
          className={`px-4 h-[32px] border text-[10px] tracking-widest uppercase transition-all ${
            session.localMuted
              ? 'border-[#CC2200] text-[#CC2200]'
              : 'border-[rgba(0,255,140,0.22)] text-[#7A9A7A] hover:border-[#00FF8C] hover:text-[#00FF8C]'
          }`}
        >
          {session.localMuted ? 'unmute' : 'mute'}
        </button>
        <button
          onClick={onToggleVideo}
          className={`px-4 h-[32px] border text-[10px] tracking-widest uppercase transition-all ${
            session.videoOff
              ? 'border-[#CC2200] text-[#CC2200]'
              : 'border-[rgba(0,255,140,0.22)] text-[#7A9A7A] hover:border-[#00FF8C] hover:text-[#00FF8C]'
          }`}
        >
          {session.videoOff ? 'cam on' : 'cam off'}
        </button>
        <button
          onClick={onEnd}
          className="px-6 h-[32px] border border-[#CC2200] text-[10px] tracking-widest uppercase text-[#CC2200] hover:bg-[#CC2200] hover:text-[#edf1f7] transition-all"
        >
          ✕ end session
        </button>
      </div>
    </div>
  );
}