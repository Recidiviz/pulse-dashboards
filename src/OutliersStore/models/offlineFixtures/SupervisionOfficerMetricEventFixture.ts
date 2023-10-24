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
import { ADVERSE_METRIC_IDS } from "./constants";

export const rawSupervisionOfficerMetricEventFixture: RawSupervisionOfficerMetricEvent[] =
  [
    {
      metricId: ADVERSE_METRIC_IDS.enum.incarceration_starts,
      eventDate: "2023-03-18",
      clientId: "707222",
      clientName: {
        givenNames: "Gary",
        surname: "Alexander",
      },
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.incarceration_starts,
      eventDate: "2023-04-21",
      clientId: "205752",
      clientName: {
        givenNames: "Beau",
        surname: "Riley",
      },
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.incarceration_starts,
      eventDate: "2023-06-07",
      clientId: "792381",
      clientName: {
        givenNames: "Deena",
        surname: "Dunlap",
      },
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.incarceration_starts,
      eventDate: "2023-06-08",
      clientId: "869516",
      clientName: {
        givenNames: "Angelo",
        surname: "Cohen",
      },
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.incarceration_starts,
      eventDate: "2023-03-21",
      clientId: "170571",
      clientName: {
        givenNames: "Ward",
        surname: "Bradley",
      },
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.incarceration_starts,
      eventDate: "2023-06-05",
      clientId: "461718",
      clientName: {
        givenNames: "Janette",
        surname: "Sosa",
      },
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.incarceration_starts,
      eventDate: "2022-12-27",
      clientId: "837771",
      clientName: {
        givenNames: "Nora",
        surname: "Robbins",
      },
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.incarceration_starts,
      eventDate: "2022-11-24",
      clientId: "617754",
      clientName: {
        givenNames: "Jason",
        surname: "Barton",
      },
    },

    {
      metricId: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
      eventDate: "2022-12-24",
      clientId: "985771",
      clientName: {
        givenNames: "Nicholas",
        surname: "Rhodes",
      },
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
      eventDate: "2022-12-21",
      clientId: "326160",
      clientName: {
        givenNames: "Ethel",
        surname: "Leonard",
      },
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
      eventDate: "2022-12-24",
      clientId: "931890",
      clientName: {
        givenNames: "Ricardo",
        surname: "Wood",
      },
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
      eventDate: "2022-10-24",
      clientId: "930441",
      clientName: {
        givenNames: "Stanley",
        surname: "Maxwell",
      },
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
      eventDate: "2022-09-05",
      clientId: "564940",
      clientName: {
        givenNames: "Miguel",
        surname: "Haynes",
      },
    },

    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2022-12-07",
      clientId: "144925",
      clientName: {
        givenNames: "Inez",
        surname: "Griffith",
      },
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2022-09-05",
      clientId: "283496",
      clientName: {
        givenNames: "Gerald",
        surname: "Barber",
      },
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2022-09-14",
      clientId: "334531",
      clientName: {
        givenNames: "Leroy",
        surname: "Stone",
      },
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2022-11-23",
      clientId: "840134",
      clientName: {
        givenNames: "Patrick",
        surname: "Schneider",
      },
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2022-10-17",
      clientId: "968048",
      clientName: {
        givenNames: "Violet",
        surname: "Johnson",
      },
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2022-11-23",
      clientId: "413899",
      clientName: {
        givenNames: "Warren",
        surname: "Franklin",
      },
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2022-12-11",
      clientId: "415630",
      clientName: {
        givenNames: "Alta",
        surname: "Jackson",
      },
    },

    {
      metricId: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
      eventDate: "2023-05-06",
      clientId: "235261",
      clientName: {
        givenNames: "Rosie",
        surname: "Luna",
      },
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
      eventDate: "2023-04-07",
      clientId: "531407",
      clientName: {
        givenNames: "Glenn",
        surname: "Francis",
      },
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
      eventDate: "2023-02-15",
      clientId: "436502",
      clientName: {
        givenNames: "Steve",
        surname: "Schwartz",
      },
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
      eventDate: "2023-05-14",
      clientId: "339710",
      clientName: {
        givenNames: "Bertha",
        surname: "Figueroa",
      },
    },

    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2023-02-07",
      clientId: "803013",
      clientName: {
        givenNames: "Troy",
        surname: "Rodgers",
      },
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2023-06-24",
      clientId: "470308",
      clientName: {
        givenNames: "Leo",
        surname: "Marshall",
      },
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2023-01-18",
      clientId: "582059",
      clientName: {
        givenNames: "Shawn",
        surname: "Romero",
      },
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2023-01-06",
      clientId: "374673",
      clientName: {
        givenNames: "Jeremiah",
        surname: "Walsh",
      },
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2023-04-25",
      clientId: "128785",
      clientName: {
        givenNames: "Dorothy",
        surname: "Luna",
      },
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2023-01-18",
      clientId: "914408",
      clientName: {
        givenNames: "Viola",
        surname: "Schultz",
      },
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2023-03-20",
      clientId: "504894",
      clientName: {
        givenNames: "Marie",
        surname: "Hudson",
      },
    },
  ];

export const supervisionOfficerMetricEventFixture =
  rawSupervisionOfficerMetricEventFixture.map((b) =>
    supervisionOfficerMetricEventSchema.parse(b)
  );
