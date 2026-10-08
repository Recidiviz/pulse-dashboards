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
import { View } from "react-native";
import { PlusIcon } from "react-native-heroicons/outline";
import ExclamationCircleIcon from "react-native-heroicons/solid/ExclamationCircleIcon";

import {
  SendSuccessPlannerModal,
  useSuccessPlanner,
} from "~@meetings/app/entities/success-planner";
import { jiiTrpc, Person } from "~@meetings/app/shared/api";
import { Button } from "~@meetings/app/shared/ui/Button";
import { Typography } from "~@meetings/app/shared/ui/Typography";

export function SendSuccessPlannerButton({ person }: { person: Person }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // One ID for the component's lifetime, to avoid the possibility of saving a second
  // check-in, which could reset JII form progress.
  const [checkInId] = useState(() => crypto.randomUUID());

  const { planner, isLoading, isError } = useSuccessPlanner(
    person.pseudonymizedId,
  );
  const utils = jiiTrpc.useUtils();
  const createCheckIn = jiiTrpc.meetingsStaff.usNe.createCheckIn.useMutation({
    onSettled: () =>
      utils.meetingsStaff.usNe.getCheckIn.invalidate({
        pseudonymizedId: person.pseudonymizedId,
      }),
  });

  if (planner) return null;

  if (isError) {
    return (
      <View className="flex-row items-center gap-1.5">
        <ExclamationCircleIcon className="size-4 fill-attention" />
        <Typography variant="caption-s-regular" className="!text-attention">
          Couldn't load the 120-Day Check-In
        </Typography>
      </View>
    );
  }

  const closeModal = () => {
    setIsModalOpen(false);
    createCheckIn.reset();
  };

  return (
    <>
      <Button
        variant="tertiary"
        icon={{ icon: PlusIcon, className: "!size-4 stroke-[3px]" }}
        loading={isLoading || createCheckIn.isPending}
        onPress={() => setIsModalOpen(true)}
      >
        120-Day Check-In
      </Button>
      {isModalOpen && (
        <SendSuccessPlannerModal
          onCancel={closeModal}
          onSend={() =>
            createCheckIn.mutate(
              {
                pseudonymizedId: person.pseudonymizedId,
                id: checkInId,
              },
              { onSuccess: closeModal },
            )
          }
          isSending={createCheckIn.isPending}
          isError={createCheckIn.isError}
        />
      )}
    </>
  );
}
