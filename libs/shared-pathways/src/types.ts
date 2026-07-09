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

import { Hydratable } from "~hydration-utils";

/**
 * All data comes back from the server as string values;
 * it will be up to us to cast those strings to other types as needed
 */
export type ApiData = {
  data: RawMetricData;
  metadata: Record<string, string>;
};

export type RawApiData = Record<string, ApiData>;
export type RawMetricData = Record<string, string>[];

export type Sex = "ALL" | "FEMALE" | "MALE";
export type Gender = "ALL" | "FEMALE" | "MALE" | "NON_BINARY";
export type AgeGroup =
  | "ALL"
  | "<24"
  | "25-29"
  | "30-34"
  | "35-39"
  | "40-44"
  | "45-49"
  | "50-54"
  | "55+";
export type LengthOfStayRawValue =
  | "all"
  | "unknown"
  | "months_0_3"
  | "months_3_6"
  | "months_6_9"
  | "months_9_12"
  | "months_12_15"
  | "months_15_18"
  | "months_18_21"
  | "months_21_24"
  | "months_24_36"
  | "months_36_48"
  | "months_48_60";

export type LengthOfStay =
  | "ALL"
  | "UNKNOWN"
  | "0"
  | "3"
  | "6"
  | "9"
  | "12"
  | "15"
  | "18"
  | "21"
  | "24"
  | "36"
  | "48"
  | "60";

export type SimulationCompartment = "SUPERVISION" | "INCARCERATION";
export type SupervisionType = "PAROLE" | "PROBATION" | "ALL";
export type TimePeriod = "6" | "12" | "24" | "60";
export type MonthOptions = 6 | 12 | 24 | 60;
export type TimePeriodRawValue =
  | "months_0_6"
  | "months_7_12"
  | "months_13_24"
  | "months_25_60";

export type PopulationProjectionTimeSeriesRecord = {
  totalPopulation: number;
  totalPopulationMax: number;
  totalPopulationMin: number;
  year: number;
  month: number;
  compartment: SimulationCompartment;
  legalStatus: string;
  sex: Sex;
  simulationTag: string;
};

export type PrisonPopulationSnapshotRecord = {
  count: number;
  lastUpdated: Date;
  gender: Gender;
  sex: Sex;
  ageGroup: AgeGroup;
  admissionReason: string;
  facility: string;
  lengthOfStay: LengthOfStay;
  timePeriod: TimePeriod;
  race: string;
  ethnicity: string;
  sentenceLengthMin: string;
  sentenceLengthMax: string;
  chargeCountyCode: string;
  offenseType: string;
  chargeDescription: string;
};

export type PrisonPopulationPersonLevelRecord = {
  lastUpdated: Date;
  stateId: string;
  fullName: string;
  sex: Sex;
  ageGroup: AgeGroup;
  age: string;
  admissionReason: string;
  facility: string;
  timePeriod: TimePeriod;
  race: string;
};

export type SupervisionPopulationSnapshotRecord = {
  count: number;
  lastUpdated: Date;
  sex: Sex;
  ageGroup: AgeGroup;
  supervisionType: SupervisionType;
  district: string;
  mostSevereViolation: string;
  numberOfViolations: string;
  lengthOfStay: LengthOfStay;
  supervisionLevel: string;
  race: string;
  timePeriod: TimePeriod;
  officerName: string;
  caseload: number;
};

export type LibertyPopulationSnapshotRecord = {
  count: number;
  lastUpdated: Date;
  sex: Sex;
  ageGroup: AgeGroup;
  judicialDistrict: string;
  race: string;
  priorLengthOfIncarceration: string;
  timePeriod: TimePeriod;
};

export type TimeSeriesDataRecord = {
  count: number;
  year: number;
  month: number;
  avg90day: number;
};

/* Superset of all the SnapshotRecords, but with all fields except "count" optional */
export type SnapshotDataRecord = Partial<
  PrisonPopulationSnapshotRecord &
    SupervisionPopulationSnapshotRecord &
    LibertyPopulationSnapshotRecord
> & { count: number };

export type PersonLevelDataRecord = PrisonPopulationPersonLevelRecord & {
  lastUpdated?: Date;
};

export type MetricRecord =
  | PopulationProjectionTimeSeriesRecord
  | PrisonPopulationSnapshotRecord
  | SupervisionPopulationSnapshotRecord
  | PrisonPopulationPersonLevelRecord
  | LibertyPopulationSnapshotRecord
  | TimeSeriesDataRecord
  | SnapshotDataRecord
  | PersonLevelDataRecord;

export type NewBackendMetricMetadata = {
  lastUpdated: string;
  dynamicFilterOptions: string;
};

