// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

import { faker } from "@faker-js/faker";

import {
  Prisma,
  PrismaClient,
  StateCode,
  TranscriptionProvider,
} from "~@meetings/prisma/client";
import env from "~@meetings/trpc/env";

export const intakeId = "intake-1";
export const clientPseudoId1 = "client-pid-1";
export const clientPseudoId2 = "client-pid-2";
export const clientPseudoId3 = "client-pid-3";
export const clientPseudoId4 = "client-pid-4";
export const residentPseudoId1 = "resident-pid-1";
export const residentPseudoId2 = "resident-pid-2";
export const residentPseudoId3 = "resident-pid-3";

export const fakeStaff = [
  {
    staffId: BigInt(1),
    stableStaffExternalId: "staff-ext-1",
    pseudonymizedId: "staff-pid-1",
    givenNames: faker.person.firstName(),
    middleNames: faker.person.firstName(),
    surname: faker.person.lastName(),
    email: faker.internet.email(),
    stateCode: StateCode.US_NE,
  },
  {
    staffId: BigInt(2),
    stableStaffExternalId: "staff-ext-2",
    pseudonymizedId: "staff-pid-2",
    givenNames: faker.person.firstName(),
    middleNames: faker.person.firstName(),
    surname: faker.person.lastName(),
    email: faker.internet.email(),
    stateCode: StateCode.US_NE,
  },
] satisfies Prisma.StaffCreateManyInput[];

export const fakeClients = [
  {
    stateCode: StateCode.US_NE,
    personId: BigInt(1),
    stablePersonExternalId: "client-ext-1",
    stablePersonExternalIdType: "client-ext-type-1",
    displayPersonExternalId: "client-display-ext-1",
    pseudonymizedId: clientPseudoId1,
    givenNames: faker.person.firstName(),
    middleNames: faker.person.firstName(),
    surname: faker.person.lastName(),
    suffix: faker.person.suffix(),
    staff: {
      create: {
        staffId: fakeStaff[0].staffId,
      },
    },
    supervisionType: "PAROLE",
    isActive: true,
  },
  {
    stateCode: StateCode.US_NE,
    personId: BigInt(2),
    stablePersonExternalId: "client-ext-2",
    stablePersonExternalIdType: "client-ext-type-1",
    displayPersonExternalId: "client-display-ext-2",
    pseudonymizedId: clientPseudoId2,
    givenNames: faker.person.firstName(),
    middleNames: faker.person.firstName(),
    surname: faker.person.lastName(),
    suffix: faker.person.suffix(),
    staff: {
      create: {
        staffId: fakeStaff[1].staffId,
      },
    },
    supervisionType: "PAROLE",
    isActive: true,
  },
  {
    stateCode: StateCode.US_NE,
    personId: BigInt(3),
    stablePersonExternalId: "client-ext-3",
    stablePersonExternalIdType: "client-ext-type-1",
    displayPersonExternalId: "client-display-ext-3",
    pseudonymizedId: clientPseudoId3,
    givenNames: faker.person.firstName(),
    middleNames: faker.person.firstName(),
    surname: faker.person.lastName(),
    suffix: faker.person.suffix(),
    staff: {
      create: {
        staffId: fakeStaff[0].staffId,
      },
    },
    supervisionType: "PAROLE",
    isActive: false,
  },
  {
    stateCode: StateCode.US_NE,
    personId: BigInt(4),
    stablePersonExternalId: "client-ext-4",
    stablePersonExternalIdType: "client-ext-type-1",
    displayPersonExternalId: "client-display-ext-4",
    pseudonymizedId: clientPseudoId4,
    givenNames: faker.person.firstName(),
    middleNames: faker.person.firstName(),
    surname: faker.person.lastName(),
    suffix: faker.person.suffix(),
    staff: {
      create: {
        staffId: fakeStaff[0].staffId,
      },
    },
    supervisionType: "PAROLE",
    isActive: true,
  },
] satisfies Prisma.ClientCreateInput[];

