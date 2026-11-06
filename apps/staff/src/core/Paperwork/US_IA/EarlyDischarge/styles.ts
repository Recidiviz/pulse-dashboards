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

import { spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components";

import { palette } from "~design-system";

import {
  DetailsHeading,
  DetailsSubheading,
  SecureDetailsContent,
} from "../../../WorkflowsJusticeInvolvedPersonProfile/styles";

export const StepCard = styled.section`
  background-color: ${palette.white};
  border-radius: ${rem(8)};
  padding: ${rem(spacing.lg)};
`;

export const StepLabel = styled(DetailsHeading).attrs({ as: "div" })`
  margin-top: 0;
  margin-bottom: ${rem(spacing.xs)};
`;

export const StepHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${rem(spacing.md)};
  padding-bottom: ${rem(spacing.md)};
  border-bottom: 1px solid ${palette.slate10};
`;

export const StepTitle = styled.h2`
  ${typography.Sans18}
  color: ${palette.pine1};
  margin: 0;
`;

export const StepHelpText = styled.p`
  ${typography.Sans14}
  color: ${palette.text.secondary};
  margin: ${rem(spacing.md)} 0;
`;

export const SectionHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${rem(spacing.md)};
  margin-top: ${rem(spacing.md)};
`;

export const SectionLabel = StepLabel;

export const FieldRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: ${rem(spacing.md)};
  padding: ${rem(spacing.sm)} 0;
  border-bottom: 1px solid ${palette.slate10};
`;

export const FieldLabel = styled(DetailsSubheading).attrs({ as: "div" })`
  margin-bottom: 0;
`;

export const FieldValue = styled(SecureDetailsContent).attrs({ as: "div" })`
  text-align: right;
`;
