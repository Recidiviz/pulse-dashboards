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

import { dateToTimestamp } from "../utils";

const UPDATE_RECORD = {
  by: "foo",
  date: dateToTimestamp("2022-07-15"),
};

export const VIEWED_UPDATE = {
  lastViewed: UPDATE_RECORD,
};

export const INCOMPLETE_FORM_UPDATE = {
  referralForm: { updated: UPDATE_RECORD },
};

export const DENIED_UPDATE = {
  denial: { reasons: ["ABC"], updated: UPDATE_RECORD },
};

export const SUBMITTED_UPDATE = {
  submitted: { update: UPDATE_RECORD },
};

export const COMPLETED_UPDATE = {
  completed: { update: UPDATE_RECORD },
};
