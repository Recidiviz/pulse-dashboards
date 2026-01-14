// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

/* eslint-disable no-await-in-loop */

import { faker } from "@faker-js/faker";
import { PrismaPg } from "@prisma/adapter-pg";
import { Transcript } from "assemblyai";

import {
  Client,
  PostMeetingProcessingStatus,
  Prisma,
  PrismaClient,
  Resident,
  StateCode,
} from "~@meetings/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env[`DATABASE_URL`],
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clean up existing data
  await prisma.utterance.deleteMany({});
  await prisma.transcription.deleteMany({});
  await prisma.meeting.deleteMany({});
  await prisma.clientsToStaff.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.resident.deleteMany({});
  await prisma.staff.deleteMany({});

  // Seed single staff
  const seededStaff = await prisma.staff.create({
    data: {
      staffId: 1,
      stableStaffExternalId: `staff-ext-1`,
      pseudonymizedId: `staff-pid-1`,
      givenNames: faker.person.firstName(),
      middleNames: faker.person.firstName(),
      surname: faker.person.lastName(),
      email: faker.internet.email(),
      stateCode: StateCode.US_NE,
    },
  });

  // Seed Clients
  const numberOfClients = 10;
  const createdClients: Client[] = [];
  for (let i = 0; i < numberOfClients; i++) {
    const clientData: Prisma.ClientCreateInput = {
      stateCode: StateCode.US_NE,
      personId: i + 1,
      stablePersonExternalId: `client-ext-${i + 1}`,
      stablePersonExternalIdType: "client-ext-type-1",
      displayPersonExternalId: `client-display-ext-${i + 1}`,
      pseudonymizedId: `client-pid-${i + 1}`,
      givenNames: faker.person.firstName(),
      middleNames: faker.person.firstName(),
      surname: faker.person.lastName(),
      suffix: faker.person.suffix(),
      staff: {
        create: {
          staff: {
            connect: {
              staffId: seededStaff.staffId,
            },
          },
        },
      },
      supervisionType: "PAROLE",
    };
    const client = await prisma.client.create({ data: clientData });
    createdClients.push(client);
  }

  // Seed a meeting for every client
  for (const createdClient of createdClients) {
    const meetingStart = faker.date.past();
    const meetingEnd = faker.date.soon({ refDate: meetingStart });
    await prisma.meeting.create({
      data: {
        id: `meeting-${createdClient.personId}`,
        startTime: meetingStart,
        endTime: meetingEnd,
        clientId: createdClient.personId,
        staffId: seededStaff.staffId,
        recordingsGCSBucket: "test-audio-bucket",
        recordingsFolderPath: `meeting-${createdClient.personId}`,
        userNotepadNotes: faker.lorem.paragraph(),
        actionItems: faker.lorem.sentences(3),
        criticalUpdates: faker.lorem.sentences(2),
        meetingSummary: faker.lorem.paragraph(),
        postMeetingProcessingStatus: PostMeetingProcessingStatus.COMPLETED,
        transcriptions: {
          create: [
            {
              id: `meeting-${createdClient.personId}`,
              provider: faker.helpers.arrayElement(["ASSEMBLYAI", "DEEPGRAM"]),
              transcriptObject: {} as Transcript,
              confidence: faker.number.float(),
              utterances: {
                create: Array.from({ length: 5 }, (_, i) => ({
                  confidence: faker.number.float(),
                  endTimeMs: (i + 1) * 3000,
                  speaker: faker.helpers.arrayElement([
                    "Speaker A",
                    "Speaker B",
                  ]),
                  startTimeMs: i * 3000,
                  text: faker.lorem.sentence(),
                })),
              },
              summary: faker.lorem.paragraph(),
            },
          ],
        },
      },
    });
  }

  // Seed Residents
  const numberOfResidents = 10;
  const createdResidents: Resident[] = [];
  for (let i = 0; i < numberOfResidents; i++) {
    const residentData: Prisma.ResidentCreateInput = {
      stateCode: StateCode.US_NE,
      personId: i + 1,
      stablePersonExternalId: `resident-ext-${i + 1}`,
      stablePersonExternalIdType: "resident-ext-type-1",
      displayPersonExternalId: `resident-display-ext-${i + 1}`,
      pseudonymizedId: `resident-pid-${i + 1}`,
      givenNames: faker.person.firstName(),
      middleNames: faker.person.firstName(),
      surname: faker.person.lastName(),
      suffix: faker.person.suffix(),
      facilityId: `facility-${i + 1}`,
    };
    const resident = await prisma.resident.create({ data: residentData });
    createdResidents.push(resident);
  }

  // Seed a meeting for every resident
  for (const createdResident of createdResidents) {
    const meetingStart = faker.date.past();
    const meetingEnd = faker.date.soon({ refDate: meetingStart });
    await prisma.meeting.create({
      data: {
        id: `resident-meeting-${createdResident.personId}`,
        startTime: meetingStart,
        endTime: meetingEnd,
        residentId: createdResident.personId,
        staffId: seededStaff.staffId,
        recordingsGCSBucket: "test-audio-bucket",
        recordingsFolderPath: `resident-meeting-${createdResident.personId}`,
        userNotepadNotes: faker.lorem.paragraph(),
        actionItems: faker.lorem.sentences(3),
        criticalUpdates: faker.lorem.sentences(2),
        meetingSummary: faker.lorem.paragraph(),
        postMeetingProcessingStatus: PostMeetingProcessingStatus.COMPLETED,
        transcriptions: {
          create: [
            {
              id: `resident-meeting-${createdResident.personId}`,
              provider: faker.helpers.arrayElement(["ASSEMBLYAI", "DEEPGRAM"]),
              transcriptObject: {} as Transcript,
              confidence: faker.number.float(),
              utterances: {
                create: Array.from({ length: 5 }, (_, i) => ({
                  confidence: faker.number.float(),
                  endTimeMs: (i + 1) * 3000,
                  speaker: faker.helpers.arrayElement([
                    "Speaker A",
                    "Speaker B",
                  ]),
                  startTimeMs: i * 3000,
                  text: faker.lorem.sentence(),
                })),
              },
              summary: faker.lorem.paragraph(),
            },
          ],
        },
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
