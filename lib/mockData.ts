export interface Appointment {
  id:           string;
  patientName:  string;
  patientEmail: string;
  startsAt:     Date;
  endsAt:       Date;
  status:       'scheduled' | 'checking_in' | 'ready' | 'in_session' | 'completed';
  roomId:       string;
  geoVerified:  boolean;
  paymentStatus: 'unpaid' | 'paid' | 'authenticating';
}

export const mockAppointments: Appointment[] = [
  {
    id:           'appt_001',
    patientName:  'John Doe',
    patientEmail: 'john@example.com',
    startsAt:     new Date(new Date().setHours(9, 0, 0)),
    endsAt:       new Date(new Date().setHours(9, 50, 0)),
    status:       'ready',
    roomId:       'encounter_room_9942',
    geoVerified:  true,
    paymentStatus: 'paid',
  },
  {
    id:           'appt_002',
    patientName:  'Sarah Jenkins',
    patientEmail: 'sarah@example.com',
    startsAt:     new Date(new Date().setHours(10, 0, 0)),
    endsAt:       new Date(new Date().setHours(10, 50, 0)),
    status:       'checking_in',
    roomId:       'encounter_room_9943',
    geoVerified:  false,
    paymentStatus: 'authenticating',
  },
  {
    id:           'appt_003',
    patientName:  'Michael Chang',
    patientEmail: 'michael@example.com',
    startsAt:     new Date(new Date().setHours(11, 15, 0)),
    endsAt:       new Date(new Date().setHours(12, 5, 0)),
    status:       'scheduled',
    roomId:       'encounter_room_9944',
    geoVerified:  false,
    paymentStatus: 'unpaid',
  },
];