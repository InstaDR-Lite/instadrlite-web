import { Appointment } from '@/app/dashboard/page';
import AppointmentCard from './AppointmentCard';

interface Props {
  appointments: Appointment[];
  onSelect:     (appt: Appointment) => void;
  selected:     Appointment | null;
  onEdit?:      (appt: Appointment) => void;
}

export default function TodaysQueue({ appointments, onSelect, selected }: Props) {
  return (
    <div className="flex-1 overflow-y-auto">
      {appointments.length === 0 ? (
        <p className="px-5 py-4 text-[11px] text-[#7A9A7A] tracking-widest">
          {/* // no appointments today */}
          no appointments scheduled for today
        </p>
      ) : (
        appointments.map(appt => (
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