export const fakeResidents = [
  {
    stateCode: StateCode.US_NE,
    personId: BigInt(101),
    stablePersonExternalId: "resident-ext-1",
    stablePersonExternalIdType: "resident-ext-type-1",
    displayPersonExternalId: "resident-display-ext-1",
    pseudonymizedId: residentPseudoId1,
    givenNames: faker.person.firstName(),
    middleNames: faker.person.firstName(),
    surname: faker.person.lastName(),
    suffix: faker.person.suffix(),
    facilityId: "facility-1",
    isActive: true,
  },
  {
    stateCode: StateCode.US_NE,
    personId: BigInt(102),
    stablePersonExternalId: "resident-ext-2",
    stablePersonExternalIdType: "resident-ext-type-1",
    displayPersonExternalId: "resident-display-ext-2",
    pseudonymizedId: residentPseudoId2,
    givenNames: faker.person.firstName(),
    middleNames: faker.person.firstName(),
    surname: faker.person.lastName(),
    suffix: faker.person.suffix(),
    facilityId: "facility-1",
    isActive: true,
  },
  {
    stateCode: StateCode.US_NE,
    personId: BigInt(103),
    stablePersonExternalId: "resident-ext-3",
    stablePersonExternalIdType: "resident-ext-type-1",
    displayPersonExternalId: "resident-display-ext-3",
    pseudonymizedId: residentPseudoId3,
    givenNames: faker.person.firstName(),
    middleNames: faker.person.firstName(),
    surname: faker.person.lastName(),
    suffix: faker.person.suffix(),
    facilityId: "facility-2",
    isActive: false,
  },
] satisfies Prisma.ResidentCreateInput[];

const dateNow = new Date();
const millisecondsInOneHour = 60 * 60 * 1000;

export const fakeActiveMeeting = {
  id: "meeting-1",
  staff: {
    connect: {
      staffId: fakeStaff[0].staffId,
      pseudonymizedId: fakeStaff[0].pseudonymizedId,
    },
  },
  client: {
    connect: {
      personId: fakeClients[0].personId,
    },
  },
  startTime: new Date(dateNow.getTime() - millisecondsInOneHour * 3),
  recordingsGCSBucket: env.AUDIO_RECORDINGS_BUCKET_NAME,
  recordingsFolderPath: "meeting-1",
  userNotepadNotes: "Sample meeting notes.",
  actionItems: JSON.stringify([]),
  criticalUpdates: JSON.stringify([]),
  meetingSummary: JSON.stringify([]),
  caseNote: "draft case note",
  transcriptions: {
    create: [
      {
        provider: TranscriptionProvider.ASSEMBLYAI,
        transcriptObject: {} as PrismaJson.TranscriptType,
        confidence: 0.95,
        summary: "This is a sample summary of the meeting.",
        utterances: {
          createMany: {
            data: [
              {
                text: "Hello, this is second a sample utterance.",
                speaker: "Speaker B",
                startTimeMs: 3000,
                endTimeMs: 6000,
                confidence: 0.98,
              },
              {
                text: "Hello, this is a sample utterance.",
                speaker: "Speaker A",
                startTimeMs: 0,
                endTimeMs: 3000,
                confidence: 0.98,
              },
            ],
          },
        },
      },
      {
        provider: TranscriptionProvider.DEEPGRAM,
        transcriptObject: {} as PrismaJson.TranscriptType,
        confidence: 0.91,
        utterances: {
          createMany: {
            data: [
              {
                text: "Hello, this is second a sample utterance.",
                speaker: "Speaker B",
                startTimeMs: 3000,
                endTimeMs: 6000,
                confidence: 0.98,
              },
              {
                text: "Hello, this is a sample utterance.",
                speaker: "Speaker A",
                startTimeMs: 0,
                endTimeMs: 3000,
                confidence: 0.98,
              },
            ],
          },
        },
      },
    ],
  },
} satisfies Prisma.MeetingCreateInput;

export const fakeInactiveMeeting = {
  id: "meeting-2",
  staff: {
    connect: {
      staffId: fakeStaff[0].staffId,
      pseudonymizedId: fakeStaff[0].pseudonymizedId,
    },
  },
  client: {
    connect: {
      personId: fakeClients[3].personId,
    },
  },
  startTime: new Date(dateNow.getTime() - millisecondsInOneHour * 2),
  endTime: new Date(dateNow.getTime() - millisecondsInOneHour * 3),
  recordingsGCSBucket: env.AUDIO_RECORDINGS_BUCKET_NAME,
  recordingsFolderPath: "meeting-1",
  userNotepadNotes: "Sample meeting notes.",
  actionItems:
    "1. Follow up on employment status\n2. Schedule next check-in\n3. Review case file",
  criticalUpdates:
    "Client reported new job opportunity. Upcoming court date next week.",
  meetingSummary:
    "Productive meeting discussing client progress and upcoming milestones.",
  transcriptions: {
    create: [],
  },
} satisfies Prisma.MeetingCreateInput;

