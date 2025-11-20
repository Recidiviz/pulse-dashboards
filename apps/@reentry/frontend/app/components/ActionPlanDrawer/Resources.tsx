// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { FormControl, MenuItem } from "@mui/material";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import { useEffect, useState } from "react";

import { Action } from "~@reentry/frontend/types";

const ResourceAction = ({ action, _idx }: { action: Action; _idx: number }) => {
  const [internalAction, setInternalAction] = useState<null | Action>(null);
  useEffect(() => {
    setInternalAction(action);
  }, [action]);

  const handleChange = (event: SelectChangeEvent) => {
    if (internalAction) {
      setInternalAction({
        ...internalAction,
        value: event.target.value as string,
      });
    }
  };
  return (
    internalAction && (
      <div
        key={`resources-action-${_idx}`}
        className="flex flex-row justify-between items-center my-5"
      >
        <div>
          <span className="font-bold">{internalAction.title}</span>
          <p className="font-light">{internalAction.subtitle}</p>
        </div>
        <div>
          <FormControl sx={{ m: 1, minWidth: 120 }}>
            <Select
              inputProps={{ "aria-label": "Without label" }}
              sx={{ borderRadius: "20px", height: "35px", color: "#7c7c7c" }}
              value={internalAction.value}
              onChange={handleChange}
            >
              <MenuItem value="Action">
                <em>Action</em>
              </MenuItem>
              {internalAction.options.map((option, _optionidx) => (
                <MenuItem
                  key={`resources-action-option-${_idx}-${_optionidx}`}
                  value={option.key}
                >
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      </div>
    )
  );
};

export const Resources = ({ actions }: { actions: Action[] }) => {
  return actions.map((action, _idx) => (
    <ResourceAction
      key={`resource-action-${_idx}`}
      action={action}
      _idx={_idx}
    />
  ));
};
