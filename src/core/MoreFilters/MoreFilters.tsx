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
import "./MoreFilters.scss";

import { Button, Icon, IconSVG } from "@recidiviz/design-system";
import { get } from "mobx";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";

import Modal from "../../components/Modal";
import RadioGroup from "../../controls/RadioGroup";
import CheckboxGroup from "../controls/CheckboxGroup";
import { useCoreStore } from "../CoreStoreProvider";
import {
  EnabledFilters,
  FilterOption,
  PopulationFilters,
} from "../types/filters";
import { getFilterOption, getFilterOptions } from "../utils/filterOptions";

type Props = {
  filterOptions: PopulationFilters;
  enabledFilters?: EnabledFilters;
};

const MoreFilters: React.FC<Props> = ({
  filterOptions,
  enabledFilters = [],
}) => {
  const [open, setOpen] = useState(false);
  const [updatedFilters, updateFilters] = useState({});

  const { filtersStore } = useCoreStore();
  const { filters } = filtersStore;

  useEffect(() => {
    updateFilters({});
  }, [enabledFilters]);

  let activeFiltersCount = 0;

  enabledFilters.forEach((filterType) => {
    const filter = filterOptions[filterType];
    activeFiltersCount += getFilterOptions(
      get(filters, filter.type),
      filter.options
    ).filter((option) => option.value !== filter.defaultValue).length;
  });

  const onUpdateFilters = (newOptions: FilterOption[], filterType: string) => {
    updateFilters({
      ...updatedFilters,
      [filterType]: newOptions.map((o) => o.value),
    });
  };

  const onResetFilters = () => {
    filtersStore.resetFilters();
    setOpen(false);
  };

  if (enabledFilters.length < 1) return null;

  const onClickApply = () => {
    filtersStore.setFilters(updatedFilters);
    setOpen(false);
  };

  if (enabledFilters.length < 1) return null;
  return (
    <>
      <Modal
        title="More filters"
        isShowing={open}
        hide={() => setOpen(false)}
        footer={
          <>
            <button
              className="DetailsGroup__button"
              type="button"
              aria-expanded="true"
              onClick={onResetFilters}
            >
              Reset filters
            </button>
            <Button onClick={onClickApply}>Apply</Button>
          </>
        }
      >
        {enabledFilters.map((filterType) => {
          const filter = filterOptions[filterType];
          return (
            <div className="MoreFilters" key={`${filterType}`}>
              <div className="MoreFilters__header">{filter.title}</div>
              <div className="MoreFilters__content">
                {filter.isSingleSelect ? (
                  <RadioGroup
                    filter={filter}
                    defaultValue={
                      getFilterOption(
                        get(filters, filter.type)[0],
                        filter.options
                      ).value
                    }
                    onChange={onUpdateFilters}
                  />
                ) : (
                  <CheckboxGroup
                    filter={filter}
                    summingOption={filter.defaultOption}
                    onChange={onUpdateFilters}
                  />
                )}
              </div>
            </div>
          );
        })}
      </Modal>
      <button
        className="DetailsGroup__button"
        type="button"
        aria-expanded="true"
        onClick={() => setOpen(!open)}
      >
        <Icon
          className="DetailsGroup__icon MoreFilters__icon"
          kind={IconSVG.Close}
        />
        More filters {activeFiltersCount !== 0 && `(${activeFiltersCount})`}
      </button>
    </>
  );
};

export default observer(MoreFilters);
