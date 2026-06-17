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

import { useState } from "react";

import { TaskSectionFilter } from "./TaskSectionFilter";

// Required by Storybook's CSF indexer. Title is auto-derived from the file path.
export default {};

// `onChange` is a no-op in the static states; `noop` keeps the lint rule
// (`no-empty-function`) satisfied without an inline empty arrow.
const noop = (): void => undefined;

export const Unchecked = () => (
  <TaskSectionFilter label="Show Hidden" checked={false} onChange={noop} />
);

export const Checked = () => (
  <TaskSectionFilter label="Show Completed" checked onChange={noop} />
);

export const Interactive = () => {
  const [checked, setChecked] = useState(false);
  return (
    <TaskSectionFilter
      label="Show Hidden"
      checked={checked}
      onChange={setChecked}
    />
  );
};
