// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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

import "./StateSelection.scss";

import cn from "classnames";
import { observer } from "mobx-react-lite";
import React from "react";
import { useNavigate } from "react-router-dom";

import { getStateNameForStateCode } from "../../utils/navigation";
import { useRootStore } from "../StoreProvider";

type StateSelectOption = {
  label: string;
  value: any;
};

const StateSelection: React.FC = () => {
  const navigate = useNavigate();
  const { userStore, tenantStore } = useRootStore();

  const availableStatesOptions = userStore.availableStateCodes
    .sort()
    .map((code: any) => ({
      value: code,
      label: getStateNameForStateCode(code),
    }));

  const handleOnClick = (option: StateSelectOption) => {
    tenantStore.setCurrentTenantId(option.value);
    navigate("/");
  };

  if (availableStatesOptions.length < 2) return null;

  return (
    <div className="StateSelection">
      <div className="StateSelection__heading">Select a state</div>
      <div className="StateSelection__select-item-container">
        {availableStatesOptions.map((option: StateSelectOption) => (
          <button
            type="button"
            key={option.value}
            className={cn(
              "StateSelection__select-item",
              `StateSelection__${option.value}`,
              {
                "StateSelection__select-item--selected":
                  option.value === tenantStore.currentTenantId,
              },
            )}
            onClick={() => handleOnClick(option)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default observer(StateSelection);
