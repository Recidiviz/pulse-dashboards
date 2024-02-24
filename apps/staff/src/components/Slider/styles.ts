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
import styled from "styled-components/macro";

export const SliderWrapper = styled.div<{
  max: number;
  min: number;
  ratio: number;
  range: number;
  value: number;
}>`
  /* Disabled styling */
  input[type="range"].range-slider.disabled::-webkit-slider-thumb {
    border: 2px solid ${palette.slate10} !important;
  }

  input[type="range"].range-slider.disabled::-moz-range-thumb {
    border: 2px solid ${palette.slate10} !important;
  }

  input[type="range"].range-slider::-ms-thumb {
    border: 2px solid ${palette.slate10} !important;
  }

  input[type="range"].range-slider:focus {
    outline: none;
  }

  /* Progress line styling */
  input[type="range"].range-slider {
    ${typography.Sans14}
    --range: calc(${(props) => props.max} - ${(props) => props.min}});
    --ratio: calc(
      (${(props) => props.value} - ${(props) => props.min}) /
        ${(props) => props.range}
    );
    --position: calc(0.5 * 16px + ${(props) => props.ratio} * (100% - 16px));
  }

  /* webkit */
  input[type="range"].range-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    background: ${palette.white} !important;
    border: 2px solid ${palette.pine4} !important;
    margin-top: calc(6px * 0.5 - max(16px * 0.5, 2px));

    &:focus-visible {
      outline: none;
    }
  }

  input[type="range"].range-slider::-webkit-slider-runnable-track {
    background: ${palette.slate10} !important;
    box-shadow: none;
  }

  input[type="range"].range-slider::-webkit-slider-runnable-track {
    background: linear-gradient(${palette.pine4}, ${palette.pine4}) 0 /
        var(--position) 100% no-repeat,
      ${palette.slate10} !important;
  }

  input[type="range"].range-slider.range-slider--primary:not(
      .disabled
    ):focus::-webkit-slider-thumb,
  input[type="range"].range-slider.range-slider--primary:not(
      .disabled
    ):active::-webkit-slider-thumb {
    box-shadow: 0 0 0 0.2rem rgba(1, 76, 72, 0.25) !important;
  }

  /* mozilla */
  input[type="range"].range-slider::-moz-range-thumb {
    width: max(calc(16px - 2px - 2px), 0px);
    height: max(calc(16px - 2px - 2px), 0px);
    border-radius: 100px;
    background: ${palette.white} !important;
    border: 2px solid ${palette.pine4};
  }

  input[type="range"].range-slider::-moz-range-track {
    background: ${palette.slate10} !important;
    box-shadow: none;
  }

  input[type="range"].range-slider::-moz-range-progress {
    background-color: ${palette.pine4};
  }

  /* ms */
  input[type="range"].range-slider::-ms-thumb {
    width: 16px;
    height: 16px;
    background: ${palette.white} !important;
    border: 2px solid ${palette.pine4} !important;
    margin-top: 0;
    box-sizing: border-box;
  }

  input[type="range"].range-slider::-ms-track {
    background: ${palette.slate10};
    border: none;
    box-shadow: none;
    box-sizing: border-box;
  }

  input[type="range"].range-slider::-ms-fill-lower {
    background: ${palette.pine4} !important;
    border: none;
    border-right-width: 0;
  }
`;
