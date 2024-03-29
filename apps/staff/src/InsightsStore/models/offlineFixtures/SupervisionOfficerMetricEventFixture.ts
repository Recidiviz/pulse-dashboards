// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import {
  RawSupervisionOfficerMetricEvent,
  supervisionOfficerMetricEventSchema,
} from "../SupervisionOfficerMetricEvent";
import { rawClientInfoFixture } from "./ClientInfoFixture";
import { ADVERSE_METRIC_IDS, FAVORABLE_METRIC_IDS } from "./constants";

export const rawSupervisionOfficerMetricEventFixture: RawSupervisionOfficerMetricEvent[] =
  [
    {
      metricId: ADVERSE_METRIC_IDS.enum.incarceration_starts,
      eventDate: "2023-03-18",
      clientId: "707222",
      clientName: rawClientInfoFixture["hashed-707222"].clientName,
      pseudonymizedClientId:
        rawClientInfoFixture["hashed-707222"].pseudonymizedClientId,
      officerAssignmentDate: "2021-01-08",
      officerAssignmentEndDate: "2022-02-05",
      supervisionStartDate: "2021-01-08",
      supervisionEndDate: "2022-02-05",
      supervisionType: "COMMUNITY_CONFINEMENT",
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.incarceration_starts,
      eventDate: "2023-04-21",
      clientId: "205752",
      clientName: rawClientInfoFixture["hashed-205752"].clientName,
      pseudonymizedClientId:
        rawClientInfoFixture["hashed-205752"].pseudonymizedClientId,
      officerAssignmentDate: "2021-01-08",
      officerAssignmentEndDate: null,
      supervisionStartDate: "2021-01-08",
      supervisionEndDate: null,
      supervisionType: "COMMUNITY_CONFINEMENT",
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.incarceration_starts,
      eventDate: "2023-06-07",
      clientId: "792381",
      clientName: rawClientInfoFixture["hashed-792381"].clientName,
      pseudonymizedClientId:
        rawClientInfoFixture["hashed-792381"].pseudonymizedClientId,
      officerAssignmentDate: "2021-01-08",
      officerAssignmentEndDate: null,
      supervisionStartDate: "2021-01-08",
      supervisionEndDate: null,
      supervisionType: "COMMUNITY_CONFINEMENT",
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.incarceration_starts,
      eventDate: "2023-06-08",
      clientId: "869516",
      clientName: rawClientInfoFixture["hashed-869516"].clientName,
      pseudonymizedClientId:
        rawClientInfoFixture["hashed-869516"].pseudonymizedClientId,
      officerAssignmentDate: "2021-01-08",
      officerAssignmentEndDate: "2022-02-05",
      supervisionStartDate: "2021-01-08",
      supervisionEndDate: "2022-02-05",
      supervisionType: "COMMUNITY_CONFINEMENT",
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.incarceration_starts,
      eventDate: "2023-03-21",
      clientId: "170571",
      clientName: rawClientInfoFixture["hashed-170571"].clientName,
      pseudonymizedClientId:
        rawClientInfoFixture["hashed-170571"].pseudonymizedClientId,
      officerAssignmentDate: "2021-01-08",
      officerAssignmentEndDate: "2022-02-05",
      supervisionStartDate: "2021-01-08",
      supervisionEndDate: "2022-02-05",
      supervisionType: "COMMUNITY_CONFINEMENT",
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.incarceration_starts,
      eventDate: "2023-06-05",
      clientId: "461718",
      clientName: rawClientInfoFixture["hashed-461718"].clientName,
      pseudonymizedClientId:
        rawClientInfoFixture["hashed-461718"].pseudonymizedClientId,
      officerAssignmentDate: "2021-01-08",
      officerAssignmentEndDate: "2022-02-05",
      supervisionStartDate: "2021-01-08",
      supervisionEndDate: "2022-02-05",
      supervisionType: "COMMUNITY_CONFINEMENT",
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.incarceration_starts,
      eventDate: "2022-12-27",
      clientId: "837771",
      clientName: rawClientInfoFixture["hashed-837771"].clientName,
      pseudonymizedClientId:
        rawClientInfoFixture["hashed-837771"].pseudonymizedClientId,
      officerAssignmentDate: "2021-01-08",
      officerAssignmentEndDate: "2022-02-05",
      supervisionStartDate: "2021-01-08",
      supervisionEndDate: "2022-02-05",
      supervisionType: "COMMUNITY_CONFINEMENT",
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.incarceration_starts,
      eventDate: "2022-11-24",
      clientId: "617754",
      clientName: rawClientInfoFixture["hashed-617754"].clientName,
      pseudonymizedClientId:
        rawClientInfoFixture["hashed-617754"].pseudonymizedClientId,
      officerAssignmentDate: "2021-01-08",
      officerAssignmentEndDate: "2022-02-05",
      supervisionStartDate: "2021-01-08",
      supervisionEndDate: "2022-02-05",
      supervisionType: "COMMUNITY_CONFINEMENT",
    },

    {
      metricId: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
      eventDate: "2022-12-24",
      clientId: "985771",
      clientName: rawClientInfoFixture["hashed-985771"].clientName,
      pseudonymizedClientId:
        rawClientInfoFixture["hashed-985771"].pseudonymizedClientId,
      officerAssignmentDate: "2021-01-08",
      officerAssignmentEndDate: "2022-02-05",
      supervisionStartDate: "2021-01-08",
      supervisionEndDate: "2022-02-05",
      supervisionType: "COMMUNITY_CONFINEMENT",
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
      eventDate: "2022-12-21",
      clientId: "326160",
      clientName: rawClientInfoFixture["hashed-326160"].clientName,
      pseudonymizedClientId:
        rawClientInfoFixture["hashed-326160"].pseudonymizedClientId,
      officerAssignmentDate: "2021-01-08",
      officerAssignmentEndDate: "2022-02-05",
      supervisionStartDate: "2021-01-08",
      supervisionEndDate: "2022-02-05",
      supervisionType: "COMMUNITY_CONFINEMENT",
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
      eventDate: "2022-12-24",
      clientId: "931890",
      clientName: rawClientInfoFixture["hashed-931890"].clientName,
      pseudonymizedClientId:
        rawClientInfoFixture["hashed-931890"].pseudonymizedClientId,
      officerAssignmentDate: "2021-01-08",
      officerAssignmentEndDate: "2022-02-05",
      supervisionStartDate: "2021-01-08",
      supervisionEndDate: "2022-02-05",
      supervisionType: "COMMUNITY_CONFINEMENT",
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
      eventDate: "2022-10-24",
      clientId: "930441",
      clientName: rawClientInfoFixture["hashed-930441"].clientName,
      pseudonymizedClientId:
        rawClientInfoFixture["hashed-930441"].pseudonymizedClientId,
      officerAssignmentDate: "2021-01-08",
      officerAssignmentEndDate: "2022-02-05",
      supervisionStartDate: "2021-01-08",
      supervisionEndDate: "2022-02-05",
      supervisionType: "COMMUNITY_CONFINEMENT",
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
      eventDate: "2022-09-05",
      clientId: "564940",
      clientName: rawClientInfoFixture["hashed-564940"].clientName,
      pseudonymizedClientId:
        rawClientInfoFixture["hashed-564940"].pseudonymizedClientId,
      officerAssignmentDate: "2021-01-08",
      officerAssignmentEndDate: "2022-02-05",
      supervisionStartDate: "2021-01-08",
      supervisionEndDate: "2022-02-05",
      supervisionType: "COMMUNITY_CONFINEMENT",
    },

    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2022-12-07",
      clientId: "144925",
      clientName: rawClientInfoFixture["hashed-144925"].clientName,
      pseudonymizedClientId:
        rawClientInfoFixture["hashed-144925"].pseudonymizedClientId,
      officerAssignmentDate: "2021-01-08",
      officerAssignmentEndDate: "2022-02-05",
      supervisionStartDate: "2021-01-08",
      supervisionEndDate: "2022-02-05",
      supervisionType: "COMMUNITY_CONFINEMENT",
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2022-09-05",
      clientId: "283496",
      clientName: rawClientInfoFixture["hashed-283496"].clientName,
      pseudonymizedClientId:
        rawClientInfoFixture["hashed-283496"].pseudonymizedClientId,
      officerAssignmentDate: "2021-01-08",
      officerAssignmentEndDate: "2022-02-05",
      supervisionStartDate: "2021-01-08",
      supervisionEndDate: "2022-02-05",
      supervisionType: "COMMUNITY_CONFINEMENT",
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2022-09-14",
      clientId: "334531",
      clientName: rawClientInfoFixture["hashed-334531"].clientName,
      pseudonymizedClientId:
        rawClientInfoFixture["hashed-334531"].pseudonymizedClientId,
      officerAssignmentDate: "2021-01-08",
      officerAssignmentEndDate: "2022-02-05",
      supervisionStartDate: "2021-01-08",
      supervisionEndDate: "2022-02-05",
      supervisionType: "COMMUNITY_CONFINEMENT",
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2022-11-23",
      clientId: "840134",
      clientName: rawClientInfoFixture["hashed-840134"].clientName,
      pseudonymizedClientId:
        rawClientInfoFixture["hashed-840134"].pseudonymizedClientId,
      officerAssignmentDate: "2021-01-08",
      officerAssignmentEndDate: "2022-02-05",
      supervisionStartDate: "2021-01-08",
      supervisionEndDate: "2022-02-05",
      supervisionType: "COMMUNITY_CONFINEMENT",
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2022-10-17",
      clientId: "968048",
      clientName: rawClientInfoFixture["hashed-968048"].clientName,
      pseudonymizedClientId:
        rawClientInfoFixture["hashed-968048"].pseudonymizedClientId,
      officerAssignmentDate: "2021-01-08",
      officerAssignmentEndDate: "2022-02-05",
      supervisionStartDate: "2021-01-08",
      supervisionEndDate: "2022-02-05",
      supervisionType: "COMMUNITY_CONFINEMENT",
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2022-11-23",
      clientId: "413899",
      clientName: rawClientInfoFixture["hashed-413899"].clientName,
      pseudonymizedClientId:
        rawClientInfoFixture["hashed-413899"].pseudonymizedClientId,
      officerAssignmentDate: "2021-01-08",
      officerAssignmentEndDate: "2022-02-05",
      supervisionStartDate: "2021-01-08",
      supervisionEndDate: "2022-02-05",
      supervisionType: "COMMUNITY_CONFINEMENT",
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2022-12-11",
      clientId: "415630",
      clientName: rawClientInfoFixture["hashed-415630"].clientName,
      pseudonymizedClientId:
        rawClientInfoFixture["hashed-415630"].pseudonymizedClientId,
      officerAssignmentDate: "2021-01-08",
      officerAssignmentEndDate: "2022-02-05",
      supervisionStartDate: "2021-01-08",
      supervisionEndDate: "2022-02-05",
      supervisionType: "COMMUNITY_CONFINEMENT",
    },

    {
      metricId: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
      eventDate: "2023-05-06",
      clientId: "235261",
      clientName: rawClientInfoFixture["hashed-235261"].clientName,
      pseudonymizedClientId:
        rawClientInfoFixture["hashed-235261"].pseudonymizedClientId,
      officerAssignmentDate: "2021-01-08",
      officerAssignmentEndDate: "2022-02-05",
      supervisionStartDate: "2021-01-08",
      supervisionEndDate: "2022-02-05",
      supervisionType: "COMMUNITY_CONFINEMENT",
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
      eventDate: "2023-04-07",
      clientId: "531407",
      clientName: rawClientInfoFixture["hashed-531407"].clientName,
      pseudonymizedClientId:
        rawClientInfoFixture["hashed-531407"].pseudonymizedClientId,
      officerAssignmentDate: "2021-01-08",
      officerAssignmentEndDate: "2022-02-05",
      supervisionStartDate: "2021-01-08",
      supervisionEndDate: "2022-02-05",
      supervisionType: "COMMUNITY_CONFINEMENT",
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
      eventDate: "2023-02-15",
      clientId: "436502",
      clientName: rawClientInfoFixture["hashed-436502"].clientName,
      pseudonymizedClientId:
        rawClientInfoFixture["hashed-436502"].pseudonymizedClientId,
      officerAssignmentDate: "2021-01-08",
      officerAssignmentEndDate: "2022-02-05",
      supervisionStartDate: "2021-01-08",
      supervisionEndDate: "2022-02-05",
      supervisionType: "COMMUNITY_CONFINEMENT",
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
      eventDate: "2023-05-14",
      clientId: "339710",
      clientName: rawClientInfoFixture["hashed-339710"].clientName,
      pseudonymizedClientId:
        rawClientInfoFixture["hashed-339710"].pseudonymizedClientId,
      officerAssignmentDate: "2021-01-08",
      officerAssignmentEndDate: "2022-02-05",
      supervisionStartDate: "2021-01-08",
      supervisionEndDate: "2022-02-05",
      supervisionType: "COMMUNITY_CONFINEMENT",
    },

    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2023-02-07",
      clientId: "803013",
      clientName: rawClientInfoFixture["hashed-803013"].clientName,
      pseudonymizedClientId:
        rawClientInfoFixture["hashed-803013"].pseudonymizedClientId,
      officerAssignmentDate: "2021-01-08",
      officerAssignmentEndDate: "2022-02-05",
      supervisionStartDate: "2021-01-08",
      supervisionEndDate: "2022-02-05",
      supervisionType: "COMMUNITY_CONFINEMENT",
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2023-06-24",
      clientId: "470308",
      clientName: rawClientInfoFixture["hashed-470308"].clientName,
      pseudonymizedClientId:
        rawClientInfoFixture["hashed-470308"].pseudonymizedClientId,
      officerAssignmentDate: "2021-01-08",
      officerAssignmentEndDate: "2022-02-05",
      supervisionStartDate: "2021-01-08",
      supervisionEndDate: "2022-02-05",
      supervisionType: "COMMUNITY_CONFINEMENT",
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2023-01-18",
      clientId: "582059",
      clientName: rawClientInfoFixture["hashed-582059"].clientName,
      pseudonymizedClientId:
        rawClientInfoFixture["hashed-582059"].pseudonymizedClientId,
      officerAssignmentDate: "2021-01-08",
      officerAssignmentEndDate: "2022-02-05",
      supervisionStartDate: "2021-01-08",
      supervisionEndDate: "2022-02-05",
      supervisionType: "COMMUNITY_CONFINEMENT",
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2023-01-06",
      clientId: "374673",
      clientName: rawClientInfoFixture["hashed-374673"].clientName,
      pseudonymizedClientId:
        rawClientInfoFixture["hashed-374673"].pseudonymizedClientId,
      officerAssignmentDate: "2021-01-08",
      officerAssignmentEndDate: "2022-02-05",
      supervisionStartDate: "2021-01-08",
      supervisionEndDate: "2022-02-05",
      supervisionType: "COMMUNITY_CONFINEMENT",
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2023-04-25",
      clientId: "128785",
      clientName: rawClientInfoFixture["hashed-128785"].clientName,
      pseudonymizedClientId:
        rawClientInfoFixture["hashed-128785"].pseudonymizedClientId,
      officerAssignmentDate: "2021-01-08",
      officerAssignmentEndDate: "2022-02-05",
      supervisionStartDate: "2021-01-08",
      supervisionEndDate: "2022-02-05",
      supervisionType: "COMMUNITY_CONFINEMENT",
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2023-01-18",
      clientId: "914408",
      clientName: rawClientInfoFixture["hashed-914408"].clientName,
      pseudonymizedClientId:
        rawClientInfoFixture["hashed-914408"].pseudonymizedClientId,
      officerAssignmentDate: "2021-01-08",
      officerAssignmentEndDate: "2022-02-05",
      supervisionStartDate: "2021-01-08",
      supervisionEndDate: "2022-02-05",
      supervisionType: "COMMUNITY_CONFINEMENT",
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2023-03-20",
      clientId: "504894",
      clientName: rawClientInfoFixture["hashed-504894"].clientName,
      pseudonymizedClientId:
        rawClientInfoFixture["hashed-504894"].pseudonymizedClientId,
      officerAssignmentDate: "2021-01-08",
      officerAssignmentEndDate: "2022-02-05",
      supervisionStartDate: "2021-01-08",
      supervisionEndDate: "2022-02-05",
      supervisionType: "COMMUNITY_CONFINEMENT",
    },

    {
      metricId: FAVORABLE_METRIC_IDS.enum.program_starts,
      eventDate: null,
      clientId: "803013",
      clientName: rawClientInfoFixture["hashed-803013"].clientName,
      pseudonymizedClientId:
        rawClientInfoFixture["hashed-803013"].pseudonymizedClientId,
      officerAssignmentDate: "2021-01-08",
      officerAssignmentEndDate: "2022-02-05",
      supervisionStartDate: "2021-01-08",
      supervisionEndDate: "2022-02-05",
      supervisionType: "COMMUNITY_CONFINEMENT",
    },
    {
      metricId: FAVORABLE_METRIC_IDS.enum.program_starts,
      eventDate: null,
      clientId: "470308",
      clientName: rawClientInfoFixture["hashed-470308"].clientName,
      pseudonymizedClientId:
        rawClientInfoFixture["hashed-470308"].pseudonymizedClientId,
      officerAssignmentDate: "2021-01-08",
      officerAssignmentEndDate: "2022-02-05",
      supervisionStartDate: "2021-01-08",
      supervisionEndDate: "2022-02-05",
      supervisionType: "COMMUNITY_CONFINEMENT",
    },
    {
      metricId: FAVORABLE_METRIC_IDS.enum.program_starts,
      eventDate: null,
      clientId: "582059",
      clientName: rawClientInfoFixture["hashed-582059"].clientName,
      pseudonymizedClientId:
        rawClientInfoFixture["hashed-582059"].pseudonymizedClientId,
      officerAssignmentDate: "2021-01-08",
      officerAssignmentEndDate: "2022-02-05",
      supervisionStartDate: "2021-01-08",
      supervisionEndDate: "2022-02-05",
      supervisionType: "COMMUNITY_CONFINEMENT",
    },
    {
      metricId: FAVORABLE_METRIC_IDS.enum.program_starts,
      eventDate: null,
      clientId: "374673",
      clientName: rawClientInfoFixture["hashed-374673"].clientName,
      pseudonymizedClientId:
        rawClientInfoFixture["hashed-374673"].pseudonymizedClientId,
      officerAssignmentDate: "2021-01-08",
      officerAssignmentEndDate: "2022-02-05",
      supervisionStartDate: "2021-01-08",
      supervisionEndDate: "2022-02-05",
      supervisionType: "COMMUNITY_CONFINEMENT",
    },
    {
      metricId: FAVORABLE_METRIC_IDS.enum.program_starts,
      eventDate: null,
      clientId: "128785",
      clientName: rawClientInfoFixture["hashed-128785"].clientName,
      pseudonymizedClientId:
        rawClientInfoFixture["hashed-128785"].pseudonymizedClientId,
      officerAssignmentDate: "2021-01-08",
      officerAssignmentEndDate: "2022-02-05",
      supervisionStartDate: "2021-01-08",
      supervisionEndDate: "2022-02-05",
      supervisionType: "COMMUNITY_CONFINEMENT",
    },
    {
      metricId: FAVORABLE_METRIC_IDS.enum.program_starts,
      eventDate: null,
      clientId: "914408",
      clientName: rawClientInfoFixture["hashed-914408"].clientName,
      pseudonymizedClientId:
        rawClientInfoFixture["hashed-914408"].pseudonymizedClientId,
      officerAssignmentDate: "2021-01-08",
      officerAssignmentEndDate: "2022-02-05",
      supervisionStartDate: "2021-01-08",
      supervisionEndDate: "2022-02-05",
      supervisionType: "COMMUNITY_CONFINEMENT",
    },
    {
      metricId: FAVORABLE_METRIC_IDS.enum.program_starts,
      eventDate: null,
      clientId: "504894",
      clientName: rawClientInfoFixture["hashed-504894"].clientName,
      pseudonymizedClientId:
        rawClientInfoFixture["hashed-504894"].pseudonymizedClientId,
      officerAssignmentDate: "2021-01-08",
      officerAssignmentEndDate: "2022-02-05",
      supervisionStartDate: "2021-01-08",
      supervisionEndDate: "2022-02-05",
      supervisionType: "COMMUNITY_CONFINEMENT",
    },
  ];

export const supervisionOfficerMetricEventFixture =
  rawSupervisionOfficerMetricEventFixture.map((b) =>
    supervisionOfficerMetricEventSchema.parse(b),
  );
