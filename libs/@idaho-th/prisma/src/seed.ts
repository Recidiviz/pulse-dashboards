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

import { Storage } from "@google-cloud/storage";

import { PrismaClient } from "~@idaho-th/prisma/client";
import { AcceptedGender } from "~@idaho-th/shared";

import { getPrismaClientForStateCode } from "./utils";

const SEED_LOCK_KEY = "idaho-th:housing-provider-seed";
const SEED_TRANSACTION_TIMEOUT_MS = 5 * 60 * 1000;

const COL = {
  name: 0,
  district: 1,
  housingType: 2,
  populationsServed: 3,
  menAccepted: 4,
  womenAccepted: 5,
  ridersAccepted: 6,
  sexOffendersAccepted: 7,
  violenceHistoryAccepted: 8,
  faithBasedProvider: 9,
  address: 10,
  city: 11,
  zip: 12,
  contactName: 13,
  contactPhone: 14,
  contactEmail: 15,
  businessMailingName: 16,
  businessMailingAddress: 17,
  businessMailingCity: 18,
  businessMailingState: 19,
  businessMailingZip: 20,
  addressUsedForPPInvestigation: 21,
} as const;
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}
function parseBoolean(value: string): boolean {
  return value.toLowerCase() === "yes";
}
function nullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
function nullableEmail(value: string): string | null {
  return nullable(value)?.toLowerCase() ?? null;
}
// Hotel/shelter housing type values to skip on import (matched case-insensitively).
// Values must be lowercase here because isHotelShelterType lowercases before lookup.
const HOTEL_SHELTER_TYPES = new Set(["hotel", "shelter"]);
function isHotelShelterType(housingType: string | null): boolean {
  return (
    housingType !== null &&
    HOTEL_SHELTER_TYPES.has(housingType.toLowerCase().trim())
  );
}
// Stable composite key for matching CSV rows against existing DB locations.
// HousingProviderLocation has no @unique constraint, so we derive identity
// from address fields.
function locationKey(
  streetAddress: string,
  city: string,
  zip: string,
  district: string,
): string {
  return `${streetAddress}|${city}|${zip}|${district}`;
}
function buildLocation(fields: string[]) {
  const menAccepted = parseBoolean(fields[COL.menAccepted] ?? "");
  const womenAccepted = parseBoolean(fields[COL.womenAccepted] ?? "");
  let acceptedGenders: AcceptedGender[] = [];
  if (menAccepted && womenAccepted) {
    acceptedGenders = ["ALL"];
  } else if (menAccepted) {
    acceptedGenders = ["MALE"];
  } else if (womenAccepted) {
    acceptedGenders = ["FEMALE"];
  }
  return {
    district: fields[COL.district]?.trim() ?? "",
    streetAddress: fields[COL.address]?.trim() ?? "",
    city: fields[COL.city]?.trim() ?? "",
    state: "ID",
    zip: fields[COL.zip]?.trim() ?? "",
    acceptedGenders,
    acceptsRiders: parseBoolean(fields[COL.ridersAccepted] ?? ""),
    acceptsSexOffenders: parseBoolean(fields[COL.sexOffendersAccepted] ?? ""),
    acceptsViolentCriminals: parseBoolean(
      fields[COL.violenceHistoryAccepted] ?? "",
    ),
    faithBased: parseBoolean(fields[COL.faithBasedProvider] ?? ""),
    housingType: nullable(fields[COL.housingType] ?? ""),
    populationsServed: nullable(fields[COL.populationsServed] ?? ""),
    addressUsedForPPInvestigation: parseBoolean(
      fields[COL.addressUsedForPPInvestigation] ?? "",
    ),
  };
}

/**
 * One CSV row: a single physical location, plus the one person listed as its
 * contact. The contact's email, name and phone are carried together on the row
 * they were read from, so a later step can never pair one person's email with
 * another person's name — the defect this shape exists to prevent.
 */
interface ProviderCsvRow {
  housingProviderName: string;
  contactEmail: string | null;
  contactName: string | null;
  contactPhone: string | null;
  fields: string[];
}

/** One person, assembled from every row in the file that carries their email. */
interface ContactRecord {
  email: string;
  /** From the first row carrying this email — never another row's contact. */
  name: string;
  /** From that same row. */
  phone: string | null;
  /** Every organization this person is listed against, anywhere in the file. */
  housingProviderNames: Set<string>;
}

/**
 * The seed's outside world. Supplying this lets a test drive the import
 * against fixture CSV content without reaching cloud storage.
 */
