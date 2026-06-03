'use client';

import { useState, useEffect } from 'react';
import TodayQueue from '@/components/dashboard/TodayQueue';
import UpNext from '@/components/dashboard/UpNext';
import NewAppointmentModal from '@/components/dashboard/NewAppointmentModal';

export type Appointment = {
  id:            string;
  patientName:   string;
  patientEmail:  string;
  startsAt:      Date;
  endsAt:        Date;
  status:        'scheduled' | 'checking_in' | 'ready' | 'in_session' | 'completed';
  roomId:        string;
  inviteLink:    string;
  geoVerified:   boolean;
  paymentStatus: string;
  paymentAmount: number | null;
}

type MobileView = 'list' | 'detail';

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selected,     setSelected]     = useState<Appointment | null>(null);
  const [mobileView,   setMobileView]   = useState<MobileView>('list');
  const [showModal,    setShowModal]     = useState(false);
  const [loading,      setLoading]       = useState(true);

  const fetchToday = async () => {
    try {
      const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/today`);
      const data = await res.json();
      if (data.success) {
        const appts = data.appointments.map((a: any) => ({
          ...a,
          startsAt: new Date(a.startsAt),
          endsAt:   new Date(a.endsAt),
        }));
        setAppointments(appts);
        if (!selected && appts.length > 0) setSelected(appts[0]);
      }
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchToday(); }, []);

  const handleSelect = (appt: Appointment) => {
    setSelected(appt);
    setMobileView('detail');
  };

  const handleCreated = (appt: any) => {
    fetchToday(); // refresh list
    setShowModal(false);
  };

  return (
    <>
      <NewAppointmentModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreated={handleCreated}
      />

      <div className="flex h-full">
        {/* Left */}
        <div className={`
          md:w-[380px] md:flex-shrink-0 md:flex md:flex-col
          border-r border-[rgba(0,80,40,0.18)]
          ${mobileView === 'list' ? 'flex flex-col w-full' : 'hidden'}
          md:flex
        `}>
          <div className="px-5 py-3 border-b border-[rgba(0,80,40,0.18)] flex items-center gap-2">
            {/* <span className="text-[10px] tracking-widest uppercase text-[#7A9A7A]"></span> */}
            <span className="text-xs tracking-widest uppercase text-[#3D5C3D]">Today</span>
            <span className="ml-auto text-[10px] font-mono text-[#7A9A7A]">
              {new Date().toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
              })}
            </span>
          </div>
          {loading ? (
            <p className="px-5 py-4 text-[11px] text-[#7A9A7A] tracking-widest">
              {/* // loading... */}
              Loading today&apos;s appointments...
            </p>
          ) : (
            <TodayQueue
              appointments={appointments}
              onSelect={handleSelect}
              selected={selected}
            />
          )}
        </div>

        {/* Right */}
        <div className={`
          flex-1 flex flex-col
          ${mobileView === 'detail' ? 'flex w-full' : 'hidden'}
          md:flex
        `}>
          <div className="px-5 py-3 border-b border-[rgba(0,80,40,0.18)] flex items-center gap-2">
            <button
              onClick={() => setMobileView('list')}
              className="md:hidden text-[10px] tracking-widest uppercase text-[#7A9A7A] hover:text-[#007A40] mr-2"
            >
              ← back
            </button>
            {/* <span className="text-[10px] tracking-widest uppercase text-[#7A9A7A]"></span> */}
            <span className="text-xs tracking-widest uppercase text-[#3D5C3D]">Up Next</span>
            <button
              onClick={() => setShowModal(true)}
              className="ml-auto hidden md:block border border-[#007A40] px-3 h-[28px] text-[10px] tracking-widest uppercase text-[#007A40] hover:bg-[#007A40] hover:text-[#edf1f7] transition-all"
            >
              + new appt
            </button>
          </div>
          <UpNext
            appointment={selected}
            isMobile={mobileView === 'detail'}
          />
        </div>
      </div>
    </>
  );
}