// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { PersonType } from "~@meetings/app/shared/api";
import { AgencyConfig } from "~@meetings/config";

// TODO(OBT-38966): Rather than inferring staff name from the meeting's staff email,
// let's store the staff name on the meeting in the DB so that everyone sees
// the same label.
export const formatSpeakerLabel = ({
  baseLabel,
  meetingStaffEmail,
  personType,
  labels,
  jiiName,
  currentUserEmail,
  currentUserName,
}: {
  baseLabel: string;
  meetingStaffEmail: string;
  personType: PersonType;
  labels: AgencyConfig["labels"];
  jiiName: string;
  currentUserEmail?: string;
  currentUserName?: string;
}) => {
  if (baseLabel === "Staff") {
    if (meetingStaffEmail === currentUserEmail && currentUserName) {
      return currentUserName;
    }
    if (personType === "client") return labels.supervisionStaff;
    if (personType === "resident") return labels.facilitiesStaff;
  } else if (baseLabel === "Client") {
    return jiiName;
  }

  return baseLabel;
};
