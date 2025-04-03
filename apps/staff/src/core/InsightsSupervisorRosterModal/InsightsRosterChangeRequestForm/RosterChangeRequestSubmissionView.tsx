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

import { Button } from "react-bootstrap";

import {
  Disclaimer,
  MessageContainer,
  RosterChangeRequestSubmissionViewWrapper,
  SubmitButton,
  TextArea,
} from "../styles";
import { InsightsRosterChangeRequestFormManager } from "../types";

type RosterChangeRequestSubmissionViewProps = {
  manager: InsightsRosterChangeRequestFormManager;
};

/**
 * Renders the submission view for roster change requests.
 *
 * This component provides a text area for users to enter a note for their roster change request,
 * displays a disclaimer, and renders a submit button. It integrates with a form instance to manage
 * state updates and submission.
 */
export const RosterChangeRequestSubmissionView = ({
  manager,
}: RosterChangeRequestSubmissionViewProps) => {
  const [form] = manager;
  return (
    <RosterChangeRequestSubmissionViewWrapper>
      {/* Render the text area for entering the request note. */}
      <form.Field name="requestNote" mode="value">
        {(field) => (
          <MessageContainer>
            <TextArea
              id={field.name}
              name={field.name}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder={
                'Please offer an explanation for requesting this change, such as "has reported to this supervisor since movement to new unit last week."'
              }
              value={field.state.value}
            />
          </MessageContainer>
        )}
      </form.Field>
      <Disclaimer>
        Requests may take up to 4 weeks due to DOC approval. If approved, the
        change will only update this supervisor's roster on Recidiviz, not
        TOMIS.
      </Disclaimer>
      {/* Subscribe to form state changes to conditionally enable the submit button. */}
      <form.Subscribe
        selector={(state) => [state.canSubmit, state.values.requestChangeType]}
      >
        {([canSubmit, requestChangeType]) => {
          return (
            <Button
              type="submit"
              disabled={!canSubmit}
              as={SubmitButton}
              onClick={(e) => {
                e.preventDefault();
                form.handleSubmit();
              }}
            >
              {`Request ${requestChangeType === "ADD" ? "Addition" : "Removal"}`}
            </Button>
          );
        }}
      </form.Subscribe>
    </RosterChangeRequestSubmissionViewWrapper>
  );
};
