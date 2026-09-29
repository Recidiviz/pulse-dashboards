// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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
  assigneeToConfigLabel,
  useCurrentAgencyConfig,
} from "~@meetings/app/entities/agency-config";
import { Person, PersonType } from "~@meetings/app/shared/api";
import { printHtmlDocument } from "~@meetings/app/shared/lib/print.web";

import {
  buildMeetingPrintHtml,
  PrintableMeetingDetails,
} from "./buildMeetingPrintHtml";

type Params = {
  person: Person;
  personType: PersonType;
  meetingDetails: PrintableMeetingDetails;
  meetingDate: string | null;
  time: string | null;
  duration: string | null;
};
export function usePrintMeetingDetails({
  person,
  personType,
  meetingDetails,
  meetingDate,
  time,
  duration,
}: Params) {
  const agencyConfig = useCurrentAgencyConfig();

  return () => {
    printHtmlDocument({
      title: `Meeting Notes - ${person.fullName}`,
      body: buildMeetingPrintHtml({
        person,
        meetingDetails,
        meetingDate,
        time,
        duration,
        getAssigneeLabel: (assignee) =>
          assigneeToConfigLabel(agencyConfig, assignee, personType),
      }),
    });
  };
}
