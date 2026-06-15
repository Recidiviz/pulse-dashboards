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

import Loading from "./Loading";

// Required by Storybook's CSF indexer. Title is auto-derived from the file path.
export default {};

export const Default = () => <Loading />;

export const OnBackdrop = () => (
  <div
    style={{ width: "100%", height: "300px", background: "#f5f5f5" }}
    aria-label="Loading on a backdrop"
  >
    <Loading />
  </div>
);
