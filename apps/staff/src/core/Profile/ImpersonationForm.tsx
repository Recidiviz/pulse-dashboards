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

import "./Profile.scss";

import { Button } from "@recidiviz/design-system";
import React, { MutableRefObject, useRef, useState } from "react";
import styled from "styled-components/macro";

import { isOfflineMode } from "~client-env-utils";
import { palette } from "~design-system";

import { stopImpersonating } from "../../utils/impersonation";
import ImpersonationErrorModal from "./ImpersonationErrorModal";

const EmailInput = styled.input`
  display: inline-block;
  min-height: 1.1em;
  border-color: ${palette.slate10};
  border-radius: 4px;
  border-width: 1px;
  margin: 0.5rem 0;
  width: 100%;
  font-family: "Public Sans", sans-serif;
  min-height: 2rem;
  padding: 0.5rem;
`;

const ErrorMessage = styled.div`
  color: ${palette.signal.error};
  margin: 1rem 0;
`;

export const ImpersonationForm: React.FC<{
  isImpersonating: boolean;
  onSubmit: ({ email }: { email: string }) => void;
  impersonationError?: Error;
}> = ({ isImpersonating, onSubmit, impersonationError }) => {
  const [formValidationError, setFormValidationError] = useState<
    string | null
  >();

  const inputRef = useRef<HTMLInputElement>(
    null,
  ) as MutableRefObject<HTMLInputElement>;

  const setInputRef = React.useCallback(
    (inputElement: HTMLInputElement | null) => {
      if (inputElement) {
        inputRef.current = inputElement;
      }
    },
    [],
  );

  function handleEmailInput(email: string | undefined) {
    if (!email) {
      setFormValidationError("Must enter an email address");
      return;
    }

    const formattedEmail = email.trim().toLowerCase();

    setFormValidationError(null);
    onSubmit({ email: formattedEmail });
  }

  return (
    <div className="Profile__impersonation">
      <div className="Profile__impersonation__title">
        Enter e-mail address to impersonate:
      </div>
      <div className="Profile__impersonation__email">
        <EmailInput
          ref={setInputRef}
          placeholder="Enter an email to impersonate..."
          onChange={() => setFormValidationError(null)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleEmailInput(inputRef.current.value);
            }
          }}
        />
        {formValidationError && (
          <ErrorMessage>{formValidationError}</ErrorMessage>
        )}
      </div>
      <div className="Profile__impersonation__submit">
        <Button
          className="Profile__impersonation__button"
          onClick={() => handleEmailInput(inputRef.current.value)}
          disabled={isOfflineMode()}
        >
          Impersonate
        </Button>
        {isImpersonating ? (
          <Button
            className="Profile__impersonation__button__stop"
            onClick={() => stopImpersonating()}
          >
            Stop Impersonating
          </Button>
        ) : null}
      </div>
      <ImpersonationErrorModal error={impersonationError} />
    </div>
  );
};
