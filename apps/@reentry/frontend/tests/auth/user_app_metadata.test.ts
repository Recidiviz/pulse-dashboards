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

import { hasCPAPermission } from "~@reentry/frontend/lib/auth/permissions";

describe('hasCPAPermission', () => {
  it('returns true when user has explicit CPA permission', () => {
    const metadata = { stateCode: 'US_ID', userHash: 'hash', routes: { cpa: true } };
    expect(hasCPAPermission(metadata)).toBe(true);
  });

  it('returns false when metadata is not defined', () => {
    const metadata = undefined;
    expect(hasCPAPermission(metadata)).toBe(false);
  });

  it('returns false when routes is not defined', () => {
    const metadata = { stateCode: 'US_ID', userHash: 'hash'};
    expect(hasCPAPermission(metadata)).toBe(false);
  });

  it('returns false when cpa route is not defined', () => {
    const metadata = { stateCode: 'US_ID', userHash: 'hash', routes: {}};
    expect(hasCPAPermission(metadata)).toBe(false);
  });

  it('returns false when cpa route is false', () => {
    const metadata = { stateCode: 'US_ID', userHash: 'hash', routes: { cpa: false }};
    expect(hasCPAPermission(metadata)).toBe(false);
  });

});
