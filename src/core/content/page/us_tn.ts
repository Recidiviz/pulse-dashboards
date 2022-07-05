/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2022 Recidiviz, Inc.
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
      "Includes people incarcerated in a TDOC prison for a felony or misdemeanor conviction. People in county jails and workhouses are not included. ",
    methodology:
      'These charts show people incarcerated in a TDOC prison for a felony or misdemeanor conviction. People in county jails are not included. The "admission reason" is determined by the original admission reason for the current sentence. As a result, movements that happened after the most recent sentence started may not be captured. For example, if someone was admitted from liberty to prison on a new court commitment for the most recent sentence, then escaped then returned during the same sentence, they will show up under the admission reason of "New court commitment."',
  },
  prisonToSupervision: {
    summary:
      "Includes people who were released from state prison facilities to supervision. People in county jails and workhouses are not included. ",
    methodology:
      "These charts show people who were released from state prison facilities to supervision. People released from county jails and workhouses are not included. ",
  },
  libertyToPrison: {
    summary:
      "Includes people who were sentenced to prison from a new court commitment. People placed in county jails and workhouses are not included.",
    methodology:
      "These charts show people who were sentenced to prison from a new court commitment. People placed in county jails and workhouses are not included.",
  },
  supervisionToPrison: {
    summary:
      "Includes people who have been incarcerated in a state prison facility because their parole or probation was revoked. People placed in county jails and workhouses are not included. Revocations are counted when the person was admitted to a facility, not when the violation occurred.",
    methodology:
      "These charts show people who have been incarcerated in a state prison facility because their parole or probation was revoked. People placed in county jails and workhouses are not included. Revocations are counted when the person was admitted to a facility, not when the violation occurred.",
  },
  supervisionToLiberty: {
    methodology:
      "These charts include events where people are released from supervision to liberty. Releases are counted on the day a person terminates supervision. All charts on this page are event-based, so if a single person has two releases during the selected time period, two events are counted on this page.",
  },
  supervision: {
    methodology: "These charts show people supervised by TDOC.",
  },
};

export default content;
