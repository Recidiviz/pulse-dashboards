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
  },
  supervision: {
    summary:
      "This charts includes all individuals that are currently on probation and/or parole, including those in the Limited Supervision Unit.",
  },
  supervisionToPrison: {
    summary:
      "This chart includes people who have been incarcerated in an IDOC facility because their parole or probation was revoked. Revocations are counted when the person was admitted to a facility, not when the violation occurred.",
  },
  supervisionToLiberty: {
    summary:
      "These charts show people who were discharged from supervision positively or if their supervision period expired. Individuals are counted in their original month of projected completion, even if terminated earlier.",
  },
};

export default content;
