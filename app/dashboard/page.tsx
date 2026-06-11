'use client';
import { useState, useEffect, useCallback } from 'react';
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

  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);


// 1. Wrap in useCallback so the function reference NEVER changes
const fetchToday = useCallback(async () => {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/today`, {
      credentials: 'include'
    });
    const data = await res.json();
    
    if (data.success) {
      const appts = data.appointments.map((a: any) => ({
        ...a,
        startsAt: new Date(a.startsAt),
        endsAt:   new Date(a.endsAt),
      }));
      
      setAppointments(appts);
      
      // 💡 Functional state update bypasses the stale closure trap entirely
      setSelected((prevSelected: any) => {
        if (!prevSelected && appts.length > 0) {
          return appts[0];
        }
        return prevSelected;
      });
    }
  } catch (err) {
    console.error('Failed to fetch appointments:', err);
  } finally {
    setLoading(false);
  }
}, []); // Empty array keeps this function perfectly stable

  
  // On mount
  useEffect(() => {
    fetchToday();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (appt: Appointment) => {
    setSelected(appt);
    setMobileView('detail');
  };

  const handleCreated = (appt: any) => {
    fetchToday();
    // Update selected if it's the same appointment
    if (selected?.id === appt.id) {
      setSelected({
        ...selected,
        ...appt,
        startsAt: new Date(appt.startsAt),
        endsAt:   new Date(appt.endsAt),
      });
    }
    setEditingAppt(null);
  };

  return (
    <>
      <NewAppointmentModal
        isOpen={showModal || !!editingAppt}
        onClose={() => { setShowModal(false); setEditingAppt(null); }}
        onCreated={handleCreated}
        appointment={editingAppt || undefined}
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
                onEdit={setEditingAppt}
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