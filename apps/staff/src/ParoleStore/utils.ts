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

// docId is stored unprefixed (it's also the route param and fixture/API
// lookup key) -- "DOC-" is display-only text added by this formatter.
// Shared between ParoleDocketPresenter's search matching and the docId UI
// display so the two can't drift out of sync.
export const formatDocId = (docId: string) => `DOC-${docId}`;
