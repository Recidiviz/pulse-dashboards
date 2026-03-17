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

import React, { useRef, useState } from "react";
import styled from "styled-components";

import { Button, Icon, IconSVG } from "~design-system";

import PathwaysModal from "../PathwaysModal/PathwaysModal";

const FiltersTrigger = styled(Button)`
  gap: 6px;
  min-width: auto;
  min-height: auto;
  height: 38px;
  padding: 8px 16px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  background: white;
  color: black;
  font-size: 14px;
  font-weight: 400;
  letter-spacing: -0.14px;
  line-height: 16px;
  transition:
    background-color 0.15s,
    border-color 0.15s,
    color 0.15s;

  &:hover,
  &:focus-visible {
    background: rgba(0, 0, 0, 0.03);
    color: black;
    border-color: rgba(0, 0, 0, 0.15);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.palette.focusColor};
    outline-offset: 2px;
  }

  &:active,
  &[aria-expanded="true"] {
    border-color: ${({ theme }) => theme.palette.focusColor};
    color: ${({ theme }) => theme.palette.focusColor};
    background: white;
  }
`;

type FiltersButtonProps = {
  children?: React.ReactNode;
};

const FiltersButton: React.FC<FiltersButtonProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClose = () => {
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <>
      <FiltersTrigger
        ref={buttonRef}
        kind="secondary"
        shape="pill"
        onClick={() => setIsOpen(true)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="Filters"
      >
        <Icon kind={IconSVG["FilterSliders"]} size={12} />
        Filters
      </FiltersTrigger>
      <PathwaysModal
        isShowing={isOpen}
        hide={handleClose}
        title="Select Filters"
      >
        {children}
      </PathwaysModal>
    </>
  );
};

export default FiltersButton;