export type NewBackendRecord<RecordType extends MetricRecord> = {
  data: RecordType[];
  metadata: NewBackendMetricMetadata;
};

export interface MethodologyContent {
  title: string;
  methodology: string;
}

export interface HydratablePathwaysMetric extends Hydratable {
  dataSeries?: PathwaysMetricRecords;
  isEmpty?: boolean;
}

export type PathwaysMetricRecords =
  | PopulationProjectionTimeSeriesRecord[]
  | PrisonPopulationSnapshotRecord[]
  | SupervisionPopulationSnapshotRecord[]
  | LibertyPopulationSnapshotRecord[]
  | PrisonPopulationPersonLevelRecord[]
  | TimeSeriesDataRecord[]
  | SnapshotDataRecord[]
  | PersonLevelDataRecord[];

export type MetricId =
  | "libertyToPrisonPopulationOverTime"
  | "libertyToPrisonPopulationByDistrict"
  | "libertyToPrisonPopulationBySex"
  | "libertyToPrisonPopulationByRace"
  | "libertyToPrisonPopulationByAgeGroup"
  | "libertyToPrisonPopulationByPriorLengthOfIncarceration"
  | "prisonPopulationOverTime"
  | "prisonFacilityPopulation"
  | "prisonPopulationByRace"
  | "prisonPopulationByAgeGroup"
  | "prisonPopulationByGender"
  | "prisonPopulationBySex"
  | "prisonPopulationByEthnicity"
  | "prisonPopulationBySentenceLengthMin"
  | "prisonPopulationBySentenceLengthMax"
  | "prisonPopulationByChargeCountyCode"
  | "prisonPopulationByOffenseType"
  | "prisonPopulationByChargeDescription"
  | "prisonPopulationByAdmissionReason"
  | "prisonPopulationByReligion"
  | "prisonPopulationByMaritalStatus"
  | "prisonPopulationByTimeAtFacility"
  | "projectedPrisonPopulationOverTime"
  | "prisonPopulationPersonLevel"
  | "prisonToSupervisionPopulationOverTime"
  | "prisonToSupervisionPopulationByAge"
  | "prisonToSupervisionPopulationByFacility"
  | "prisonToSupervisionPopulationByRace"
  | "prisonToSupervisionPopulationPersonLevel"
  | "supervisionPopulationOverTime"
  | "projectedSupervisionPopulationOverTime"
  | "supervisionPopulationByDistrict"
  | "supervisionPopulationByRace"
  | "supervisionPopulationBySupervisionLevel"
  | "supervisionToPrisonOverTime"
  | "supervisionToPrisonPopulationByDistrict"
  | "supervisionToPrisonPopulationByMostSevereViolation"
  | "supervisionToPrisonPopulationByNumberOfViolations"
  | "supervisionToPrisonPopulationByLengthOfStay"
  | "supervisionToPrisonPopulationBySupervisionLevel"
  | "supervisionToPrisonPopulationBySex"
  | "supervisionToPrisonPopulationByRace"
  | "supervisionToPrisonPopulationByOfficer"
  | "supervisionToLibertyOverTime"
  | "supervisionToLibertyPopulationByLengthOfStay"
  | "supervisionToLibertyPopulationByLocation"
  | "supervisionToLibertyPopulationBySex"
  | "supervisionToLibertyPopulationByAgeGroup"
  | "supervisionToLibertyPopulationByRace";

export type DownloadableDataset = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  label: string;
};

export type DownloadableData =
  | {
      chartDatasets: DownloadableDataset[];
      chartLabels: string[];
      chartId: string;
      dataExportLabel: string;
    }
  | undefined;

export type OrderKeys = Record<string, number>;

export const DefaultSupervisionLevelOrder: OrderKeys = {
  ELECTRONIC_MONITORING_ONLY: 1,
  LIMITED: 2,
  MINIMUM: 3,
  MEDIUM: 4,
  HIGH: 5,
  MAXIMUM: 6,
  INCARCERATED: 7,
  IN_CUSTODY: 8,
  UNASSIGNED: 9,
  UNSUPERVISED: 10,
  DIVERSION: 11,
  INTERSTATE_COMPACT: 12,
  OTHER: 13,
  ABSCONDED: 14,
  WARRANT: 15,
  ALL: 16,
  UNKNOWN: 17,
};

export const DefaultOffenseTypeOrder: OrderKeys = {
  "VIOLENT FELONY": 1,
  "OTHER COERCIVE": 2,
  "DRUG OFFENSES": 3,
  "PROPERTY AND OTHER OFFENSES": 4,
  "YOUTHFUL OFFENDER": 5,
  "JUVENILE OFFENDER": 6,
  UNKNOWN: 7,
};
