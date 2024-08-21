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

import { observer } from "mobx-react-lite";
import React from "react";

import { Hydratable, Hydrator } from "~hydration-utils";

import { ErrorMessage } from "../components/StatusMessage";

type ModelHydratorProps = {
  children: React.ReactElement;
  model: Hydratable;
  className?: string;
};

/**
 * Observes the provided model and only renders `children` if it is hydrated;
 * otherwise renders a loading state. Also initiates hydration of the model
 * if it is not already pending.
 */
function ModelHydrator({
  children,
  model: hydratable,
  className,
}: ModelHydratorProps): React.ReactElement {
  return (
    <Hydrator
      {...{ children, hydratable, className }}
      failed={<ErrorMessage />}
    />
  );
}

export default observer(ModelHydrator);
