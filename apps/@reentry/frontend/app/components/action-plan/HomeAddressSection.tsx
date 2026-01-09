// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { $api } from "~@reentry/frontend/api";
import { InfoTooltip } from "~@reentry/frontend/components/base/InfoTooltip";
import { PrimaryButton } from "~@reentry/frontend/components/buttons/PrimaryButton";
import { useAnalytics } from "~@reentry/frontend/contexts/AnalyticsProvider";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
import { formatAddress } from "~@reentry/frontend/utils/addressUtils";
import {
  FullAddressForm,
  showErrorToast,
  showSuccessToast,
} from "~@reentry/frontend-shared";
import type { components } from "~@reentry/openapi-types";

interface HomeAddressSectionProps {
  planId: string;
  onAddressUpdate?: () => void;
  startPolling?: (executionId: string) => void;
  isPolling?: boolean;
  clientRecord:
    | components["schemas"]["ClientRecordResponse"]
    | null
    | undefined;
}

const HomeAddressSection = ({
  planId,
  onAddressUpdate,
  startPolling,
  isPolling = false,
  clientRecord,
}: HomeAddressSectionProps) => {
  const { getAccessToken } = useAuth();
  const { track } = useAnalytics();
  const [isEditing, setIsEditing] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [addressInput, setAddressInput] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [addressError, setAddressError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isFormValid, setIsFormValid] = useState(false);

  const { data: address, isLoading: isLoadingAddress } = $api.useQuery(
    "get",
    "/plan/{plan_id}/address",
    {
      params: { path: { plan_id: planId } },
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    },
  );

  useEffect(() => {
    if (address) {
      setCurrentAddress(formatAddress(address));
    }
  }, [address]);

  const handleAddressChange = (value: string) => {
    setAddressInput(value);
    setAddressError(null);
  };

  const { mutateAsync: updateAddressMutation } = $api.useMutation(
    "patch",
    "/plans/{id}/address",
  );

  // Check if the current form values differ from the original values
  const hasChanges = () => {
    return addressInput !== null;
  };

  const handleUpdate = async () => {
    // Validate that address was selected from autocomplete

    track("action_plan_client_home_address_updated", {
      justiceInvolvedPersonId: clientRecord?.pseudonymized_client_id,
      planId: planId,
    });

    setIsLoading(true);
    try {
      const response = await updateAddressMutation({
        params: { path: { id: planId } },
        body: {
          street_address: addressInput || null,
          city: city,
          state: state,
        },
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
          "Content-Type": "application/json",
        },
      });

      setCurrentAddress(`${addressInput}, ${city}, ${state}`);
      setIsEditing(false);
      setAddressInput("");
      showSuccessToast(
        "Address updated successfully and regeneration started.",
      );

      if (onAddressUpdate) {
        onAddressUpdate();
      }

      if (response.execution_id && startPolling) {
        startPolling(response.execution_id);
      }
    } catch {
      showErrorToast("Failed to update address");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setAddressInput("");
    setCity("");
    setState("");
    setAddressError(null);
    setIsEditing(false);
  };

  return (
    <div className="self-stretch h-auto px-2 md:px-8 py-6 border-b border-[#2b5469]/20 flex-col justify-start items-start gap-3 flex">
      <div className="justify-start items-center gap-2 inline-flex w-full">
        <div className="text-[#002321] text-sm font-medium leading-[16.80px] whitespace-nowrap">
          Home Address
        </div>
        <InfoTooltip
          text="Current address used to find local resources."
          position="top"
        />
        <div className={"flex w-full items-end justify-end"}>
          <Image
            src={"/images/arrow_down.svg"}
            alt="toggle arrow"
            width={10}
            height={10}
            priority
            onClick={() => setIsExpanded(!isExpanded)}
            className={`cursor-pointer transition-transform duration-200 ${!isExpanded ? "-rotate-90" : ""}`}
          />
        </div>
      </div>

      {isExpanded &&
        // eslint-disable-next-line no-nested-ternary
        (isLoadingAddress ? (
          <div className="text-sm text-gray-500">Loading address...</div>
        ) : isEditing ? (
          <div className="w-full space-y-3">
            <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
              Note: Updating the address will regenerate the action plan with
              new resources near the new address. Regeneration will overwrite
              the existing plan and may take several minutes.
            </div>
            <FullAddressForm
              addressValue={addressInput}
              cityValue={city}
              stateValue={state}
              onAddressChange={handleAddressChange}
              onCityChange={setCity}
              onStateChange={setState}
              disabled={isLoading || isPolling}
              addressError={addressError}
              onFormValidChange={setIsFormValid}
              twoColumns={true}
              getAccessToken={getAccessToken}
            />

            <div className="flex gap-2 justify-between">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isLoading || isPolling}
                className="px-4 text-[13px] font-medium text-[#2b5469]/70 hover:text-[#2b5469] transition-colors duration-300"
              >
                Cancel
              </button>
              <PrimaryButton
                buttonText={isLoading ? "Saving..." : "Save"}
                onClick={handleUpdate}
                disabled={
                  isLoading ||
                  isPolling ||
                  !hasChanges() ||
                  !isFormValid ||
                  !city ||
                  !state
                }
                className="!max-w-[150px]"
              />
            </div>
          </div>
        ) : (
          <div className="self-stretch flex-col justify-start items-start gap-2 flex">
            <div className="text-sm text-gray-600">
              {currentAddress || "No address on file"}
            </div>
            <PrimaryButton
              className={"!max-w-[300px] !self-center !w-full"}
              buttonText="Update Address"
              onClick={() => {
                track("action_plan_editing_home_address", {
                  justiceInvolvedPersonId:
                    clientRecord?.pseudonymized_client_id,
                  planId: planId,
                });
                setIsEditing(true);
              }}
              disabled={isPolling}
            />
          </div>
        ))}
    </div>
  );
};

export default HomeAddressSection;
