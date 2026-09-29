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

import { useState } from "react";
import { PlusIcon } from "react-native-heroicons/outline";

import {
  SendSuccessPlannerModal,
  useSuccessPlanner,
} from "~@meetings/app/entities/success-planner";
import { Button } from "~@meetings/app/shared/ui/Button";

export function SendSuccessPlannerButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const planner = useSuccessPlanner();

  if (planner) return null;

  return (
    <>
      <Button
        variant="tertiary"
        icon={{ icon: PlusIcon, className: "!size-4 stroke-[3px]" }}
        onPress={() => setIsModalOpen(true)}
      >
        Success Planner
      </Button>
      {isModalOpen && (
        <SendSuccessPlannerModal
          onCancel={() => setIsModalOpen(false)}
          onSend={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
