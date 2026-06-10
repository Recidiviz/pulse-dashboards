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

import { AgencyConfig } from "~@meetings/config";

import { meetingTypes, meetingTypesStyles } from "./config";

export const getMeetingTypeStyles = (type: string) => {
  const index = meetingTypes.indexOf(type);
  if (index > meetingTypesStyles.length - 1)
    return meetingTypesStyles[index % meetingTypesStyles.length];
  if (index === -1) return meetingTypesStyles[meetingTypesStyles.length - 1];
  return meetingTypesStyles[index];
};

export const getCategoryTypePlaceholder = (categoryType?: string | null) =>
  `Select ${categoryType ?? "category"}`;

export const getCategoryTypeError = (categoryType?: string | null) =>
  `Please select a ${categoryType ?? "category"} before starting the meeting.`;

export const getMeetingTypesOptions = (
  meetingTypes: AgencyConfig["meetingTypes"],
) => meetingTypes.map(({ type }) => type);

export const getMeetingTypeCategoriesOptions = (
  meetingTypes: AgencyConfig["meetingTypes"],
  meetingType: string | null,
) => meetingTypes.find(({ type }) => type === meetingType)?.categories;

export const getCategoryType = (
  meetingTypes: AgencyConfig["meetingTypes"],
  meetingType: string | null,
) =>
  meetingTypes
    .find(({ type }) => type === meetingType)
    ?.categoryType?.toLowerCase();

type ValidateAndStartParams = {
  meetingTypes: AgencyConfig["meetingTypes"];
  meetingType: string | null;
  meetingTypeCategoryValue: string | null;
  setMeetingTypeCategoryError: (categoryType?: string | null) => void;
  startCallback: () => void;
};

export const validateAndStart = (params: ValidateAndStartParams) => {
  const {
    meetingTypes,
    meetingType,
    meetingTypeCategoryValue,
    setMeetingTypeCategoryError,
    startCallback,
  } = params;
  const categoryType = getCategoryType(meetingTypes, meetingType);
  if (
    meetingTypes.find(({ type }) => type === meetingType)?.isCategoryRequired &&
    !meetingTypeCategoryValue
  ) {
    setMeetingTypeCategoryError(categoryType);
    return;
  }
  startCallback();
};
