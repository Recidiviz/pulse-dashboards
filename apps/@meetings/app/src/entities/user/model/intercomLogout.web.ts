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

import { shutdown } from "@intercom/messenger-js-sdk";

// Initializing Intercom for a user leaves their conversation cached in this
// browser's local storage/cookies. Without an explicit shutdown, a second
// user signing in on the same device would keep seeing the first user's
// conversation until Intercom is re-booted with new identity, which by
// itself doesn't clear what's already cached client-side.
export function logoutIntercom() {
  shutdown();
}
