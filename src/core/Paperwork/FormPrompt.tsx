import { Icon, palette, spacing, typography } from "@recidiviz/design-system";
import { rem, transparentize } from "polished";
import * as React from "react";
import styled from "styled-components/macro";

const PromptElement = styled.div`
  background-color: ${transparentize(0.9, palette.signal.highlight)};
  ${typography.Sans16}

  color: white;
  border-radius: ${rem(spacing.sm)};
  width: 100%;
  margin-bottom: ${rem(spacing.md)};
  padding: ${rem(spacing.md)};
`;

export const Prompt: React.FC = ({ children }) => {
  return (
    <PromptElement className="fs-exclude">
      <Icon size={14} kind="Info" /> {children}
    </PromptElement>
  );
};
