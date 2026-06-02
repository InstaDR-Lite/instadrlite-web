'use client';

import { useState } from 'react';
import { mockAppointments, Appointment } from '@/lib/mockData';
import TodaysQueue from '@/components/dashboard/TodayQueue';
import UpNext from '@/components/dashboard/UpNext';

export default function DashboardPage() {
  const [selected, setSelected] = useState<Appointment | null>(
    mockAppointments[0] ?? null
  );

  return (
    <div className="flex h-full">
      {/* Left — Today's Queue */}
      <div className="w-[380px] flex-shrink-0 border-r border-[rgba(0,80,40,0.18)] flex flex-col">
        <div className="px-5 py-3 border-b border-[rgba(0,80,40,0.18)] flex items-center gap-2">
          <span className="text-[10px] tracking-widest uppercase text-[#7A9A7A]">
            
          </span>
          <span className="text-xs tracking-widest uppercase text-[#3D5C3D]">
            Today
          </span>
          <span className="ml-auto text-[10px] font-mono text-[#7A9A7A]">
            {new Date().toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric'
            })}
          </span>
        </div>
        <TodaysQueue
          onSelect={setSelected}
          selected={selected}
        />
      </div>

      {/* Right — Up Next */}
      <div className="flex-1 flex flex-col">
        <div className="px-5 py-3 border-b border-[rgba(0,80,40,0.18)] flex items-center gap-2">
          <span className="text-[10px] tracking-widest uppercase text-[#7A9A7A]">

          </span>
          <span className="text-xs tracking-widest uppercase text-[#3D5C3D]">
            Up Next
          </span>
        </div>
        <UpNext appointment={selected} />
      </div>
    </div>
  );
}