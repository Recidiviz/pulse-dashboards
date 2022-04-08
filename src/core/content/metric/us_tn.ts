/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2021 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 *
 */

import { StateSpecificMetricCopy } from "../types";

const content: StateSpecificMetricCopy = {
  prisonFacilityPopulation: {
    methodology:
      'The chart describes the number of people in each facility as of the date specified in the chart title. "General" includes facilities 019, 033, 047, 057, 075, 079, 082, 19C, and 47C.',
  },
  prisonToSupervisionPopulationByFacility: {
    methodology:
      'The chart describes the number of people released from prison to supervision from each facility as of the date specified in the chart title. When "Counts" is selected, the number of people released from each facility is shown. When "Rates" is selected, the percentage shows the number of people released from each facility divided by the total number of people released to supervision. "General" includes facilities 019, 033, 047, 057, 075, 079, 082, 19C, and 47C.',
  },
  supervisionPopulationByDistrict: {
    methodology:
      'The chart describes the number of people on supervision in each district as of the date specified in the chart title. "Other" includes sites KCCA, MCHR, ETHR, CACC, MCCC, CMCS, WXCN, DCCCP, SECC, SCHR, MRCP, SEHR, DECC, DCDC4, HCCC, FTHR, and UCHR.',
  },
  supervisionToPrisonPopulationByDistrict: {
    methodology:
      'The chart describes the number of people admitted to prison from each district as of the date specified in the chart title. When "Counts" is selected, the number of people in each district is shown. When "Rates" is selected, the percentage shows the number of people in each district divided by the total number of people admitted to prison. "Other" includes sites KCCA, MCHR, ETHR, CACC, MCCC, CMCS, WXCN, DCCCP, SECC, SCHR, MRCP, SEHR, DECC, DCDC4, HCCC, FTHR, and UCHR.',
  },
  supervisionToLibertyPopulationByLocation: {
    methodology:
      'The chart describes the number of people released from supervision to liberty from each district as of the date specified in the chart title. When "Counts" is selected, the number of people in each district is shown. When "Rates" is selected, the percentage shows the number of people in each district divided by the total number of people released to liberty. "Other" includes sites KCCA, MCHR, ETHR, CACC, MCCC, CMCS, WXCN, DCCCP, SECC, SCHR, MRCP, SEHR, DECC, DCDC4, HCCC, FTHR, and UCHR.',
  },
  prisonPopulationPersonLevel: {
    note:
      "The people who are in the INACTIVE facility are due to a known bug which will be fixed soon.",
  },
};

export default content;
