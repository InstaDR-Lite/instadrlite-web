'use client';

import { useState } from 'react';
import { mockAppointments, Appointment } from '@/lib/mockData';
import AppointmentCard from './AppointmentCard';

interface Props {
  onSelect: (appt: Appointment) => void;
  selected: Appointment | null;
}

export default function TodaysQueue({ onSelect, selected }: Props) {
  return (
    <div className="flex-1 overflow-y-auto">
      {mockAppointments.length === 0 ? (
        <p className="px-5 py-4 text-[11px] text-[#7A9A7A] tracking-widest">
          No appointments scheduled for today.
        </p>
      ) : (
        mockAppointments.map(appt => (
          <AppointmentCard
            key={appt.id}
            appointment={appt}
            isActive={selected?.id === appt.id}
            onClick={() => onSelect(appt)}
          />
        ))
      )}
    </div>
  );
}