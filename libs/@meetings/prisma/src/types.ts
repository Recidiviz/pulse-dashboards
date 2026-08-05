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

import type { SyncPrerecordedResponse } from "@deepgram/sdk";
import type { Transcript } from "assemblyai";

import type { Client, Resident } from "~@meetings/prisma/client";
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace PrismaJson {
    // Define a type for a user's profile information.
    type TranscriptType = Transcript | SyncPrerecordedResponse;
    type StaffFeedback = {
      whatYouDidWell: string[];
      growthOpportunities: string[];
    };
    type CNIField = {
      fieldValue: string; // e.g. "employed"
      quotes: string[]; // Supporting quotes/citations for this field
      lastVerifiedDate: string; // The most recent date of a quote that supported this field
    };
    type CNIEmploymentFields = {
      primaryStatus: CNIField;
      searchStatus: CNIField;

      employers: Array<
        Partial<{
          jobTitle: CNIField;
          employerName: CNIField;
          employerLocation: CNIField;
          payRateAmount: CNIField;
          employmentType: CNIField;
        }>
      >;
    };
    type CNIHousingFields = Partial<{
      housedType: CNIField;
      dependentHousingType: CNIField;
      temporaryHousingName: CNIField;
      temporaryHousingType: CNIField;
      unhousedLocation: CNIField;
      address: CNIField;
    }> & { primaryStatus: CNIField };
    type CNIFields = CNIEmploymentFields | CNIHousingFields;

    type CNIRunIDs = Record<string, string>;
  }
}

// This file must be a module, so we include an empty export.
export {};

export type Person = Client | Resident;
