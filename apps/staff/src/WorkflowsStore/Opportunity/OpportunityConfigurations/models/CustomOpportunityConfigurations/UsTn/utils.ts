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

import UserStore from "../../../../../../RootStore/UserStore";

// TODO(#9838):[US_TN][Workflows] Remove usTnDoNotMarkPendingOnDownload post-rollout
// When doing so, please add a field to state configs to disable this behavior
// state-wide in TN so that we don't need to remember to disable it for every new opportunity
export function usTnGateMarkSubmittedOnFormDownloaded(
  userStore: UserStore,
): boolean {
  const { usTnDoNotMarkPendingOnDownload } = userStore.activeFeatureVariants;
  return !usTnDoNotMarkPendingOnDownload;
}
