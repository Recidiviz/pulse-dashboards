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

import { spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import * as React from "react";
import { MutableRefObject, useRef } from "react";
import TextareaAutosize from "react-textarea-autosize";
import styled from "styled-components/macro";

import { UsNeSupervisionDowngradeForm } from "../../WorkflowsStore/Opportunity/Forms/UsNeSupervisionDowngradeForm";
import { useOpportunityFormContext } from "../Paperwork/OpportunityFormContext";
import { useAnimatedValue, useReactiveInput } from "../Paperwork/utils";

export const Textarea = styled(TextareaAutosize)`
  width: 80%;
  background-color: #f7f7f7;
  padding: ${rem(spacing.xl)};
  border-radius: ${rem(spacing.sm)};
  font-family: monospace;
`;

const EmailPreview: React.FC = observer(function EmailPreview() {
  const name = "emailText";

  const opportunityForm =
    useOpportunityFormContext() as UsNeSupervisionDowngradeForm;

  const [value, onChange] = useReactiveInput<HTMLTextAreaElement>(
    name,
    opportunityForm,
  );

  const inputRef = useRef<HTMLTextAreaElement>(
    null,
  ) as MutableRefObject<HTMLTextAreaElement>;

  // On mount, the autosize input has its value set, which causes it to resize to fit its content. During animation,
  // we modify the element's value attribute in place which does not trigger resize.
  useAnimatedValue(inputRef, value);

  return (
    <Textarea
      ref={inputRef}
      name={name}
      value={value}
      onChange={onChange}
      className="fs-exclude"
    />
  );
});

export default EmailPreview;
