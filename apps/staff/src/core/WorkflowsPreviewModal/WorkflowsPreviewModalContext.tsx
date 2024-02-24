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

import React from "react";

type ModalContextType = {
  setDismissAfterMs: (dismissAfterMs: number) => void;
  setModalIsOpen: (isOpen: boolean) => void;
};

const getErrorMessage = (functionName: string) =>
  `${functionName} function should not be called outside of a provider`;

// Create a new context with default implementations that throw an error
const WorkflowsPreviewModalContext = React.createContext<ModalContextType>({
  setDismissAfterMs: () => {
    throw new Error(getErrorMessage("setDismissAfterMs"));
  },
  setModalIsOpen: () => {
    throw new Error(getErrorMessage("setModalIsOpen"));
  },
});

export default WorkflowsPreviewModalContext;
