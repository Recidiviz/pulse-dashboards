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

// One factory per Prisma model. Feature fixtures compose these; factories never
// compose fixtures. A composed fixture lives in its feature's __tests__ folder
// as <feature>.fixtures.ts until a second feature needs it, then it moves here —
// applicationWithProviders and providerUserWithOrganizations are the two that
// made that move.
export * from "./aiExtractionMetrics";
export * from "./alert";
export * from "./applicationWithProviders";
export * from "./constants";
export * from "./document";
export * from "./eligibleHousingProvider";
export * from "./homePlan";
export * from "./housingApplication";
export * from "./housingProvider";
export * from "./housingProviderUser";
export * from "./providerUserWithHousingProviders";
export * from "./thread";
export * from "./timelineEvent";
export * from "./timelineReadState";