export interface SeedDependencies {
  prisma?: PrismaClient;
  readProviderCsv?: () => Promise<string>;
}

async function downloadProviderCsv(): Promise<string> {
  const [csvBuffer] = await new Storage()
    .bucket(process.env["IDAHO_TH_PDF_GCS_BUCKET"] ?? "")
    .file(process.env["IDAHO_TH_HOUSING_PROVIDERS_CSV_OBJECT"] ?? "")
    .download();
  return csvBuffer.toString("utf-8");
}

/**
 * Splits the CSV into the rows the import keeps, grouped by organization, and
 * the people those rows name.
 *
 * Two separate groupings on purpose: organizations group by name (one
 * HousingProvider per name, one location per row), while people group by email
 * across the *whole file*, because a shared email is the signal that one person
 * runs several organizations.
 */
function parseProviderCsv(csv: string): {
  housingProviders: Map<string, ProviderCsvRow[]>;
  contactsByEmail: Map<string, ContactRecord>;
} {
  const lines = csv.split("\n");
  // Skip the header row (index 0)
  const dataLines = lines.slice(1).filter((line) => line.trim().length > 0);

  const housingProviders = new Map<string, ProviderCsvRow[]>();
  const contactsByEmail = new Map<string, ContactRecord>();

  dataLines.forEach((line, lineIndex) => {
    const fields = parseCsvLine(line);
    const housingProviderName = nullable(fields[COL.name] ?? "");
    if (!housingProviderName) {
      console.warn(`  Line ${lineIndex + 2}: skipping row with blank name`);
      return;
    }
    // Hotel/shelter rows are dropped here, the one gate every import path goes
    // through: they contribute neither a location nor a login
    if (isHotelShelterType(nullable(fields[COL.housingType] ?? ""))) {
      return;
    }

    const row: ProviderCsvRow = {
      housingProviderName,
      contactEmail: nullableEmail(fields[COL.contactEmail] ?? ""),
      contactName: nullable(fields[COL.contactName] ?? ""),
      contactPhone: nullable(fields[COL.contactPhone] ?? ""),
      fields,
    };

    const rows = housingProviders.get(housingProviderName);
    if (rows) {
      rows.push(row);
    } else {
      housingProviders.set(housingProviderName, [row]);
    }

    if (!row.contactEmail) return;
    const existing = contactsByEmail.get(row.contactEmail);
    if (existing) {
      existing.housingProviderNames.add(housingProviderName);
      return;
    }
    contactsByEmail.set(row.contactEmail, {
      email: row.contactEmail,
      // Name and phone come from this row — the row the email came from. The
      // name is required, so a blank contact falls back to the organization.
      name: row.contactName ?? housingProviderName,
      phone: row.contactPhone,
      housingProviderNames: new Set([housingProviderName]),
    });
  });

  return { housingProviders, contactsByEmail };
}

/**
 * Imports the provider CSV. The seed only ever inserts and updates: nothing in
 * the database is deleted, including organizations, locations and hotel/shelter
 * rows that have left the CSV.
 */
