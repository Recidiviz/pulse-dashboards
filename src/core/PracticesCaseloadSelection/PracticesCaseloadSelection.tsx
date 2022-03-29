// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
import { palette, spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import ReactSelect, { components, MenuListComponentProps } from "react-select";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import { StaffRecord } from "../../firestore";
import { Client } from "../../PracticesStore/Client";
import { ClientListItem } from "../ClientListItem";

// This is a query limitation imposed by Firestore
const SELECTED_OFFICER_LIMIT = 10;

const Label = styled.div`
  font-style: normal;
  font-size: ${rem(13)};

  letter-spacing: -0.01em;

  color: ${palette.slate60};
`;

const ClientListEmptyState: React.FC = () => {
  return <div>No clients found. Try selecting more officers.</div>;
};

const ClientListElement = styled.div`
  margin-top: ${rem(spacing.md)};
`;

const ClientList: React.FC = observer(() => {
  const {
    practicesStore: { compliantReportingEligibleClients },
  } = useRootStore();

  const items = compliantReportingEligibleClients.map((client: Client) => (
    <ClientListItem client={client} key={client.id} />
  ));

  return (
    <ClientListElement>
      {items.length === 0 ? <ClientListEmptyState /> : items}
    </ClientListElement>
  );
});

const DisabledMessage = styled.div`
  color: ${palette.signal.notification};
  /* non-standard padding value to match library styles */
  padding: 12px;
`;

const DisabledMenuList = ({
  children,
  ...props
}: MenuListComponentProps<{ label: string; value: string }, true>) => (
  <components.MenuList {...props}>
    <DisabledMessage>
      Cannot select more than {SELECTED_OFFICER_LIMIT} officers.
    </DisabledMessage>
    {children}
  </components.MenuList>
);

const buildSelectOption = (officer: StaffRecord) => {
  return { label: officer.name, value: officer.id };
};

export const PracticesCaseloadSelection: React.FC = observer(() => {
  const { practicesStore } = useRootStore();

  const disableAdditionalSelections =
    practicesStore.selectedOfficers.length >= SELECTED_OFFICER_LIMIT;

  return (
    <>
      <Label>Officer</Label>
      <ReactSelect
        isMulti
        value={practicesStore.selectedOfficers.map(buildSelectOption)}
        options={practicesStore.availableOfficers.map(buildSelectOption)}
        onChange={(newValue) =>
          practicesStore.updateSelectedOfficers(
            newValue.map((item) => item.value)
          )
        }
        placeholder="Select an officer..."
        isOptionDisabled={() => disableAdditionalSelections}
        components={
          disableAdditionalSelections
            ? { MenuList: DisabledMenuList }
            : undefined
        }
      />

      <ClientList />
    </>
  );
});
