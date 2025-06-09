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

import {
  Button,
  Icon,
  Sans16,
  Sans24,
  spacing,
  typography,
} from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components/macro";

import { palette } from "~design-system";

const ModalTitle = styled(Sans24)`
  color: ${palette.pine1};
  padding: ${rem(spacing.md)} ${rem(spacing.xl)};
  text-align: center;
`;

const ModalControls = styled.div`
  padding: 0 0 ${rem(spacing.sm)};
  text-align: right;
`;

const ActionButton = styled(Button).attrs({ kind: "primary", shape: "block" })`
  margin: ${rem(spacing.lg)} ${rem(spacing.xl)} ${rem(spacing.sm)};
  padding: ${rem(spacing.md)};
  flex: none;
`;

export const ModalText = styled(Sans16)`
  color: ${palette.slate80};
  margin: ${rem(spacing.sm)} 0;
`;

const ConfirmationContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  justify-content: center;
  align-items: stretch;
`;

const ConfirmationLabel = styled.dt`
  ${typography.Sans16}
  color: ${palette.slate50};
  margin-bottom: ${rem(spacing.xs)};
`;

const ConfirmationField = styled.dd.attrs({ className: "fs-exclude" })`
  ${typography.Sans16}
  color: ${palette.slate90};
`;

type DialogViewProps = {
  title: string;
  dataTestIdPrefixes?: {
    container?: string;
    submitButton?: string;
  };
  data?: {
    label: string;
    value: string | React.ReactNode;
  }[];
  onSubmit: () => void;
  children?: React.ReactNode;
  onClose?: () => void;
  isSubmitDisabled: boolean;
  submitButtonText?: string;
};

export function DialogModalControls({ onClose }: { onClose: () => void }) {
  return (
    <ModalControls>
      <Button kind="link" onClick={onClose}>
        <Icon kind="Close" size="14" color={palette.pine2} />
      </Button>
    </ModalControls>
  );
}

export function DialogView({
  title,
  dataTestIdPrefixes,
  data,
  children,
  onSubmit,
  onClose,
  isSubmitDisabled,
  submitButtonText,
}: DialogViewProps) {
  return (
    <div data-testid={dataTestIdPrefixes?.container}>
      {onClose && <DialogModalControls onClose={onClose} />}
      <ConfirmationContainer>
        <ModalTitle>{title}</ModalTitle>
        {data && (
          <dl>
            {data.map(({ label, value }) => (
              <>
                <ConfirmationLabel>{label}</ConfirmationLabel>
                <ConfirmationField>{value}</ConfirmationField>
              </>
            ))}
          </dl>
        )}
        {children}
        <ActionButton
          data-testid={dataTestIdPrefixes?.submitButton}
          disabled={isSubmitDisabled}
          onClick={onSubmit}
        >
          {submitButtonText ?? "Submit"}
        </ActionButton>
      </ConfirmationContainer>
    </div>
  );
}
