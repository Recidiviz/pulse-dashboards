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

import { useFeatureVariants } from "../../components/StoreProvider";
import { allFeatureVariants, FeatureVariant } from "../../RootStore/types";

export default function FeatureVariantsList() {
  const activeFeatureVariants = useFeatureVariants();

  type Item = { name: string; active: boolean; variant?: string };

  const items: Item[] = Object.keys(allFeatureVariants).map((fv) => ({
    name: fv,
    active: fv in activeFeatureVariants,
    variant: activeFeatureVariants[fv as FeatureVariant]?.variant,
  }));

  items.sort((a, b) => (a.name > b.name ? 1 : -1));

  return (
    <div>
      {items.map(({ name, active, variant }) => (
        <div key={name} style={{ opacity: active ? 1 : 0.5 }}>
          {name}
          {variant && `: ${variant}`}
        </div>
      ))}
    </div>
  );
}
