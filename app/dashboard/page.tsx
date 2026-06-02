'use client';

import { useState } from 'react';
import { mockAppointments, Appointment } from '@/lib/mockData';
import TodayQueue from '@/components/dashboard/TodayQueue';
import UpNext from '@/components/dashboard/UpNext';

type MobileView = 'list' | 'detail';

export default function DashboardPage() {
  const [selected, setSelected]       = useState<Appointment | null>(mockAppointments[0] ?? null);
  const [mobileView, setMobileView]   = useState<MobileView>('list');

  const handleSelect = (appt: Appointment) => {
    setSelected(appt);
    setMobileView('detail');
  };

  return (
    <div className="flex h-full">

      {/* ── LEFT: Today's Queue ──────────────────────────────────
          Desktop: always visible (fixed width)
          Mobile:  only visible in 'list' view              */}
      <div className={`
        md:w-[380px] md:flex-shrink-0 md:flex md:flex-col
        border-r border-[rgba(0,80,40,0.18)]
        ${mobileView === 'list' ? 'flex flex-col w-full' : 'hidden'}
        md:flex
      `}>
        <div className="px-5 py-3 border-b border-[rgba(0,80,40,0.18)] flex items-center gap-2">
          <span className="text-[10px] tracking-widest uppercase text-[#7A9A7A]">//</span>
          <span className="text-xs tracking-widest uppercase text-[#3D5C3D]">Today</span>
          <span className="ml-auto text-[10px] font-mono text-[#7A9A7A]">
            {new Date().toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric'
            })}
          </span>
        </div>
        <TodayQueue
          onSelect={handleSelect}
          selected={selected}
        x/>
      </div>

      {/* ── RIGHT: Up Next ───────────────────────────────────────
          Desktop: always visible (flex-1)
          Mobile:  only visible in 'detail' view             */}
      <div className={`
        flex-1 flex flex-col
        ${mobileView === 'detail' ? 'flex w-full' : 'hidden'}
        md:flex
      `}>
        <div className="px-5 py-3 border-b border-[rgba(0,80,40,0.18)] flex items-center gap-2">
          {/* Back button — mobile only */}
          <button
            onClick={() => setMobileView('list')}
            className="md:hidden text-[10px] tracking-widest uppercase text-[#7A9A7A] hover:text-[#007A40] mr-2 transition-all"
          >
            ← back
          </button>
          <span className="text-[10px] tracking-widest uppercase text-[#7A9A7A]">//</span>
          <span className="text-xs tracking-widest uppercase text-[#3D5C3D]">Up Next</span>
        </div>
        <UpNext
          appointment={selected}
          isMobile={mobileView === 'detail'}
        />
      </div>

    </div>
  );
}