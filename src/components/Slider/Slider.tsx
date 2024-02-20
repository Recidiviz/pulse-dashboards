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

import "react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css";

import RangeSlider from "react-bootstrap-range-slider";

import { SliderWrapper } from "./styles";

interface SliderProps {
  max: number;
  onChange: (value: number) => void;
  tooltipLabelFormatter?: (value: number) => string;
  disabled: boolean;
  step?: number;
  value?: number;
}

const TooltipSlider = ({
  max,
  onChange,
  tooltipLabelFormatter = (value: number) => `${value}`,
  disabled = false,
  step = 1,
  value = 0,
  ...props
}: SliderProps) => {
  const min = 1;
  const range = max - min;
  const ratio = (value - min) / range;

  return (
    <SliderWrapper
      className="Slider"
      max={max}
      min={min}
      ratio={ratio}
      range={range}
      value={value}
      {...props}
    >
      <RangeSlider
        disabled={disabled}
        value={value}
        min={min}
        max={max}
        step={step}
        tooltip="auto"
        tooltipPlacement="top"
        tooltipLabel={tooltipLabelFormatter}
        onChange={(changeEvent) => onChange(Number(changeEvent.target.value))}
      />
    </SliderWrapper>
  );
};

export default TooltipSlider;
