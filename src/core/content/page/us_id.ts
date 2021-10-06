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

import { StateSpecificPageCopy } from "../types";

const content: StateSpecificPageCopy = {
  prison: {
    summary:
      "This chart includes individuals who are admitted to IDOC facilities and CAPP, including termers, riders, parole violators, and people held in county jails under IDOC jurisdiction.",
    methodology:
      "These charts include individuals who are admitted to state facilities, including termers, riders, parole violators, and people held in county jails under state jurisdiction.\n\n- **“Termers”**: Blah blah\n- **“Riders”**: \n- **“Parole Violators”**: \n- **People in CAPP**: Blah blah\n- **People in paid county jail beds**: For the historical total incarcerated population we use the movements file to exclude people who have entered County Jails in unpaid beds. Currently, any movement period listed with the fac_cd + lu_cd code in the list ‘RTSX’, ‘RTUT’, ‘CJVS’, ‘CJCT’ is not counted until a subsequent movement is recorded without any of those codes. The county jails population puts the ingested actuals within 1% of IDOC’s historical monthly average total population validated for 2019-2020. More work can be done to incorporate additional logic using the ofndr_loc_hst table in the future, but that table covers a much smaller subset of the unpaid",
  },
  supervision: {
    summary:
      "This charts includes all individuals that are currently on probation and/or parole, including those in the Limited Supervision Unit.",
    methodology:
      "This charts includes all individuals that are currently on probation and/or parole, including those in the Limited Supervision Unit.\n\n- **People on parole:**\n- **People on probation:**\n- **People in the Limited Supervision Unit?**\n- **People in Connection and Intervention Stations?:**",
  },
  supervisionToPrison: {
    summary:
      "This chart includes people who have been incarcerated in an IDOC facility because their parole or probation was revoked. Revocations are counted when the person was admitted to a facility, not when the violation occurred.",
    methodology: "Supervision to prison page methodology copy",
  },
  supervisionToLiberty: {
    summary:
      "These charts show people who were discharged from supervision positively or if their supervision period expired. Individuals are counted in their original month of projected completion, even if terminated earlier.",
    methodology: "Supervision to liberty page methodology copy",
  },
};

export default content;
