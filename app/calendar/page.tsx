'use client';

import { useState, useEffect } from 'react';
import { Appointment } from '@/app/dashboard/page';
import AppointmentCard from '@/components/dashboard/AppointmentCard';

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function getWeekDays(date: Date): Date[] {
  const start = new Date(date);
  const day = start.getDay();
  start.setDate(start.getDate() - day + 1); // Monday
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export default function CalendarPage() {
  const [weekStart,    setWeekStart]    = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selected,     setSelected]     = useState<Appointment | null>(null);
  const [loading,      setLoading]      = useState(true);

  const days = getWeekDays(weekStart);

  const fetchUpcoming = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/upcoming`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setAppointments(data.appointments.map((a: any) => ({
          ...a,
          startsAt: new Date(a.startsAt),
          endsAt:   new Date(a.endsAt),
        })));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUpcoming(); }, []);

  const apptsByDay = (day: Date) =>
    appointments.filter(a => {
      const d = new Date(a.startsAt);
      return d.getFullYear() === day.getFullYear() &&
             d.getMonth()    === day.getMonth() &&
             d.getDate()     === day.getDate();
    });

  const prevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };

  const nextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };

  const isToday = (day: Date) => {
    const t = new Date();
    return day.getDate()     === t.getDate() &&
           day.getMonth()    === t.getMonth() &&
           day.getFullYear() === t.getFullYear();
  };

  return (
    <div className="flex flex-col h-full">

      {/* Week nav */}
      <div className="px-5 py-3 border-b border-[rgba(0,80,40,0.18)] flex items-center gap-3">
        <button
          onClick={prevWeek}
          className="text-[#7A9A7A] hover:text-[#007A40] text-sm transition-all"
        >
          ←
        </button>
        <span className="text-[11px] tracking-widest uppercase text-[#3D5C3D] font-mono">
          {days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          {' — '}
          {days[4].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        <button
          onClick={nextWeek}
          className="text-[#7A9A7A] hover:text-[#007A40] text-sm transition-all"
        >
          →
        </button>
        <button
          onClick={() => setWeekStart(new Date())}
          className="ml-auto text-[10px] tracking-widest uppercase text-[#7A9A7A] border border-[rgba(0,80,40,0.18)] px-3 py-1 hover:border-[#007A40] hover:text-[#007A40] transition-all"
        >
          today
        </button>
      </div>

      {/* Columnar grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-px bg-[rgba(0,80,40,0.12)] min-h-full">
          {days.map((day, i) => (
            <div
              key={i}
              className="bg-[#edf1f7] flex flex-col"
            >
              {/* Day header */}
              <div className={`px-3 py-2 border-b border-[rgba(0,80,40,0.18)] sticky top-0 ${
                isToday(day) ? 'bg-[rgba(0,122,64,0.08)]' : 'bg-[#e4eaf4]'
              }`}>
                <div className={`text-[10px] tracking-widest uppercase font-mono ${
                  isToday(day) ? 'text-[#007A40]' : 'text-[#7A9A7A]'
                }`}>
                  {DAYS[day.getDay()]}
                </div>
                <div className={`text-sm font-semibold ${
                  isToday(day) ? 'text-[#007A40]' : 'text-[#1A2E1A]'
                }`}>
                  {day.getDate()}
                </div>
              </div>

              {/* Appointments */}
              <div className="flex-1 flex flex-col">
                {loading ? (
                  <p className="px-3 py-2 text-[10px] text-[#7A9A7A] tracking-widest">
                    Loading...
                  </p>
                ) : apptsByDay(day).length === 0 ? (
                  <p className="px-3 py-3 text-[10px] text-[#7A9A7A] tracking-widest opacity-50">
                    No appointments
                  </p>
                ) : (
                  apptsByDay(day).map(appt => (
                    <AppointmentCard
                      key={appt.id}
                      appointment={appt}
                      isActive={selected?.id === appt.id}
                      onClick={() => setSelected(appt)}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}