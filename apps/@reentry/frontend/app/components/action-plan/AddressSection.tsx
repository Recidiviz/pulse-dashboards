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

"use client";

import Image from "next/image";
import { useState } from "react";

import { InfoTooltip } from "~@reentry/frontend/components/base/InfoTooltip";
import { PrimaryButton } from "~@reentry/frontend/components/buttons/PrimaryButton";
import { useAnalytics } from "~@reentry/frontend/contexts/AnalyticsProvider";
import { formatAddress } from "~@reentry/frontend/utils/addressUtils";
import { FullAddressForm } from "~@reentry/frontend-shared";
import type { components } from "~@reentry/openapi-types";

import styles from "./styles/AddressSection.module.css";

type AnalyticsContext = {
  planGenerationId?: string;
};

interface AddressSectionProps {
  initialAddress?: components["schemas"]["ClientAddressResponse"] | null;
  onSave: (address: {
    street_address: string | null;
    city: string;
    state: string;
  }) => Promise<void>;
  analyticsContext?: AnalyticsContext;
  getAccessToken: () => string | undefined | null;
  disabled?: boolean;
}

const AddressSection = ({
  initialAddress,
  onSave,
  analyticsContext,
  getAccessToken,
  disabled = false,
}: AddressSectionProps) => {
  const { track } = useAnalytics();
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [addressInput, setAddressInput] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [displayAddress, setDisplayAddress] = useState(
    formatAddress(initialAddress),
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({ street_address: addressInput || null, city, state });
      track("address_updated", {
        planGenerationId: analyticsContext?.planGenerationId,
      });
      setDisplayAddress(
        [addressInput, city, state].filter(Boolean).join(", ") || null,
      );
      setIsEditing(false);
      setAddressInput("");
      setCity("");
      setState("");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setAddressInput("");
    setCity("");
    setState("");
    setIsEditing(false);
  };

  return (
    <div className={styles["container"]}>
      <div className={styles["header"]}>
        <div className={styles["title"]}>Home Address</div>
        <InfoTooltip
          text="Current address used to find local resources."
          position="top"
        />
        <div className={styles["toggleContainer"]}>
          <Image
            src="/images/arrow_down.svg"
            alt="toggle arrow"
            width={10}
            height={10}
            priority
            onClick={() => setIsExpanded(!isExpanded)}
            className={`${styles["toggleArrow"]} ${!isExpanded ? styles["toggleArrowCollapsed"] : ""}`}
          />
        </div>
      </div>

      {isExpanded &&
        (isEditing ? (
          <div className={styles["editForm"]}>
            <FullAddressForm
              addressValue={addressInput}
              cityValue={city}
              stateValue={state}
              onAddressChange={setAddressInput}
              onCityChange={setCity}
              onStateChange={setState}
              disabled={disabled}
              onFormValidChange={setIsFormValid}
              twoColumns={false}
              getAccessToken={getAccessToken}
            />
            <div className={styles["editActions"]}>
              <button
                type="button"
                onClick={handleCancel}
                disabled={disabled || isSaving}
                className={styles["cancelButton"]}
              >
                Cancel
              </button>
              <PrimaryButton
                buttonText={isSaving ? "Saving..." : "Save"}
                onClick={handleSave}
                disabled={
                  disabled || isSaving || !isFormValid || !city || !state
                }
                className="!max-w-[150px]"
              />
            </div>
          </div>
        ) : (
          <div className={styles["displayContent"]}>
            <div className={styles["addressText"]}>
              {displayAddress || "No address on file"}
            </div>
            <PrimaryButton
              className="!max-w-[300px] !self-center !w-full"
              buttonText="Update Address"
              onClick={() => setIsEditing(true)}
              disabled={disabled}
            />
          </div>
        ))}
    </div>
  );
};

export default AddressSection;
