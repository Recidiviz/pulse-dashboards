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

import * as React from "react";

import { palette } from "../../styles";
import { Icon } from "../Icon";
import {
  StepDot,
  StepLabel,
  StepperWrapper,
  StepWrapper,
} from "./Stepper.styles";

export interface StepperProps {
  className?: string;
  /** Ordered labels for each step, e.g. ["Select date", "Review terms", "Download"]. */
  steps: string[];
  /** Zero-indexed position of the step currently active in the flow. */
  currentStep: number;
  /**
   * Renders a compact row of unlabeled, unnumbered dots instead of numbered
   * steps with text — for contexts too narrow for the full labeled layout.
   */
  compact?: boolean;
  /** Color for completed/current dots and connectors. Defaults to `palette.signal.links`. */
  accentColor?: string;
}

/**
 * Horizontal numbered step indicator for multi-step flows (e.g. a wizard-style modal).
 * Steps before `currentStep` render as completed (checkmark), the step at `currentStep`
 * renders as active, and later steps render as upcoming.
 */
export const Stepper: React.FC<StepperProps> = ({
  className,
  steps,
  currentStep,
  compact = false,
  accentColor = palette.signal.links,
}) => {
  return (
    <StepperWrapper className={className} $compact={compact}>
      {steps.map((label, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <StepWrapper
            key={label}
            $isConnectorActive={index <= currentStep}
            $compact={compact}
            $accentColor={accentColor}
          >
            <StepDot
              $isCompleted={isCompleted}
              $isCurrent={isCurrent}
              $compact={compact}
              $accentColor={accentColor}
            >
              {!compact &&
                (isCompleted ? (
                  <Icon kind="Check" size={12} />
                ) : (
                  <span>{index + 1}</span>
                ))}
            </StepDot>
            {!compact && <StepLabel $isCurrent={isCurrent}>{label}</StepLabel>}
          </StepWrapper>
        );
      })}
    </StepperWrapper>
  );
};
