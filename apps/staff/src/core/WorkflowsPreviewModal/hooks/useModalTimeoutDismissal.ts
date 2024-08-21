// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

// useModalTimeoutDismissal.ts
import { useEffect, useState } from "react";

export type ModalTimeoutDismissalProps = {
  setModalIsOpen: (isOpen: boolean) => void;
};

const useModalTimeoutDismissal = ({
  setModalIsOpen,
}: ModalTimeoutDismissalProps) => {
  const [dismissAfterMS, setDismissAfterMs] = useState<number | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (dismissAfterMS) {
      timer = setTimeout(() => {
        setModalIsOpen(false);
      }, dismissAfterMS);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [dismissAfterMS, setModalIsOpen]);

  return { setDismissAfterMs };
};

export default useModalTimeoutDismissal;
