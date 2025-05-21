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

import "./FeatureVariantSelection.scss";

import { observer } from "mobx-react-lite";
import React from "react";

import Checkbox from "../../components/Checkbox";
import { useFeatureVariants } from "../../components/StoreProvider";
import { allFeatureVariants, FeatureVariant } from "../../RootStore/types";

const FeatureVariantSelection: React.FC = () => {
  const activeFeatureVariants = useFeatureVariants();

  type Item = { name: string; active: boolean; variant?: string };

  const items: Item[] = Object.keys(allFeatureVariants).map((fv) => ({
    name: fv,
    active: fv in activeFeatureVariants,
    variant: activeFeatureVariants[fv as FeatureVariant]?.variant,
  }));

  items.sort((a, b) => (a.name > b.name ? 1 : -1));

  return (
    <div className="FeatureVariantSelection">
      <div className="FeatureVariantSelection__heading">Selected Feature Variants</div>
      <div className="FeatureVariantSelection__select-item-container">
        {items.map(({ name, active, variant }) => (
          <div className="FeatureVariantSelection__select-item" key={name}>
            <Checkbox
              value={variant || ""}
              checked={active || false}
              name={name}
            >
              {name}
            </Checkbox>
          </div>
        ))}
      </div>
    </div>
  );
};

export default observer(FeatureVariantSelection);
