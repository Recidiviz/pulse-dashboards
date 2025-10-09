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
import PrimaryButton from "~@reentry/frontend/components/buttons/PrimaryButton";
import { useAuth } from "~@reentry/frontend/lib/auth";
import {
  showErrorToast,
  showSuccessToast,
} from "~@reentry/frontend/utils/toast";

interface HomeAddressSectionProps {
  planId: string;
  onAddressUpdate?: () => void;
  startPolling?: (executionId: string) => void;
  isPolling?: boolean;
}

interface AddressFields {
  streetAddress: string;
  city: string;
  state: string;
}

const HomeAddressSection = ({
  planId,
  onAddressUpdate,
  startPolling,
  isPolling = false,
}: HomeAddressSectionProps) => {
  const { getAccessToken } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [addressFields, setAddressFields] = useState<AddressFields>({
    streetAddress: "",
    city: "",
    state: "",
  });
  const [originalAddressFields, setOriginalAddressFields] =
    useState<AddressFields>({
      streetAddress: "",
      city: "",
      state: "",
    });
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const { data: clientInfo, isLoading: isLoadingInfo } = $api.useQuery(
    "get",
    "/plans/{id}/client-info",
    {
      params: { path: { id: planId } },
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    },
  );

  useEffect(() => {
    if (clientInfo?.home) {
      setCurrentAddress(clientInfo.home);

      // Try to parse the address into components
      const parts = clientInfo.home.split(",").map((part) => part.trim());
      if (parts.length >= 2) {
        // Assume last part is state, second to last is city
        const state = parts[parts.length - 1];
        const city = parts[parts.length - 2];
        const streetAddress = parts.slice(0, -2).join(", ");

        setAddressFields({
          streetAddress,
          city,
          state,
        });
        setOriginalAddressFields({
          streetAddress,
          city,
          state,
        });
      } else {
        // If we can't parse, just put it all in street address
        setAddressFields({
          streetAddress: clientInfo.home,
          city: "",
          state: "",
        });
        setOriginalAddressFields({
          streetAddress: clientInfo.home,
          city: "",
          state: "",
        });
      }
    }
  }, [clientInfo]);

  const updateAddressMutation = $api.useMutation(
    "patch",
    "/plans/{id}/client-info/address",
  );

  // Check if the current form values differ from the original values
  const hasChanges = () => {
    return (
      addressFields.streetAddress !== originalAddressFields.streetAddress ||
      addressFields.city !== originalAddressFields.city ||
      addressFields.state !== originalAddressFields.state
    );
  };

  const handleUpdate = async () => {
    if (!addressFields.city.trim() || !addressFields.state.trim()) {
      showErrorToast("City and state are required");
      return;
    }

    setIsLoading(true);
    try {
      // Format address for backend using AddressSubmission format
      const response = await updateAddressMutation.mutateAsync({
        params: { path: { id: planId } },
        body: {
          street_address: addressFields.streetAddress || null,
          city: addressFields.city,
          state: addressFields.state,
        },
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
          "Content-Type": "application/json",
        },
      });

      // Format address for display
      const formattedAddress = addressFields.streetAddress
        ? `${addressFields.streetAddress}, ${addressFields.city}, ${addressFields.state}`
        : `${addressFields.city}, ${addressFields.state}`;

      setCurrentAddress(formattedAddress);
      setIsEditing(false);
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
    // Reset to original values
    setAddressFields({
      streetAddress: originalAddressFields.streetAddress,
      city: originalAddressFields.city,
      state: originalAddressFields.state,
    });
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
        (isLoadingInfo ? (
          <div className="text-sm text-gray-500">Loading address...</div>
        ) : isEditing ? (
          <div className="w-full space-y-3">
            <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
              Note: Updating the address will regenerate the action plan with
              new resources near the new address. Regeneration will overwrite
              the existing plan and may take several minutes.
            </div>
            <div>
              <label
                htmlFor="streetAddress"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                Street Address
              </label>
              <input
                type="text"
                id="streetAddress"
                value={addressFields.streetAddress}
                onChange={(e) =>
                  setAddressFields({
                    ...addressFields,
                    streetAddress: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="123 Main St"
                disabled={isLoading || isPolling}
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label
                  htmlFor="city"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  City (required)
                </label>
                <input
                  type="text"
                  id="city"
                  value={addressFields.city}
                  onChange={(e) =>
                    setAddressFields({
                      ...addressFields,
                      city: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Seattle"
                  disabled={isLoading || isPolling}
                  required
                />
              </div>

              <div className="flex-1">
                <label
                  htmlFor="state"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  State (required)
                </label>
                <input
                  type="text"
                  id="state"
                  value={addressFields.state}
                  onChange={(e) =>
                    setAddressFields({
                      ...addressFields,
                      state: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="WA"
                  disabled={isLoading || isPolling}
                  required
                />
              </div>
            </div>

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
                disabled={isLoading || isPolling || !hasChanges()}
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
              onClick={() => setIsEditing(true)}
              disabled={isPolling}
            />
          </div>
        ))}
    </div>
  );
};

export default HomeAddressSection;
