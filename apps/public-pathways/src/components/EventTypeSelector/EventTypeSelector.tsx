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

import { observer } from "mobx-react-lite";

import { Radio } from "~design-system";

import { EVENT_TYPE_OPTIONS, isEventType } from "../../datastores/eventTypes";
import { useRootStore } from "../StoreProvider";
import { EventTypeRadioGroup } from "./EventTypeSelector.styles";

/**
 * Chooses whether the dashboard's charts count admissions, releases, or both.
 * Only the dashboards in `DASHBOARDS_WITH_EVENT_TYPE_SELECTOR` show it.
 */
export const EventTypeSelector = observer(function EventTypeSelector() {
  const rootStore = useRootStore();
  const { eventType, analyticsStore } = rootStore;

  const handleChange = (value: string) => {
    if (!isEventType(value) || value === eventType) return;
    analyticsStore.trackEventTypeSelected({ eventType: value });
    rootStore.setEventType(value);
  };

  return (
    <EventTypeRadioGroup
      value={eventType}
      onChange={handleChange}
      orientation="horizontal"
      ariaLabel="Show admissions, releases, or both"
      name="eventType"
    >
      {EVENT_TYPE_OPTIONS.map(({ value, label }) => (
        <Radio key={value} value={value}>
          {label}
        </Radio>
      ))}
    </EventTypeRadioGroup>
  );
});
