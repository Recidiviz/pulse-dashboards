// Copyright (C) 2022 Recidiviz, Inc.
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

import moment from "moment";

import { pluralize } from "../../../../utils";
import type {
  Client,
  EarlyTerminationDraftData,
  EarlyTerminationReferralRecord,
} from "../../../../WorkflowsStore";

const FORM_DATE_FORMAT = "MMMM Do, YYYY";

export const transform = (
  client: Client,
  data: EarlyTerminationReferralRecord
): Partial<EarlyTerminationDraftData> => {
  const {
    formInformation: {
      convictionCounty,
      judicialDistrictCode,
      criminalNumber,
      judgeName,
      priorCourtDate,
      sentenceLengthYears,
      crimeNames,
      probationExpirationDate,
      probationOfficerFullName,
    },
  } = data;

  return {
    clientName: client.displayName,
    judgeName,
    convictionCounty: convictionCounty?.replaceAll("_", " ") ?? "",
    judicialDistrictCode: judicialDistrictCode?.replaceAll("_", " ") ?? "",
    priorCourtDate: moment(priorCourtDate).format(FORM_DATE_FORMAT),
    probationExpirationDate: moment(probationExpirationDate).format(
      FORM_DATE_FORMAT
    ),
    sentenceLengthYears: pluralize(parseInt(sentenceLengthYears), "year"),
    plaintiff: "State of North Dakota",
    crimeNames: crimeNames?.join(", ") ?? "",
    probationOfficerFullName,
    criminalNumber,
  };
};
