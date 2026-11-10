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

import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import {
  HousingApplicationDocumentType,
  HousingApplicationDocumentUploader,
  Prisma,
  StateCode,
} from "~@idaho-th/prisma/client";

import { seed } from "../seed";
import { getPrismaClientForStateCode } from "../utils";

const prisma = getPrismaClientForStateCode(StateCode.US_ID);

const PRISMA_TABLES = Object.values(Prisma.ModelName);

async function resetDb() {
  await prisma.$transaction(
    PRISMA_TABLES.map((table) =>
      prisma.$executeRawUnsafe(`TRUNCATE "${table}" CASCADE;`),
    ),
  );
}

// ---------------------------------------------------------------------------
// CSV fixtures. One row per physical location, each carrying its own contact.
// Placeholder people only — never real names, phones, or addresses.
// ---------------------------------------------------------------------------

const COLUMN_COUNT = 22;
const CSV_HEADER = Array.from(
  { length: COLUMN_COUNT },
  (_, index) => `column${index}`,
).join(",");

interface RowFixture {
  housingProviderName: string;
  district?: string;
  housingType?: string;
  streetAddress?: string;
  city?: string;
  zip?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
}

function csvRow(row: RowFixture): string {
  const fields = Array.from({ length: COLUMN_COUNT }, () => "");
  fields[0] = row.housingProviderName;
  fields[1] = row.district ?? "District 1";
  fields[2] = row.housingType ?? "Transitional";
  fields[4] = "Yes"; // men accepted
  fields[10] = row.streetAddress ?? "1 Placeholder St";
  fields[11] = row.city ?? "Boise";
  fields[12] = row.zip ?? "83701";
  fields[13] = row.contactName ?? "";
  fields[14] = row.contactPhone ?? "";
  fields[15] = row.contactEmail ?? "";
  return fields.join(",");
}

function csv(...rows: RowFixture[]): string {
  return [CSV_HEADER, ...rows.map(csvRow)].join("\n");
}

function runSeed(content: string) {
  return seed({
    prisma,
    readProviderCsv: () => Promise.resolve(content),
  });
}

async function createScopedDocument(providerId: string, objectKey: string) {
  const application = await prisma.housingApplication.create({
    data: {
      stateCode: StateCode.US_ID,
      clientName: "Jane Doe",
      formData: {},
    },
    select: { id: true },
  });
  await prisma.housingApplicationDocument.create({
    data: {
      applicationId: application.id,
      uploadedByType: HousingApplicationDocumentUploader.PROVIDER,
      uploadedByPseudonymizedId: "provider-pseudo-id",
      documentType: HousingApplicationDocumentType.ATTACHMENT,
      fileName: "attachment.pdf",
      bucketName: "test-bucket",
      objectKey,
      contentType: "application/pdf",
      scopedProviderId: providerId,
    },
  });
  return application.id;
}

async function providerIdByName(name: string) {
  const provider = await prisma.housingProvider.findUniqueOrThrow({
    where: { name },
    select: { id: true },
  });
  return provider.id;
}

