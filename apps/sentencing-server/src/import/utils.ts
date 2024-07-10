import z from "zod";

import {
  caseImportSchema,
  clientImportSchema,
  nameSchema,
  staffImportSchema,
} from "~sentencing-server/import/models";
import { prismaClient } from "~sentencing-server/prisma";

export function fullNameObjectToString(nameObject: z.infer<typeof nameSchema>) {
  return `${nameObject.given_names} ${nameObject.middle_names} ${nameObject.surname} ${nameObject.name_suffix}`;
}
export async function transformAndLoadClientData(data: unknown) {
  const parsedData = clientImportSchema.parse(data);

  const existingCases = await prismaClient.case.findMany({
    select: { externalId: true },
  });

  // Transform the provided data
  const cleanedData = parsedData.map((clientData) => {
    // Just get the cases which are already in the database (if a case hasn't been uploaded yet, it will be linked to this client during the case upload process)
    const existingCasesForClient = existingCases.filter(({ externalId }) =>
      clientData.caseIds.includes(externalId),
    );

    return {
      externalId: clientData.external_id,
      pseudonymizedId: clientData.pseudonymized_id,
      stateCode: clientData.state_code,
      fullName: clientData.full_name,
      gender: clientData.gender,
      county: clientData.county ?? "UNKNOWN",
      birthDate: clientData.birth_date,
      Cases: {
        connect: existingCasesForClient,
      },
    };
  });

  // Load new client data
  await Promise.all(
    cleanedData.map(async (newClient) => {
      await prismaClient.client.upsert({
        where: {
          externalId: newClient.externalId,
        },
        create: newClient,
        update: newClient,
      });
    }),
  );

  // Delete all of the old clients that weren't just loaded
  await prismaClient.client.deleteMany({
    where: {
      NOT: {
        externalId: {
          in: cleanedData.map((client) => client.externalId),
        },
      },
    },
  });
}

export async function transformAndLoadStaffData(data: unknown) {
  const parsedData = staffImportSchema.parse(data);

  const existingCases = await prismaClient.case.findMany({
    select: { externalId: true },
  });

  const cleanedData = parsedData.map((staffData) => {
    // Just get the cases which are already in the database (if a case hasn't been uploaded yet, it will be linked to this client during the case upload process)
    const existingCasesForStaff = existingCases.filter(({ externalId }) =>
      staffData.caseIds.includes(externalId),
    );

    return {
      externalId: staffData.external_id,
      pseudonymizedId: staffData.pseudonymized_id,
      stateCode: staffData.state_code,
      fullName: staffData.full_name,
      email: staffData.email,
      Cases: {
        connect: existingCasesForStaff,
      },
    };
  });

  // Load new data
  await Promise.all(
    cleanedData.map(async (newStaff) => {
      await prismaClient.staff.upsert({
        where: {
          externalId: newStaff.externalId,
        },
        create: newStaff,
        update: newStaff,
      });
    }),
  );

  // Delete all of the old staff that weren't just loaded
  await prismaClient.staff.deleteMany({
    where: {
      NOT: {
        externalId: {
          in: cleanedData.map((staff) => staff.externalId),
        },
      },
    },
  });
}

export async function transformAndLoadCaseData(data: unknown) {
  const parsedData = caseImportSchema.parse(data);

  const cleanedData = await Promise.all(
    parsedData.map(async (caseData) => {
      // Check if the staff and clients exist in the db - if not, we'll link
      // them later
      const staffId = (
        await prismaClient.staff.findUnique({
          where: { externalId: caseData.staff_id },
          select: { externalId: true },
        })
      )?.externalId;
      const clientId = (
        await prismaClient.client.findUnique({
          where: { externalId: caseData.client_id },
          select: { externalId: true },
        })
      )?.externalId;

      return {
        externalId: caseData.external_id,
        stateCode: caseData.state_code,
        staffId,
        clientId,
        dueDate: caseData.due_date,
        completionDate: caseData.completion_date,
        sentenceDate: caseData.sentence_date,
        assignedDate: caseData.assigned_date,
        county: caseData.county_name,
        lsirScore: caseData.lsir_score,
        lsirLevel: caseData.lsir_level,
        reportType: caseData.report_type,
      };
    }),
  );

  // Load new data
  await Promise.all(
    cleanedData.map(async (newCase) => {
      await prismaClient.case.upsert({
        where: {
          externalId: newCase.externalId,
        },
        create: newCase,
        update: newCase,
      });
    }),
  );

  // Delete all of the old cases that weren't just loaded
  await prismaClient.case.deleteMany({
    where: {
      NOT: {
        externalId: {
          in: cleanedData.map((caseData) => caseData.externalId),
        },
      },
    },
  });
}