export const fakeMeetingStaff1 = {
  id: "meeting-3",
  staff: {
    connect: {
      staffId: fakeStaff[1].staffId,
      pseudonymizedId: fakeStaff[1].pseudonymizedId,
    },
  },
  client: {
    connect: {
      personId: fakeClients[1].personId,
    },
  },
  startTime: dateNow, //has the earliest start time so we can see it is filtered out based on staff id
  recordingsGCSBucket: env.AUDIO_RECORDINGS_BUCKET_NAME,
  recordingsFolderPath: "meeting-1",
  userNotepadNotes: "Sample meeting notes.",
  actionItems:
    "1. Follow up on employment status\n2. Schedule next check-in\n3. Review case file",
  criticalUpdates:
    "Client reported new job opportunity. Upcoming court date next week.",
  meetingSummary:
    "Productive meeting discussing client progress and upcoming milestones.",
  transcriptions: {
    create: [],
  },
} satisfies Prisma.MeetingCreateInput;

export const fakeResidentMeeting = {
  id: "resident-meeting-1",
  staff: {
    connect: {
      staffId: fakeStaff[0].staffId,
    },
  },
  resident: {
    connect: {
      personId: fakeResidents[0].personId,
    },
  },
  startTime: new Date(),
  recordingsGCSBucket: env.AUDIO_RECORDINGS_BUCKET_NAME,
  recordingsFolderPath: "resident-meeting-1",
  userNotepadNotes: "Sample resident meeting notes.",
  transcriptions: {
    create: [
      {
        provider: TranscriptionProvider.ASSEMBLYAI,
        transcriptObject: {} as PrismaJson.TranscriptType,
        confidence: 0.95,
        summary: "This is a sample summary of the resident meeting.",
        utterances: {
          createMany: {
            data: [
              {
                text: "Hello, this is a sample resident utterance.",
                speaker: "Speaker A",
                startTimeMs: 0,
                endTimeMs: 3000,
                confidence: 0.98,
              },
            ],
          },
        },
      },
    ],
  },
} satisfies Prisma.MeetingCreateInput;

export const fakeResidentMeetingCompleted = {
  id: "resident-meeting-2",
  staff: {
    connect: {
      staffId: fakeStaff[0].staffId,
    },
  },
  resident: {
    connect: {
      personId: fakeResidents[1].personId,
    },
  },
  startTime: new Date(),
  endTime: new Date(),
  recordingsGCSBucket: env.AUDIO_RECORDINGS_BUCKET_NAME,
  recordingsFolderPath: "resident-meeting-2",
  userNotepadNotes: "Sample resident meeting notes.",
  transcriptions: {
    create: [
      {
        provider: TranscriptionProvider.ASSEMBLYAI,
        transcriptObject: {} as PrismaJson.TranscriptType,
        confidence: 0.95,
        summary: "This is a sample summary of the resident meeting.",
        utterances: {
          createMany: {
            data: [
              {
                text: "Hello, this is a sample resident utterance.",
                speaker: "Speaker A",
                startTimeMs: 0,
                endTimeMs: 3000,
                confidence: 0.98,
              },
            ],
          },
        },
      },
    ],
  },
} satisfies Prisma.MeetingCreateInput;

export async function seed(prismaClient: PrismaClient) {
  // Seed Data
  await prismaClient.staff.createMany({
    data: fakeStaff,
  });

  // createMany doesn't allow adding connections at the same time, so do it one by one instead
  // (this is fine since we have such a small number of fake clients)
  await Promise.all(
    fakeClients.map((client) =>
      prismaClient.client.create({
        data: client,
      }),
    ),
  );

  await prismaClient.resident.createMany({
    data: fakeResidents,
  });

  await prismaClient.meeting.create({
    data: fakeActiveMeeting,
  });

  await prismaClient.meeting.create({
    data: fakeInactiveMeeting,
  });

  await prismaClient.meeting.create({
    data: fakeMeetingStaff1,
  });

  await prismaClient.meeting.create({
    data: fakeResidentMeeting,
  });

  await prismaClient.meeting.create({
    data: fakeResidentMeetingCompleted,
  });
}
