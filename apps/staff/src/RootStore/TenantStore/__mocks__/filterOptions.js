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

import {
  ADMISSION_TYPE,
  CHARGE_CATEGORY,
  DISTRICT,
  LEVEL_1_SUPERVISION_LOCATION,
  LEVEL_2_SUPERVISION_LOCATION,
  METRIC_PERIOD_MONTHS,
  REPORTED_VIOLATIONS,
  SUPERVISION_LEVEL,
  SUPERVISION_TYPE,
  VIOLATION_TYPE,
} from "../../../lantern/utils/constants";

export default {
  TEST_TENANT: {
    [METRIC_PERIOD_MONTHS]: {
      options: Array.from({ length: 5 }).map((_, i) => ({
        label: `${METRIC_PERIOD_MONTHS}-${i}-label`,
        value: `${METRIC_PERIOD_MONTHS}-${i}`,
      })),
      defaultOption: {
        label: `${METRIC_PERIOD_MONTHS}-0-label`,
        value: `${METRIC_PERIOD_MONTHS}-0`,
      },
      defaultValue: `${METRIC_PERIOD_MONTHS}-0`,
    },
    [CHARGE_CATEGORY]: {
      options: Array.from({ length: 2 }).map((_, i) => ({
        label: `${CHARGE_CATEGORY}-${i}-label`,
        value: `${CHARGE_CATEGORY}-${i}`,
      })),
      defaultOption: {
        label: `${CHARGE_CATEGORY}-0-label`,
        value: `${CHARGE_CATEGORY}-0`,
      },
      defaultValue: `${CHARGE_CATEGORY}-0`,
      componentEnabled: true,
    },
    [REPORTED_VIOLATIONS]: {
      options: Array.from({ length: 3 }).map((_, i) => ({
        label: `${REPORTED_VIOLATIONS}-${i}-label`,
        value: `${REPORTED_VIOLATIONS}-${i}`,
      })),
      defaultOption: {
        label: `${REPORTED_VIOLATIONS}-0-label`,
        value: `${REPORTED_VIOLATIONS}-0`,
      },
      defaultValue: `${REPORTED_VIOLATIONS}-0`,
    },
    [VIOLATION_TYPE]: {
      options: Array.from({ length: 7 }).map((_, i) => ({
        key: `${VIOLATION_TYPE}-${i}-key`,
        label: `${VIOLATION_TYPE}-${i}-label`,
        type: `${VIOLATION_TYPE}-${i}-type`,
      })),
      defaultOption: {
        label: `${VIOLATION_TYPE}-0-label`,
        value: `${VIOLATION_TYPE}-0`,
      },
      defaultValue: `${VIOLATION_TYPE}-0`,
    },
    [SUPERVISION_TYPE]: {
      options: Array.from({ length: 4 }).map((_, i) => ({
        label: `${SUPERVISION_TYPE}-${i}-label`,
        value: `${SUPERVISION_TYPE}-${i}`,
      })),
      defaultOption: {
        label: `${SUPERVISION_TYPE}-0-label`,
        value: `${SUPERVISION_TYPE}-0`,
      },
      defaultValue: `${SUPERVISION_TYPE}-0`,
      componentEnabled: true,
    },
    [SUPERVISION_LEVEL]: {
      options: Array.from({ length: 4 }).map((_, i) => ({
        label: `${SUPERVISION_LEVEL}-${i}-label`,
        value: `${SUPERVISION_LEVEL}-${i}`,
      })),
      defaultOption: {
        label: `${SUPERVISION_LEVEL}-0-label`,
        value: `${SUPERVISION_LEVEL}-0`,
      },
      defaultValue: `${SUPERVISION_LEVEL}-0`,
      componentEnabled: true,
    },
    [ADMISSION_TYPE]: {
      options: Array.from({ length: 3 }).map((_, i) => ({
        label: `${ADMISSION_TYPE}-${i}-label`,
        value: `${ADMISSION_TYPE}-${i}`,
      })),
      defaultOption: {
        label: `${ADMISSION_TYPE}-0-label`,
        value: `${ADMISSION_TYPE}-0`,
      },
      defaultValue: [`${ADMISSION_TYPE}-0`],
      componentEnabled: true,
    },
    [DISTRICT]: {
      options: Array.from({ length: 1 }).map((_, i) => ({
        label: `${DISTRICT}-${i}-label`,
        value: `${DISTRICT}-${i}`,
      })),
      defaultOption: {
        label: `${DISTRICT}-0-label`,
        value: `${DISTRICT}-0`,
      },
      defaultValue: `${DISTRICT}-0`,
    },
    [LEVEL_1_SUPERVISION_LOCATION]: { defaultValue: "All" },
    [LEVEL_2_SUPERVISION_LOCATION]: { defaultValue: "All" },
  },
};
