// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2020 Recidiviz, Inc.
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

import "./Checkbox.scss";

import React, { useEffect, useState } from "react";

type Props = {
  value: string;
  name?: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: () => void;
  children?: React.ReactNode;
};

const Checkbox: React.FC<Props> = ({
  value,
  checked,
  name,
  disabled,
  onChange,
  children,
}) => {
  const [check, setCheck] = useState(checked);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCheck(e.target.checked);
    onChange?.();
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setCheck(checked);
  });

  return (
    <label className="Checkbox__container">
      <span className="Checkbox__label">{children}</span>
      <input
        data-testid={`checkbox-${name}`}
        className="Checkbox__input"
        type="checkbox"
        name={name}
        checked={check}
        value={value}
        onChange={handleChange}
        disabled={disabled}
      />
      <span className="Checkbox__box" />
    </label>
  );
};

export default Checkbox;
