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

import { FormEvent, useState } from "react";
import styled from "styled-components";

import {
  Button,
  Dropdown,
  DropdownMenu,
  DropdownMenuItem,
  DropdownToggle,
  palette,
} from "~design-system";

import { authenticate } from "../auth";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  font-family: sans-serif;
  background-color: ${palette.marble3};
`;

const Form = styled.form`
  background: ${palette.marble1};
  padding: 2rem;
  border-radius: 8px;
  box-shadow:
    0px 15px 40px rgba(53, 83, 98, 0.3),
    inset 0px -1px 1px rgba(19, 44, 82, 0.2);
  width: 100%;
  max-width: 400px;
`;

const Title = styled.h1`
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  text-align: center;
  color: ${palette.pine2};
`;

const Field = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 500;
  color: ${palette.pine3};
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid ${palette.slate30};
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
  color: ${palette.text.normal};

  &:focus {
    outline: none;
    border-color: ${palette.signal.links};
  }
`;

const StateDropdown = styled(Dropdown)`
  width: 100%;
`;

const StateDropdownToggle = styled(DropdownToggle)`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid ${palette.slate30};
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
  background-color: ${palette.marble1};
  text-align: left;
`;

const StateDropdownMenu = styled(DropdownMenu)`
  width: 100%;
`;

const SubmitButton = styled(Button)`
  width: 100%;
  margin-top: 1rem;
`;

const ErrorMessage = styled.div`
  color: ${palette.signal.error};
  margin-top: 1rem;
  text-align: center;
`;

const STATE_OPTIONS = [
  { value: "US_ID", label: "Idaho" },
  { value: "US_UT", label: "Utah" },
];

export interface AuthData {
  clientPseudonymizedId: string;
  stateCode: string;
}

interface LoginFormProps {
  onSuccess: (data: AuthData) => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [stateCode, setStateCode] = useState("");
  const [docId, setDocId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!stateCode) {
      setError("Please select a state.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authenticate({
        stateCode,
        docId,
      });
      onSuccess({
        clientPseudonymizedId: response.clientPseudonymizedId,
        stateCode: response.stateCode,
      });
    } catch {
      // TODO: https://github.com/Recidiviz/recidiviz-data/issues/58578
      // send info to segment and/or sentry
      setError("Authentication failed. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <Form onSubmit={handleSubmit}>
        <Title>Let's Start Your Case Plan</Title>

        <Field>
          <Label id="stateCodeLabel">State</Label>
          <StateDropdown id="stateCode">
            <StateDropdownToggle showCaret aria-labelledby="stateCodeLabel">
              {stateCode
                ? STATE_OPTIONS.find((s) => s.value === stateCode)?.label
                : "Select a state"}
            </StateDropdownToggle>
            <StateDropdownMenu>
              {STATE_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setStateCode(option.value)}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </StateDropdownMenu>
          </StateDropdown>
        </Field>

        <Field>
          <Label htmlFor="docId">DOC ID</Label>
          <Input
            id="docId"
            type="text"
            value={docId}
            onChange={(e) => setDocId(e.target.value)}
            required
          />
        </Field>

        <SubmitButton type="submit" kind="primary" disabled={isLoading}>
          {isLoading ? "Logging in..." : "Login"}
        </SubmitButton>

        {error && <ErrorMessage>{error}</ErrorMessage>}
      </Form>
    </Container>
  );
}
