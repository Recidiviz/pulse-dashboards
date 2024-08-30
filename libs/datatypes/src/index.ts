// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

// =============================================================================
// Opportunities
// =============================================================================

// UsMe Exports: Includes fixtures and schema related to US-ME opportunities
// -----------------------------------------------------------------------------
export * from "./opportunities/UsMe/UsMeAnnualReclassification/fixtures";
export * from "./opportunities/UsMe/UsMeAnnualReclassification/schema";
export * from "./opportunities/UsMe/UsMeMediumTrustee/fixtures";
export * from "./opportunities/UsMe/UsMeMediumTrustee/schema";
export * from "./opportunities/UsMe/UsMeSCCP/fixtures";
export * from "./opportunities/UsMe/UsMeSCCP/schema";

// UsMi Exports: Includes fixtures and schema related to US-MI opportunities
// -----------------------------------------------------------------------------
export * from "./opportunities/UsMi/UsMiAddInPersonSecurityClassificationCommitteeReview/fixtures";
export * from "./opportunities/UsMi/UsMiAddInPersonSecurityClassificationCommitteeReview/schema";
export * from "./opportunities/UsMi/UsMiReclassificationRequest/fixtures";
export * from "./opportunities/UsMi/UsMiReclassificationRequest/schema";
export * from "./opportunities/UsMi/UsMiSecurityClassificationCommitteeReview/fixtures";
export * from "./opportunities/UsMi/UsMiSecurityClassificationCommitteeReview/schema";
export * from "./opportunities/UsMi/UsMiWardenInPersonSecurityClassificationCommitteeReview/fixtures";
export * from "./opportunities/UsMi/UsMiWardenInPersonSecurityClassificationCommitteeReview/schema";

// UsPa Exports: Includes fixtures and schema related to US-PA opportunities
// -----------------------------------------------------------------------------
export * from "./opportunities/UsPa/UsPaSpecialCircumstancesSupervision/fixtures";
export * from "./opportunities/UsPa/UsPaSpecialCircumstancesSupervision/schema";

// Utilities Exports: Common utilities for opportunities
// -----------------------------------------------------------------------------
export * from "./opportunities/utils/caseNotesSchema";
export * from "./opportunities/utils/opportunitySchemaBase";
export * from "./opportunities/utils/types";

// =============================================================================
// People
// =============================================================================

export type * from "./people/JusticeInvolvedPerson/schema";

// Resident Exports: Includes fixtures and schema related to Residents
// -----------------------------------------------------------------------------
export * from "./people/Resident/fixtures";
export * from "./people/Resident/schema";

// Staff Exports: Includes fixtures and schema related to Staff
// -----------------------------------------------------------------------------
export * from "./people/Staff/fixtures";
export * from "./people/Staff/schema";

// Utilities Exports: Common utilities for people
// -----------------------------------------------------------------------------
export * from "./people/utils/addDisplayName";
export * from "./people/utils/fullNameSchema";
export * from "./people/utils/preprocessSchemaWithCaseloadCategoryOrType";
// =============================================================================
// Config
// =============================================================================

// Config Exports: Configuration fixtures and schema
// -----------------------------------------------------------------------------
export * from "./config/InsightsConfig/fixture";
export * from "./config/InsightsConfig/schema";

// =============================================================================
// Metrics
// =============================================================================
export * from "./metrics/MetricBenchmark/fixture";
export * from "./metrics/MetricBenchmark/schema";
export * from "./metrics/MetricConfig/schema";

// Metrics Utilities Exports: Common utilities for metrics
// -----------------------------------------------------------------------------
export * from "./metrics/utils/constants";

// =============================================================================
// Utils
// =============================================================================

// General Utilities Exports: Includes common utilities for date handling, fixtures, and parsing
// -----------------------------------------------------------------------------
export * from "./utils/types";
export * from "./utils/zod";
