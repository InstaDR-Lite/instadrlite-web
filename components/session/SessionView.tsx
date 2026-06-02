'use client';

import { Appointment } from '@/lib/mockData';
import { VideoSession } from '@/hooks/useVideoSession';

interface Props {
  appointment:    Appointment;
  session:        VideoSession;
  onEnd:          () => void;
  onToggleMute:   () => void;
  onToggleVideo:  () => void;
  onCollapse:     () => void;
}

export default function SessionView({
  appointment, session, onEnd, onToggleMute, onToggleVideo, onCollapse
}: Props) {
  return (
    <div className="fixed inset-0 z-[100] bg-[#0C100C] flex flex-col">

      {/* Top bar */}
      <div className="h-[44px] flex items-center justify-between px-6 border-b border-[rgba(0,255,140,0.12)]">
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

      {/* Video area */}
      <div className="flex-1 relative bg-[#080B08] flex items-center justify-center">
        <span className="text-[11px] text-[#3D5C3D] tracking-widest uppercase">
          Remote pipeline
        </span>

        {/* Local PiP */}
       {/* Local PiP */}
        <div className="absolute top-4 right-4 w-[180px] h-[120px] border border-[rgba(0,255,140,0.22)] bg-[#0C100C] flex items-center justify-center">
        <span className="text-[9px] text-[#3D5C3D] tracking-widest">
          Local feed
        </span>
</div>
      </div>

      {/* Controls */}
      <div className="h-[64px] flex items-center justify-center gap-4 border-t border-[rgba(0,255,140,0.12)]">
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
          className="px-4 h-[32px] border border-[rgba(0,255,140,0.22)] text-[10px] tracking-widest uppercase text-[#7A9A7A] hover:border-[#00FF8C] hover:text-[#00FF8C] transition-all"
        >
          files
        </button>
        <button
          onClick={onEnd}
          className="px-6 h-[32px] border border-[#CC2200] text-[10px] tracking-widest uppercase text-[#CC2200] hover:bg-[#CC2200] hover:text-[#F5F0E8] transition-all"
        >
          ✕ end session
        </button>
      </div>
    </div>
  );
}