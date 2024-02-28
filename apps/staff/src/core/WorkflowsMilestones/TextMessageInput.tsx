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
import { palette, typography } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import React, { ChangeEvent, useState } from "react";
import styled from "styled-components/macro";

import { Client } from "../../WorkflowsStore";

interface TextMessageInputProps {
  client: Client;
  onUpdateTextMessage: (additionalMessage: string) => void;
}

const TextMessageContainer = styled.div`
  ${typography.Sans16}
  background-color: ${palette.slate10};
  color: ${palette.slate85};
  margin-top: 2rem;
  border-radius: 8px;
  padding: 1rem;
`;

const DefaultMessage = styled.div`
  white-space: pre-line;
  padding-bottom: 1rem;
`;

const Label = styled.label`
  ${typography.Sans12}
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
`;

const TextArea = styled.textarea`
  width: 100%;
  background-color: transparent;
  border: 0;
  max-height: 100px;
  color: ${palette.slate85};

  ::placeholder {
    color: ${palette.slate60};
  }
`;

const TextMessageInput: React.FC<TextMessageInputProps> = ({
  client,
  onUpdateTextMessage,
}) => {
  const characterLimit = 1600;
  const placeholder = "Add your own message (Optional)";
  const [additionalMessage, setAdditionalMessage] = useState(
    client.milestonesPendingMessage ?? "",
  );
  const defaultMessage = client.defaultMilestonesMessage;

  const handleChange = async (event: ChangeEvent<HTMLTextAreaElement>) => {
    setAdditionalMessage(event.target.value);
  };

  const handleInputBlur = () => {
    onUpdateTextMessage(additionalMessage);
  };

  const remainingCharacters =
    characterLimit - (defaultMessage.length + additionalMessage.length);

  return (
    <TextMessageContainer>
      <Label htmlFor="textMessage">
        Text Message{" "}
        <span>
          {" "}
          {remainingCharacters}/{characterLimit}
        </span>
      </Label>

      <DefaultMessage>{defaultMessage}</DefaultMessage>
      <TextArea
        id="textMessage"
        value={additionalMessage}
        onChange={handleChange}
        onBlur={handleInputBlur}
        maxLength={characterLimit - defaultMessage.length}
        placeholder={placeholder}
      />
    </TextMessageContainer>
  );
};

export default observer(TextMessageInput);
