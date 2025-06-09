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

import { Icon, IconSVG, iconToDataURI } from "@recidiviz/design-system";
import { debounce } from "lodash";
import { reaction } from "mobx";
import { rgba } from "polished";
import { useEffect, useRef, useState } from "react";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import { PersonUpdateType } from "../../FirestoreStore";
import { Client } from "../../WorkflowsStore";

const INPUT_DELAY = 1000;

const EDIT_BACKGROUND = iconToDataURI(
  <Icon kind={IconSVG.Edit} color={palette.signal.links} />,
);

const Input = styled.input`
  border: 1px solid white;
  color: ${palette.signal.links};
  font-weight: inherit;
  padding: 5px 9px 5px 1.5em;
  margin: -5px 0 0 -5px;
  width: 100%;
  min-width: 1px;
  background-image: ${EDIT_BACKGROUND};
  background-repeat: no-repeat;
  background-position: left 4px center;
  background-size: 0.75em;
  text-overflow: ellipsis;

  &:focus {
    border: 1px solid ${rgba(palette.slate, 0.15)};
    border-radius: 4px;
  }
`;

type ReactiveInputValue = string;
type ReactiveInputReturnValue<E extends HTMLInputElement> = [
  ReactiveInputValue,
  (event: React.ChangeEvent<E>) => void,
  (event: React.FocusEvent<E>) => void,
];
function useReactiveClientInput<E extends HTMLInputElement>(
  text: string,
  client: Client,
  updateType: PersonUpdateType,
): ReactiveInputReturnValue<E> {
  /*
    Hook which integrates a controlled input component and Firestore and MobX.
    Firestore is updated two seconds after the user stops typing.
    When the MobX value is updated (via a Firestore subscription or its onChange handler),
    we update the controlled input's state value.
   */
  const fetchFromStore = () => (client?.updates?.[updateType] as string) || "";
  const [value, setValue] = useState<ReactiveInputValue>(text);

  const updateFirestoreRef = useRef(
    debounce((valueToStore: string) => {
      client.updatePerson(updateType, valueToStore);
    }, INPUT_DELAY),
  );

  const onChange = (event: React.ChangeEvent<E>) => {
    setValue(event.target.value);

    if (updateFirestoreRef.current) {
      updateFirestoreRef.current(event.target.value);
    }
  };

  const onBlur = (event: React.FocusEvent<E>) => {
    if (updateType === "preferredName" && !event.target.value) {
      setValue(client.fullName.givenNames || "Unknown");
    }
  };

  useEffect(() => {
    return reaction(
      () => fetchFromStore(),
      (newValue) => {
        setValue(newValue);
      },
      { name: `useReactiveInput(${text})` },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [value, onChange, onBlur];
}

type ClientDetailsInputProps = {
  text: string;
  client: Client;
  updateType: PersonUpdateType;
};

const ClientDetailsInput: React.FC<ClientDetailsInputProps> = ({
  text,
  client,
  updateType,
}) => {
  const [value, onChange, onBlur] = useReactiveClientInput<HTMLInputElement>(
    text,
    client,
    updateType,
  );
  return (
    <Input
      value={value}
      id={text}
      name={text}
      type="text"
      onChange={onChange}
      onBlur={onBlur}
      className="fs-exclude"
      autoComplete="off"
    />
  );
};

export default ClientDetailsInput;
