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
// Milestones
// =============================================================================

export * from "./milestones/schema";
export * from "./milestones/types";

// =============================================================================
// Opportunities
// =============================================================================

export * from "./opportunities/OpportunityType";

// UsMe Exports: Includes fixtures and schema related to US-ME opportunities
// -----------------------------------------------------------------------------
export { usMeDenialMetadataSchema } from "./opportunities/UsMe/common";
export * from "./opportunities/UsMe/UsMeAnnualReclassification/fixtures";
export * from "./opportunities/UsMe/UsMeAnnualReclassification/schema";
export * from "./opportunities/UsMe/UsMeMediumTrustee/fixtures";
export * from "./opportunities/UsMe/UsMeMediumTrustee/schema";
export * from "./opportunities/UsMe/UsMeSCCP/fixtures";
export * from "./opportunities/UsMe/UsMeSCCP/schema";
export * from "./opportunities/UsMe/UsMeWorkRelease/fixtures";
export * from "./opportunities/UsMe/UsMeWorkRelease/schema";

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

// Client Exports: Includes utils and schema related to Clients
// -----------------------------------------------------------------------------
export * from "./people/Client/fixture";
export * from "./people/Client/schema";
export * from "./people/Client/utils";

// Resident Exports: Includes fixtures and schema related to Residents
// -----------------------------------------------------------------------------
export * from "./people/Resident/fixtures";
export * from "./people/Resident/schema";
export type * from "./people/Resident/US_MA/metadata/schema";

// Staff Exports: Includes fixtures and schema related to Staff
// -----------------------------------------------------------------------------
export * from "./people/Staff/Incarceration/Workflows/fixture";
export * from "./people/Staff/Incarceration/Workflows/schema";
export * from "./people/Staff/Supervision/Insights/SupervisionOfficer/factory/config";
export * from "./people/Staff/Supervision/Insights/SupervisionOfficer/factory/factory";
export * from "./people/Staff/Supervision/Insights/SupervisionOfficer/fixture";
export * from "./people/Staff/Supervision/Insights/SupervisionOfficer/schema";
export * from "./people/Staff/Supervision/Insights/SupervisionOfficerOutcomes/fixture";
export * from "./people/Staff/Supervision/Insights/SupervisionOfficerOutcomes/schema";
export * from "./people/Staff/Supervision/Insights/SupervisionOfficerSupervisor/factory/config";
export * from "./people/Staff/Supervision/Insights/SupervisionOfficerSupervisor/factory/factory";
export * from "./people/Staff/Supervision/Insights/SupervisionOfficerSupervisor/fixture";
export * from "./people/Staff/Supervision/Insights/SupervisionOfficerSupervisor/schema";
export * from "./people/Staff/Supervision/Workflows/fixture";
export * from "./people/Staff/Supervision/Workflows/schema";

// Utilities Exports: Common utilities for people
// -----------------------------------------------------------------------------
export * from "./people/utils/addDisplayName";
export * from "./people/utils/fullNameSchema";
export * from "./people/utils/types";

// Workflows JII Exports: Common utilities for people
// -----------------------------------------------------------------------------
export type * from "./people/WorkflowsJusticeInvolvedPerson/schema";

// =============================================================================
// Config
// =============================================================================

// Config Exports: Configuration fixtures and schema
// -----------------------------------------------------------------------------
export * from "./config/ActionStrategy/fixture";
export * from "./config/ActionStrategy/schema";
export * from "./config/ActionStrategyCopy/fixture";
export * from "./config/ActionStrategyCopy/schema";
export * from "./config/InsightsConfig/fixtures/fixture";
export * from "./config/InsightsConfig/schema";

// =============================================================================
// Metrics
// =============================================================================
export * from "./metrics/ClientEvent/fixture";
export * from "./metrics/ClientEvent/schema";
export * from "./metrics/ClientInfo/fixture";
export * from "./metrics/ClientInfo/schema";
export * from "./metrics/MetricBenchmark/fixture";
export * from "./metrics/MetricBenchmark/schema";
export * from "./metrics/MetricConfig/schema";
export * from "./metrics/SupervisionOfficerMetricEvent/fixture";
export * from "./metrics/SupervisionOfficerMetricEvent/schema";
export * from "./metrics/SupervisionOfficerMetricOutlier/fixture";
export * from "./metrics/SupervisionOfficerMetricOutlier/schema";
export * from "./metrics/SupervisionVitalsMetric/fixture";
export * from "./metrics/SupervisionVitalsMetric/schema";

// Metrics Utilities Exports: Common utilities for metrics
// -----------------------------------------------------------------------------
export * from "./metrics/utils/constants";

// =============================================================================
// Utils
// =============================================================================

// System: Types related to the system, such as the User, metadata, etc.
// -----------------------------------------------------------------------------
export * from "./system/RosterChangeRequest/fixture";
export * from "./system/RosterChangeRequest/schema";
export * from "./system/UserInfo/fixture";
export * from "./system/UserInfo/schema";

// =============================================================================
// Utils
// =============================================================================

// General Utilities Exports: Includes common utilities for date handling, fixtures, and parsing
// -----------------------------------------------------------------------------
export * from "./utils/types";
export * from "./utils/zod";
