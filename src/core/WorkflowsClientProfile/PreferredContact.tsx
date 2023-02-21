// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import {
  Dropdown,
  DropdownMenu,
  DropdownToggle,
  palette,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import styled from "styled-components/macro";

import {
  contactMethods,
  ContactMethodType,
  PersonUpdateType,
} from "../../FirestoreStore";
import { ClientProfileProps } from "./types";

const DropdownContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const ContactButton = styled(DropdownToggle).attrs({
  showCaret: true,
})`
  border: none;
  font: inherit;
  padding-top: 0;
  padding-left: 0;
  min-height: 16px;
  color: ${palette.signal.links};

  &:hover,
  &:focus,
  &:active {
    background-color: transparent;
  }
`;

const ContactOption = styled.button`
  border-radius: 8px;
  color: ${palette.pine3};
  padding: 10px 16px;
  border: none;
  background-color: transparent;
  font: inherit;
  width: 100%;
  text-align: left;

  &:hover,
  &:focus,
  &:active {
    background-color: ${palette.slate10};
  }
`;

export const PreferredContact: React.FC<ClientProfileProps> = observer(
  function PreferredContact({ client }): React.ReactElement {
    const { preferredContactMethod } = client;
    const [value, setValue] = useState(preferredContactMethod || "None");

    const handleClick = (newValue: ContactMethodType) => {
      setValue(newValue);
      client.updatePerson(
        "preferredContactMethod" as PersonUpdateType,
        newValue
      );
    };

    useEffect(() => {
      if (preferredContactMethod) setValue(preferredContactMethod);
    }, [preferredContactMethod]);

    return (
      <Dropdown>
        <ContactButton>{value}</ContactButton>
        <DropdownMenu>
          <DropdownContainer>
            {contactMethods.map((option) => {
              return (
                <ContactOption onClick={() => handleClick(option)}>
                  {option}
                </ContactOption>
              );
            })}
          </DropdownContainer>
        </DropdownMenu>
      </Dropdown>
    );
  }
);