beforeEach(async () => {
  await resetDb();
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("provider CSV import", () => {
  it("gives one person running two providers a single user with two assignments", async () => {
    await expect(
      runSeed(
        csv(
          {
            housingProviderName: "Org Alpha",
            contactName: "Jane Doe",
            contactPhone: "208-555-0101",
            contactEmail: "jane.doe@example.test",
          },
          {
            housingProviderName: "Org Beta",
            streetAddress: "2 Placeholder St",
            contactName: "Jane Doe",
            contactPhone: "208-555-0101",
            contactEmail: "jane.doe@example.test",
          },
        ),
      ),
    ).resolves.toBeUndefined();

    const users = await prisma.housingProviderUser.findMany({
      select: {
        email: true,
        assignments: { select: { provider: { select: { name: true } } } },
      },
    });

    expect(users).toHaveLength(1);
    expect(users[0]?.email).toBe("jane.doe@example.test");
    expect(
      users[0]?.assignments.map((a) => a.provider.name).sort(),
    ).toStrictEqual(["Org Alpha", "Org Beta"]);
  });

  it("normalizes contact emails before grouping users", async () => {
    await runSeed(
      csv(
        {
          housingProviderName: "Org Alpha",
          contactName: "Jane Doe",
          contactEmail: " Jane.Doe@Example.Test ",
        },
        {
          housingProviderName: "Org Beta",
          streetAddress: "2 Placeholder St",
          contactName: "Jane Doe",
          contactEmail: "jane.doe@example.test",
        },
      ),
    );

    const users = await prisma.housingProviderUser.findMany({
      select: {
        email: true,
        assignments: { select: { provider: { select: { name: true } } } },
      },
    });

    expect(users).toHaveLength(1);
    expect(users[0]?.email).toBe("jane.doe@example.test");
    expect(
      users[0]?.assignments.map((a) => a.provider.name).sort(),
    ).toStrictEqual(["Org Alpha", "Org Beta"]);
  });

  it("gives one provider a user per distinct contact email", async () => {
    await runSeed(
      csv(
        {
          housingProviderName: "Org Alpha",
          contactName: "Jane Doe",
          contactEmail: "jane.doe@example.test",
        },
        {
          housingProviderName: "Org Alpha",
          streetAddress: "2 Placeholder St",
          contactName: "John Doe",
          contactEmail: "john.doe@example.test",
        },
      ),
    );

    const users = await prisma.housingProviderUser.findMany({
      select: {
        email: true,
        assignments: { select: { provider: { select: { name: true } } } },
      },
      orderBy: { email: "asc" },
    });

    expect(users.map((u) => u.email)).toStrictEqual([
      "jane.doe@example.test",
      "john.doe@example.test",
    ]);
    expect(
      users.every(
        (u) =>
          u.assignments.length === 1 &&
          u.assignments[0]?.provider.name === "Org Alpha",
      ),
    ).toBe(true);
  });

  it("takes a user's name and phone from the row their email came from", async () => {
    await runSeed(
      csv(
        {
          housingProviderName: "Org Alpha",
          contactName: "Jane Doe",
          contactPhone: "208-555-0101",
          contactEmail: "",
        },
        {
          housingProviderName: "Org Alpha",
          streetAddress: "2 Placeholder St",
          contactName: "John Doe",
          contactPhone: "208-555-0102",
          contactEmail: "john.doe@example.test",
        },
      ),
    );

    const users = await prisma.housingProviderUser.findMany({
      select: { email: true, name: true, contactPhone: true },
    });

    expect(users).toStrictEqual([
      {
        email: "john.doe@example.test",
        name: "John Doe",
        contactPhone: "208-555-0102",
      },
    ]);
  });

  it("falls back to the provider name when the contact name is blank", async () => {
    await runSeed(
      csv({
        housingProviderName: "Org Alpha",
        contactName: "",
        contactEmail: "contact@example.test",
      }),
    );

    const user = await prisma.housingProviderUser.findFirstOrThrow({
      select: { name: true },
    });

    expect(user.name).toBe("Org Alpha");
  });

  it("creates no duplicate users or assignments when re-run", async () => {
    const content = csv(
      {
        housingProviderName: "Org Alpha",
        contactName: "Jane Doe",
        contactEmail: "jane.doe@example.test",
      },
      {
        housingProviderName: "Org Beta",
        streetAddress: "2 Placeholder St",
        contactName: "Jane Doe",
        contactEmail: "jane.doe@example.test",
      },
    );

    await runSeed(content);
    await runSeed(content);

    expect(await prisma.housingProviderUser.count()).toBe(1);
    expect(await prisma.housingProviderUserAssignment.count()).toBe(2);
    expect(await prisma.housingProvider.count()).toBe(2);
    expect(await prisma.housingProviderLocation.count()).toBe(2);
  });

  it("serializes concurrent runs without creating duplicate records", async () => {
    const content = csv({
      housingProviderName: "Org Alpha",
      contactName: "Jane Doe",
      contactEmail: "jane.doe@example.test",
    });

    await Promise.all([runSeed(content), runSeed(content)]);

    expect(await prisma.housingProvider.count()).toBe(1);
    expect(await prisma.housingProviderLocation.count()).toBe(1);
    expect(await prisma.housingProviderUser.count()).toBe(1);
    expect(await prisma.housingProviderUserAssignment.count()).toBe(1);
  });

  it("treats a renamed provider as a new one and keeps the old name", async () => {
    await runSeed(
      csv({
        housingProviderName: "Org Alpha",
        contactEmail: "contact@example.test",
      }),
    );
    await runSeed(
      csv({
        housingProviderName: "Org Alpha Renamed",
        contactEmail: "contact@example.test",
      }),
    );

    const names = await prisma.housingProvider.findMany({
      select: { name: true },
      orderBy: { name: "asc" },
    });

    expect(names).toStrictEqual([
      { name: "Org Alpha" },
      { name: "Org Alpha Renamed" },
    ]);
  });
});

describe("providers that leave the CSV", () => {
  const BOTH_ORGS = csv(
    {
      housingProviderName: "Org Alpha",
      contactEmail: "alpha@example.test",
    },
    {
      housingProviderName: "Org Beta",
      streetAddress: "2 Placeholder St",
      contactEmail: "beta@example.test",
    },
  );
  const ALPHA_ONLY = csv({
    housingProviderName: "Org Alpha",
    contactEmail: "alpha@example.test",
  });

  it("keeps a departed provider with its locations and scoped documents", async () => {
    await runSeed(BOTH_ORGS);
    const betaId = await providerIdByName("Org Beta");
    await createScopedDocument(betaId, "applications/doc-1.pdf");

    await runSeed(ALPHA_ONLY);

    expect(
      await prisma.housingProvider.findUnique({ where: { id: betaId } }),
    ).not.toBeNull();
    expect(
      await prisma.housingProviderLocation.count({
        where: { providerId: betaId },
      }),
    ).toBe(1);
    expect(
      await prisma.housingApplicationDocument.count({
        where: { scopedProviderId: betaId },
      }),
    ).toBe(1);
  });

  it("keeps the departed provider's user assignment", async () => {
    await runSeed(BOTH_ORGS);
    await runSeed(ALPHA_ONLY);

    expect(await prisma.housingProviderUserAssignment.count()).toBe(2);
  });
});

describe("hotel/shelter rows", () => {
  it("skips a hotel/shelter row on import rather than creating it", async () => {
    await runSeed(
      csv(
        {
          housingProviderName: "Org Alpha",
          contactEmail: "alpha@example.test",
        },
        {
          housingProviderName: "Org Hotel",
          streetAddress: "2 Placeholder St",
          contactEmail: "hotel@example.test",
          housingType: "Hotel",
        },
      ),
    );

    const names = await prisma.housingProvider.findMany({
      select: { name: true },
    });

    expect(names).toStrictEqual([{ name: "Org Alpha" }]);
  });

  it("keeps a provider whose location is reclassified as a hotel", async () => {
    await runSeed(
      csv(
        {
          housingProviderName: "Org Alpha",
          contactEmail: "alpha@example.test",
        },
        {
          housingProviderName: "Org Hotel",
          streetAddress: "2 Placeholder St",
          contactEmail: "hotel@example.test",
        },
      ),
    );
    const hotelId = await providerIdByName("Org Hotel");
    await prisma.housingProviderLocation.updateMany({
      where: { providerId: hotelId },
      data: { housingType: "Hotel" },
    });
    await createScopedDocument(hotelId, "applications/hotel-doc.pdf");

    // The hotel row is now skipped on import, so the organization is absent
    // from the incoming data — and left untouched.
    await runSeed(
      csv(
        {
          housingProviderName: "Org Alpha",
          contactEmail: "alpha@example.test",
        },
        {
          housingProviderName: "Org Hotel",
          streetAddress: "2 Placeholder St",
          contactEmail: "hotel@example.test",
          housingType: "Hotel",
        },
      ),
    );

    expect(
      await prisma.housingProvider.findUnique({ where: { id: hotelId } }),
    ).not.toBeNull();
    expect(
      await prisma.housingProviderLocation.count({
        where: { providerId: hotelId },
      }),
    ).toBe(1);
    expect(await prisma.housingApplicationDocument.count()).toBe(1);
  });
});

describe("locations that leave the CSV", () => {
  it("keeps a location that is no longer in the CSV", async () => {
    await runSeed(
      csv(
        {
          housingProviderName: "Org Alpha",
          contactEmail: "alpha@example.test",
        },
        {
          housingProviderName: "Org Alpha",
          streetAddress: "2 Placeholder St",
          contactEmail: "alpha@example.test",
        },
      ),
    );
    expect(await prisma.housingProviderLocation.count()).toBe(2);

    await runSeed(
      csv({
        housingProviderName: "Org Alpha",
        contactEmail: "alpha@example.test",
      }),
    );

    const addresses = await prisma.housingProviderLocation.findMany({
      select: { streetAddress: true },
      orderBy: { streetAddress: "asc" },
    });

    expect(addresses).toStrictEqual([
      { streetAddress: "1 Placeholder St" },
      { streetAddress: "2 Placeholder St" },
    ]);
  });
});
