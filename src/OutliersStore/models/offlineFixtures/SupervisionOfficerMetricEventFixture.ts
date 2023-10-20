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
        given_names: "Gary",
        surname: "Alexander",
      },
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.incarceration_starts,
      eventDate: "2023-04-21",
      clientId: "205752",
      clientName: {
        given_names: "Beau",
        surname: "Riley",
      },
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.incarceration_starts,
      eventDate: "2023-06-07",
      clientId: "792381",
      clientName: {
        given_names: "Deena",
        surname: "Dunlap",
      },
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.incarceration_starts,
      eventDate: "2023-06-08",
      clientId: "869516",
      clientName: {
        given_names: "Angelo",
        surname: "Cohen",
      },
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.incarceration_starts,
      eventDate: "2023-03-21",
      clientId: "170571",
      clientName: {
        given_names: "Ward",
        surname: "Bradley",
      },
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.incarceration_starts,
      eventDate: "2023-06-05",
      clientId: "461718",
      clientName: {
        given_names: "Janette",
        surname: "Sosa",
      },
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.incarceration_starts,
      eventDate: "2022-12-27",
      clientId: "837771",
      clientName: {
        given_names: "Nora",
        surname: "Robbins",
      },
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.incarceration_starts,
      eventDate: "2022-11-24",
      clientId: "617754",
      clientName: {
        given_names: "Jason",
        surname: "Barton",
      },
    },

    {
      metricId: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
      eventDate: "2022-12-24",
      clientId: "985771",
      clientName: {
        given_names: "Nicholas",
        surname: "Rhodes",
      },
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
      eventDate: "2022-12-21",
      clientId: "326160",
      clientName: {
        given_names: "Ethel",
        surname: "Leonard",
      },
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
      eventDate: "2022-12-24",
      clientId: "931890",
      clientName: {
        given_names: "Ricardo",
        surname: "Wood",
      },
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
      eventDate: "2022-10-24",
      clientId: "930441",
      clientName: {
        given_names: "Stanley",
        surname: "Maxwell",
      },
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
      eventDate: "2022-09-05",
      clientId: "564940",
      clientName: {
        given_names: "Miguel",
        surname: "Haynes",
      },
    },

    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2022-12-07",
      clientId: "144925",
      clientName: {
        given_names: "Inez",
        surname: "Griffith",
      },
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2022-09-05",
      clientId: "283496",
      clientName: {
        given_names: "Gerald",
        surname: "Barber",
      },
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2022-09-14",
      clientId: "334531",
      clientName: {
        given_names: "Leroy",
        surname: "Stone",
      },
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2022-11-23",
      clientId: "840134",
      clientName: {
        given_names: "Patrick",
        surname: "Schneider",
      },
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2022-10-17",
      clientId: "968048",
      clientName: {
        given_names: "Violet",
        surname: "Johnson",
      },
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2022-11-23",
      clientId: "413899",
      clientName: {
        given_names: "Warren",
        surname: "Franklin",
      },
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2022-12-11",
      clientId: "415630",
      clientName: {
        given_names: "Alta",
        surname: "Jackson",
      },
    },

    {
      metricId: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
      eventDate: "2023-05-06",
      clientId: "235261",
      clientName: {
        given_names: "Rosie",
        surname: "Luna",
      },
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
      eventDate: "2023-04-07",
      clientId: "531407",
      clientName: {
        given_names: "Glenn",
        surname: "Francis",
      },
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
      eventDate: "2023-02-15",
      clientId: "436502",
      clientName: {
        given_names: "Steve",
        surname: "Schwartz",
      },
    },
    {
      metricId: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
      eventDate: "2023-05-14",
      clientId: "339710",
      clientName: {
        given_names: "Bertha",
        surname: "Figueroa",
      },
    },

    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2023-02-07",
      clientId: "803013",
      clientName: {
        given_names: "Troy",
        surname: "Rodgers",
      },
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2023-06-24",
      clientId: "470308",
      clientName: {
        given_names: "Leo",
        surname: "Marshall",
      },
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2023-01-18",
      clientId: "582059",
      clientName: {
        given_names: "Shawn",
        surname: "Romero",
      },
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2023-01-06",
      clientId: "374673",
      clientName: {
        given_names: "Jeremiah",
        surname: "Walsh",
      },
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2023-04-25",
      clientId: "128785",
      clientName: {
        given_names: "Dorothy",
        surname: "Luna",
      },
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2023-01-18",
      clientId: "914408",
      clientName: {
        given_names: "Viola",
        surname: "Schultz",
      },
    },
    {
      metricId:
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      eventDate: "2023-03-20",
      clientId: "504894",
      clientName: {
        given_names: "Marie",
        surname: "Hudson",
      },
    },
  ];

export const supervisionOfficerMetricEventFixture =
  rawSupervisionOfficerMetricEventFixture.map((b) =>
    supervisionOfficerMetricEventSchema.parse(b)
  );
