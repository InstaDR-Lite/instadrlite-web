#!/bin/bash
API="http://localhost:4000/api/appointments"

# Monday Jun 2
curl -s -X POST $API -H "Content-Type: application/json" -d '{"patientName":"Sarah Chen","patientEmail":"sarah@example.com","startsAt":"2026-06-02T16:00:00.000Z","endsAt":"2026-06-02T16:50:00.000Z","paymentAmount":"35.00"}'
curl -s -X POST $API -H "Content-Type: application/json" -d '{"patientName":"Marcus Webb","patientEmail":"marcus@example.com","startsAt":"2026-06-02T18:00:00.000Z","endsAt":"2026-06-02T18:50:00.000Z","paymentAmount":"50.00"}'

# Tuesday Jun 3
curl -s -X POST $API -H "Content-Type: application/json" -d '{"patientName":"Aisha Johnson","patientEmail":"aisha@example.com","startsAt":"2026-06-03T16:00:00.000Z","endsAt":"2026-06-03T16:50:00.000Z","paymentAmount":"35.00"}'
curl -s -X POST $API -H "Content-Type: application/json" -d '{"patientName":"Tom Lewis","patientEmail":"tom@example.com","startsAt":"2026-06-03T21:00:00.000Z","endsAt":"2026-06-03T21:50:00.000Z","paymentAmount":"75.00"}'
curl -s -X POST $API -H "Content-Type: application/json" -d '{"patientName":"Rachel Park","patientEmail":"rachel@example.com","startsAt":"2026-06-03T23:00:00.000Z","endsAt":"2026-06-03T23:50:00.000Z"}'

# Wednesday Jun 4
curl -s -X POST $API -H "Content-Type: application/json" -d '{"patientName":"David Kim","patientEmail":"david@example.com","startsAt":"2026-06-04T17:00:00.000Z","endsAt":"2026-06-04T17:50:00.000Z","paymentAmount":"35.00"}'
curl -s -X POST $API -H "Content-Type: application/json" -d '{"patientName":"Nina Patel","patientEmail":"nina@example.com","startsAt":"2026-06-04T20:00:00.000Z","endsAt":"2026-06-04T20:50:00.000Z","paymentAmount":"50.00"}'

# Thursday Jun 5
curl -s -X POST $API -H "Content-Type: application/json" -d '{"patientName":"James Rivera","patientEmail":"james@example.com","startsAt":"2026-06-05T16:00:00.000Z","endsAt":"2026-06-05T16:50:00.000Z","paymentAmount":"35.00"}'
curl -s -X POST $API -H "Content-Type: application/json" -d '{"patientName":"Lisa Morgan","patientEmail":"lisa@example.com","startsAt":"2026-06-05T22:00:00.000Z","endsAt":"2026-06-05T22:50:00.000Z"}'

# Friday Jun 6
curl -s -X POST $API -H "Content-Type: application/json" -d '{"patientName":"Omar Hassan","patientEmail":"omar@example.com","startsAt":"2026-06-06T18:00:00.000Z","endsAt":"2026-06-06T18:50:00.000Z","paymentAmount":"75.00"}'

echo "Done!"