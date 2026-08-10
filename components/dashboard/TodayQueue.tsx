import { Appointment } from '@/app/(app)/dashboard/page';
import AppointmentCard from './AppointmentCard';

interface Props {
  appointments: Appointment[];
  onSelect:     (appt: Appointment) => void;
  selected:     Appointment | null;
  onEdit?:      (appt: Appointment) => void;
}

function GroupLabel({ label, count }: { label: string; count: number }) {
  return (
    <div className="px-4 py-1.5 flex items-center gap-2">
      <span className="text-[9px] font-mono tracking-widest uppercase text-[#7A9A7A]">
        {label}
      </span>
      <span className="text-[9px] font-mono text-[#7A9A7A] opacity-60">
        ({count})
      </span>
    </div>
  );
}

export default function TodaysQueue({ appointments, onSelect, selected, onEdit }: Props) {
  // Group by status
  const waiting   = appointments.filter(a => a.status === 'ready' || a.status === 'checking_in');
  const inSession = appointments.filter(a => a.status === 'in_session');
  const scheduled = appointments.filter(a => a.status === 'scheduled');
  const earlier   = appointments.filter(a => a.status === 'completed');

  // Active = waiting + in_session shown at top
  // const active = [...inSession, ...waiting];

  if (appointments.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-5 py-8">
        <p className="text-[11px] text-[#7A9A7A] tracking-widest font-mono">
          // no arrivals today
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">

      {/* Waiting / In Session */}
      {/* {active.length > 0 && (
        <div>
          <GroupLabel label="Waiting" count={active.length} />
          {active.map(appt => (
            <AppointmentCard
              key={appt.id}
              appointment={appt}
              isActive={selected?.id === appt.id}
              onClick={() => onSelect(appt)}
              onEdit={onEdit ? () => onEdit(appt) : undefined}
            />
          ))}
        </div>
      )} */}

      {/* In Session */}
      {inSession.length > 0 && (
        <div>
          <GroupLabel label="In Session" count={inSession.length} />
          {inSession.map(appt => (
            <AppointmentCard
              key={appt.id}
              appointment={appt}
              isActive={selected?.id === appt.id}
              onClick={() => onSelect(appt)}
              onEdit={onEdit ? () => onEdit(appt) : undefined}
            />
          ))}
        </div>
      )}

      {/* Waiting */}
      {waiting.length > 0 && (
        <div className={inSession.length > 0 ? 'border-t border-[rgba(0,80,40,0.08)]' : ''}>
          <GroupLabel label="Waiting" count={waiting.length} />
          {waiting.map(appt => (
            <AppointmentCard
                    key={appt.id}
                    appointment={appt}
                    isActive={selected?.id === appt.id}
                    onClick={() => onSelect(appt)}
                    onEdit={onEdit ? () => onEdit(appt) : undefined}
                  />
          ))}
        </div>
      )}

      {/* Scheduled Today */}
      {scheduled.length > 0 && (
        <div className={scheduled.length > 0 ? 'border-t border-[rgba(0,80,40,0.08)]' : ''}>
          <GroupLabel label="Scheduled Today" count={scheduled.length} />
          {scheduled.map(appt => (
            <AppointmentCard
              key={appt.id}
              appointment={appt}
              isActive={selected?.id === appt.id}
              onClick={() => onSelect(appt)}
              onEdit={onEdit ? () => onEdit(appt) : undefined}
            />
          ))}
        </div>
      )}

      {/* Earlier / Completed */}
      {earlier.length > 0 && (
        <div className="border-t border-[rgba(0,80,40,0.08)]">
          <GroupLabel label="Earlier" count={earlier.length} />
          {earlier.map(appt => (
            <AppointmentCard
              key={appt.id}
              appointment={appt}
              isActive={selected?.id === appt.id}
              onClick={() => onSelect(appt)}
              onEdit={onEdit ? () => onEdit(appt) : undefined}
            />
          ))}
        </div>
      )}

    </div>
  );
}