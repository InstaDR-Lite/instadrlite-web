
import { Appointment } from '@/app/dashboard/page';
interface Props {
  appointment: Appointment;
  isActive:    boolean;
  onClick:     () => void;
  onEdit?:     (appt: Appointment) => void;
}

const statusConfig = {
  ready:       { label: 'READY',       color: 'text-[#007A40]',  dot: 'bg-[#007A40]' },
  checking_in: { label: 'CHECKING IN', color: 'text-[#8B6914]',  dot: 'bg-[#8B6914]' },
  scheduled:   { label: 'SCHEDULED',   color: 'text-[#7A9A7A]',  dot: 'bg-[#7A9A7A]' },
  in_session:  { label: 'IN SESSION',  color: 'text-[#007A40]',  dot: 'bg-[#007A40]' },
  completed:   { label: 'COMPLETED',   color: 'text-[#7A9A7A]',  dot: 'bg-[#7A9A7A]' },
};

export default function AppointmentCard({ appointment, isActive, onClick, onEdit }: Props) {
  const cfg   = statusConfig[appointment.status];
  const time  = appointment.startsAt.toLocaleTimeString('en-US', {
    hour:   '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div
      onClick={onClick}
      className={`px-5 py-3 border-b border-[rgba(0,80,40,0.12)] cursor-pointer transition-all ${
        isActive
          ? 'bg-[rgba(0,122,64,0.08)] border-l-2 border-l-[#007A40]'
          : 'hover:bg-[rgba(0,122,64,0.04)]'
      }`}
    >
      {/* Time + Name */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#7A9A7A] tracking-widest font-mono">
            [{time}]
          </span>
          <span className="text-xs font-semibold text-[#1A2E1A] tracking-wide">
            {appointment.patientName}
          </span>
        </div>
        <div className={`flex items-center gap-1.5 text-[9px] tracking-widest uppercase ${cfg.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 text-[10px] text-[#7A9A7A] tracking-wide">
        <span>
          {appointment.geoVerified ? '📍 Verified' : '📍 Pending GPS'}
        </span>
        {onEdit && (
          <button
            onClick={e => { e.stopPropagation(); onEdit(appointment); }}
            className="text-[10px] text-[#7A9A7A] hover:text-[#007A40] tracking-widest uppercase transition-all"
          >
            edit
          </button>
        )}
        <span>
          {appointment.paymentStatus === 'paid'
            ? '💳 Paid'
            : appointment.paymentStatus === 'authenticating'
            ? '💳 Auth...'
            : '💳 Unpaid'}
        </span>
      </div>
    </div>
  );
}