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

/**
 * Stands in for every `*.svg?react` import under test.
 *
 * `vite-plugin-svgr` is not part of the test pipeline, so without this the
 * import resolves to a URL string and React tries to create an element whose
 * tag name is a file path. Aliased in `test.alias`, so no component test has to
 * enumerate the icons its subtree happens to render. A test that needs to
 * assert on a specific icon can still `vi.mock` that one path.
 */
const SvgStub = (props: React.SVGProps<SVGSVGElement>) => (
  <svg aria-hidden {...props} />
);

export default SvgStub;