export async function seed(dependencies: SeedDependencies = {}) {
  const prisma = dependencies.prisma ?? getPrismaClientForStateCode("US_ID");
  const readProviderCsv = dependencies.readProviderCsv ?? downloadProviderCsv;

  const { housingProviders, contactsByEmail } = parseProviderCsv(
    await readProviderCsv(),
  );
  if (housingProviders.size === 0) {
    throw new Error(
      "No valid records found in HousingProviders.csv — check the file path and contents",
    );
  }

  /* eslint-disable no-await-in-loop -- seed writes are intentionally serialized
   * so concurrent database operations cannot invalidate the transaction. */
  const stats = await prisma.$transaction(
    async (tx) => {
      // Cloud Run permits overlapping job executions. Serialize imports in the
      // database so two jobs cannot both observe a missing row and create it.
      // The transaction-scoped lock is released automatically on commit or
      // rollback, including when a container exits unexpectedly.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${SEED_LOCK_KEY}))`;

      // Step 1: Upsert organizations and their locations.
      //
      // HousingProvider.name is unique, so it is the organization's identity
      // key. A rename in the CSV therefore creates a second organization and
      // leaves the one under the old name in place.
      let createdProviderCount = 0;
      let updatedProviderCount = 0;
      let addedLocationCount = 0;
      const providerIdByName = new Map<string, string>();
      for (const [name, rows] of housingProviders) {
        const representative = rows[0];
        if (!representative) continue;
        // Organization-level fields only: the contact's email, name and phone
        // now live on HousingProviderUser, one row per person.
        const { fields } = representative;
        const housingProviderFields = {
          name,
          businessMailingName: nullable(fields[COL.businessMailingName] ?? ""),
          businessMailingAddress: nullable(
            fields[COL.businessMailingAddress] ?? "",
          ),
          businessMailingCity: nullable(fields[COL.businessMailingCity] ?? ""),
          businessMailingState: nullable(
            fields[COL.businessMailingState] ?? "",
          ),
          businessMailingZip: nullable(fields[COL.businessMailingZip] ?? ""),
        };
        const existingProvider = await tx.housingProvider.findUnique({
          where: { name },
          select: { id: true },
        });
        const provider = await tx.housingProvider.upsert({
          where: { name },
          create: housingProviderFields,
          update: housingProviderFields,
          select: { id: true },
        });
        providerIdByName.set(name, provider.id);
        if (existingProvider) {
          updatedProviderCount++;
        } else {
          createdProviderCount++;
        }

        // Load existing locations for this organization.
        const existingLocations = await tx.housingProviderLocation.findMany({
          where: { providerId: provider.id },
          select: {
            id: true,
            streetAddress: true,
            city: true,
            zip: true,
            district: true,
          },
        });
        // Index existing locations by composite business key.
        const existingByKey = new Map(
          existingLocations.map((loc) => [
            locationKey(loc.streetAddress, loc.city, loc.zip, loc.district),
            loc.id,
          ]),
        );
        // Derive all CSV keys before applying the location writes.
        const locationDataList = rows.map((row) => {
          const locData = buildLocation(row.fields);
          const key = locationKey(
            locData.streetAddress,
            locData.city,
            locData.zip,
            locData.district,
          );
          return { locData, key };
        });
        // Update or create each location from the CSV.
        for (const { locData, key } of locationDataList) {
          const existing = existingByKey.get(key);
          if (existing) {
            // acceptedGenders is a scalar list — update requires explicit `set`.
            const { acceptedGenders, ...restLocData } = locData;
            await tx.housingProviderLocation.update({
              where: { id: existing },
              data: {
                ...restLocData,
                acceptedGenders: { set: acceptedGenders },
              },
            });
          } else {
            const created = await tx.housingProviderLocation.create({
              data: { providerId: provider.id, ...locData },
              select: { id: true },
            });
            existingByKey.set(key, created.id);
            addedLocationCount++;
          }
        }
      }

      // Step 2: Provision one user per distinct contact email, assigned to every
      // organization that listed them.
      //
      // A shared email is not a collision — it is one person running several
      // organizations, and it produces one user with several assignments.
      // Existing users are left as they are: the portal owns a person's profile
      // once they have signed in, so a reseed must not overwrite it.
      let createdUserCount = 0;
      let createdAssignmentCount = 0;
      for (const contact of contactsByEmail.values()) {
        // Uniqueness is a raw lower("email") index, which Prisma cannot express
        // as @unique, so the lookup matches case-insensitively to agree with it.
        const existingUser = await tx.housingProviderUser.findFirst({
          where: { email: { equals: contact.email, mode: "insensitive" } },
          select: { id: true },
        });
        let userId: string;
        if (existingUser) {
          userId = existingUser.id;
        } else {
          const created = await tx.housingProviderUser.create({
            data: {
              name: contact.name,
              email: contact.email,
              contactPhone: contact.phone,
            },
            select: { id: true },
          });
          userId = created.id;
          createdUserCount++;
        }

        const providerIds = Array.from(contact.housingProviderNames)
          .map((housingProviderName) =>
            providerIdByName.get(housingProviderName),
          )
          .filter(
            (providerId): providerId is string => providerId !== undefined,
          );
        const { count } = await tx.housingProviderUserAssignment.createMany({
          data: providerIds.map((providerId) => ({
            providerUserId: userId,
            providerId,
          })),
          skipDuplicates: true,
        });
        createdAssignmentCount += count;
      }

      return {
        createdProviderCount,
        updatedProviderCount,
        createdUserCount,
        createdAssignmentCount,
        addedLocationCount,
      };
    },
    {
      maxWait: 30_000,
      timeout: SEED_TRANSACTION_TIMEOUT_MS,
    },
  );
  /* eslint-enable no-await-in-loop */

  console.log(
    `Seed complete. Providers: ${stats.createdProviderCount} created, ` +
      `${stats.updatedProviderCount} updated. ` +
      `Users: ${stats.createdUserCount} created, ${stats.createdAssignmentCount} assignment(s) created. ` +
      `New locations added: ${stats.addedLocationCount}.`,
  );
}
