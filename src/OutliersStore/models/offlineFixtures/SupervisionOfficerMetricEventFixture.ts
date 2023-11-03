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
import { ADVERSE_METRIC_IDS } from "./constants";

export const rawSupervisionOfficerMetricEventFixture: RawSupervisionOfficerMetricEvent[] =
  [
    {
      metricId: ADVERSE_METRIC_IDS.enum.incarceration_starts,
      eventDate: "2023-03-18",
      clientId: "707222",
      clientName: rawClientInfoFixture["707222"].clientName,
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.incarceration_starts,
      eventDate: "2023-04-21",
      clientId: "205752",
      clientName: rawClientInfoFixture["205752"].clientName,
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.incarceration_starts,
      eventDate: "2023-06-07",
      clientId: "792381",
      clientName: rawClientInfoFixture["792381"].clientName,
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.incarceration_starts,
      eventDate: "2023-06-08",
      clientId: "869516",
      clientName: rawClientInfoFixture["869516"].clientName,
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.incarceration_starts,
      eventDate: "2023-03-21",
      clientId: "170571",
      clientName: rawClientInfoFixture["170571"].clientName,
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.incarceration_starts,
      eventDate: "2023-06-05",
      clientId: "461718",
      clientName: rawClientInfoFixture["461718"].clientName,
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.incarceration_starts,
      eventDate: "2022-12-27",
      clientId: "837771",
      clientName: rawClientInfoFixture["837771"].clientName,
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.incarceration_starts,
      eventDate: "2022-11-24",
      clientId: "617754",
      clientName: rawClientInfoFixture["617754"].clientName,
    },

    {
      metricId: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
      eventDate: "2022-12-24",
      clientId: "985771",
      clientName: rawClientInfoFixture["985771"].clientName,
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
      eventDate: "2022-12-21",
      clientId: "326160",
      clientName: rawClientInfoFixture["326160"].clientName,
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
      eventDate: "2022-12-24",
      clientId: "931890",
      clientName: rawClientInfoFixture["931890"].clientName,
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
      eventDate: "2022-10-24",
      clientId: "930441",
      clientName: rawClientInfoFixture["930441"].clientName,
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
      eventDate: "2022-09-05",
      clientId: "564940",
      clientName: rawClientInfoFixture["564940"].clientName,
    },

    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2022-12-07",
      clientId: "144925",
      clientName: rawClientInfoFixture["144925"].clientName,
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2022-09-05",
      clientId: "283496",
      clientName: rawClientInfoFixture["283496"].clientName,
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2022-09-14",
      clientId: "334531",
      clientName: rawClientInfoFixture["334531"].clientName,
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2022-11-23",
      clientId: "840134",
      clientName: rawClientInfoFixture["840134"].clientName,
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2022-10-17",
      clientId: "968048",
      clientName: rawClientInfoFixture["968048"].clientName,
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2022-11-23",
      clientId: "413899",
      clientName: rawClientInfoFixture["413899"].clientName,
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2022-12-11",
      clientId: "415630",
      clientName: rawClientInfoFixture["415630"].clientName,
    },

    {
      metricId: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
      eventDate: "2023-05-06",
      clientId: "235261",
      clientName: rawClientInfoFixture["235261"].clientName,
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
      eventDate: "2023-04-07",
      clientId: "531407",
      clientName: rawClientInfoFixture["531407"].clientName,
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
      eventDate: "2023-02-15",
      clientId: "436502",
      clientName: rawClientInfoFixture["436502"].clientName,
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
      eventDate: "2023-05-14",
      clientId: "339710",
      clientName: rawClientInfoFixture["339710"].clientName,
    },

    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2023-02-07",
      clientId: "803013",
      clientName: rawClientInfoFixture["803013"].clientName,
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2023-06-24",
      clientId: "470308",
      clientName: rawClientInfoFixture["470308"].clientName,
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2023-01-18",
      clientId: "582059",
      clientName: rawClientInfoFixture["582059"].clientName,
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2023-01-06",
      clientId: "374673",
      clientName: rawClientInfoFixture["374673"].clientName,
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2023-04-25",
      clientId: "128785",
      clientName: rawClientInfoFixture["128785"].clientName,
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2023-01-18",
      clientId: "914408",
      clientName: rawClientInfoFixture["914408"].clientName,
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2023-03-20",
      clientId: "504894",
      clientName: rawClientInfoFixture["504894"].clientName,
    },
  ];

export const supervisionOfficerMetricEventFixture =
  rawSupervisionOfficerMetricEventFixture.map((b) =>
    supervisionOfficerMetricEventSchema.parse(b)
  );
