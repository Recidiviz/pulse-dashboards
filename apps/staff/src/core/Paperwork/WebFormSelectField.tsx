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

import "@rmwc/select/styles";

import { MDCSelectFoundation } from "@material/select";
import {
  Select,
  SelectHelperTextProps,
  SelectHTMLProps,
  SelectProps,
} from "@rmwc/select";
import { observer } from "mobx-react-lite";
import * as React from "react";
import { useRef } from "react";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import { useOpportunityFormContext } from "./OpportunityFormContext";
import { useReactiveInput } from "./utils";

const ThemeContainer = styled.div`
  --mdc-typography-subtitle1-font-family: "Public Sans";
  --mdc-typography-caption-font-family: "Public Sans";
  --mdc-shape-small: 0;
  --mdc-theme-primary: ${palette.signal.links};

  & .mdc-select--focused:not(.mdc-select--disabled) .mdc-floating-label {
    color: ${palette.signal.links};
  }

  > label {
    width: 100%;
  }
`;

type BaseProps = SelectProps & SelectHTMLProps;

export interface WebFormSelectFieldProps extends BaseProps {
  name: string;
}

const WebFormSelectField: React.FC<WebFormSelectFieldProps> = ({
  name,
  ...props
}) => {
  const opportunityForm = useOpportunityFormContext();
  const foundationRef = useRef<MDCSelectFoundation>(null);

  const [value, onChange] = useReactiveInput<HTMLSelectElement>(
    name,
    opportunityForm,
  );

  let { persistent, validationMsg = false } = (props.helpText ||
    {}) as SelectHelperTextProps;

  if (foundationRef.current && !foundationRef.current.isValid()) {
    validationMsg = true;
    persistent = true;
  }

  return (
    <ThemeContainer>
      <Select
        {...props}
        helpText={{ validationMsg, persistent }}
        value={value}
        onChange={onChange}
        className="fs-exclude"
      />
    </ThemeContainer>
  );
};

export default observer(WebFormSelectField);
