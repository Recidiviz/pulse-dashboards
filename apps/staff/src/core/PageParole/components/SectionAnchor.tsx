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

import { spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components";

import { NAV_BAR_HEIGHT } from "../../NavigationLayout";

// Wraps a MainColumn section so it can be an anchor target. scroll-margin-top
// keeps the section's heading from landing underneath the fixed top nav bar
// when scrolled to.
//
// Kept out of shared.tsx (which tenant-config-owned Parole components
// import for SectionStack and friends) because NavigationLayout
// transitively imports CoreStoreProvider, which constructs a CoreStore from
// the RootStore singleton at module load time. A tenant config file (e.g.
// US_CO.ts) sits upstream of RootStore's own TenantStore setup, so pulling
// NavigationLayout in from there closes an import cycle that leaves
// CoreStoreProvider's module-level `new CoreStore(RootStore)` reading
// `RootStore` before it's assigned.
export const SectionAnchor = styled.div`
  scroll-margin-top: ${rem(NAV_BAR_HEIGHT + spacing.lg)};
`;
