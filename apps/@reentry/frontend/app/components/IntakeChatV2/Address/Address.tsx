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

import React, { useMemo, useState } from "react";

import { trpc } from "~@reentry/frontend/components/IntakeChatV2/IntakeChatV2";
import {
  showErrorToast,
  showSuccessToast,
} from "~@reentry/frontend/utils/toast";

import styles from "./Address.module.css";

interface AddressProps {
  clientPseudoId: string;
}

const Address: React.FC<AddressProps> = ({ clientPseudoId }) => {
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = useMemo(
    () => city.trim().length > 0 && state.trim().length > 0,
    [city, state],
  );
  const utils = trpc.useUtils();
  const mutation = trpc.clientRecords.updateAddress.useMutation({
    onMutate: async ({ address }) => {
      const pseudoIdKey = { clientPseudoId };
      await utils.clientRecords.getAddress.cancel(pseudoIdKey);
      const previous = utils.clientRecords.getAddress.getData(pseudoIdKey);
      utils.clientRecords.getAddress.setData(pseudoIdKey, address);
      return { previous };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) {
        utils.clientRecords.getAddress.setData(
          { clientPseudoId },
          ctx.previous,
        );
      }
    },
    onSuccess: () => {
      showSuccessToast("Address submitted successfully!");
    },
    onSettled: async () => {
      await utils.clientRecords.getAddress.invalidate({ clientPseudoId });
    },
  });

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    const trimmedStreet = streetAddress.trim();
    const trimmedCity = city.trim();
    const trimmedState = state.trim();
    const address = trimmedStreet
      ? `${trimmedStreet}, ${trimmedCity}, ${trimmedState}`
      : `${trimmedCity}, ${trimmedState}`;

    const payload = { clientPseudoId, address };

    try {
      setIsSubmitting(true);
      await mutation.mutateAsync(payload);
    } catch (error) {
      console.error("Error submitting address:", error);
      showErrorToast("Failed to submit address. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles["container"]}>
      <div className={styles["card"]}>
        <div className={styles["header"]}>
          <h1 className={styles["title"]}>Your Home Address After Release</h1>
          <p className={styles["subtitle"]}>
            Please provide the address where you plan to live after release
          </p>
        </div>

        <div className={styles["body"]}>
          <div className={styles["qaSection"]}>
            <h3 className={styles["qaQuestion"]}>
              Why are you asking for my home address?
            </h3>
            <p className={styles["qaAnswer"]}>
              We will use the address information to identify resources nearby
              your home.
            </p>
          </div>
          <div className={styles["qaSection"]}>
            <h3 className={styles["qaQuestion"]}>
              Is this my official home plan address?
            </h3>
            <p className={styles["qaAnswer"]}>
              <u>No</u>. This address will only be used to help you identify
              useful community resources.
            </p>
          </div>
          <div className={styles["qaSection"]}>
            <h3 className={styles["qaQuestion"]}>
              What if I don’t know the address yet?
            </h3>
            <p className={styles["qaAnswer"]}>
              No problem! Leave the street address blank and make your best
              guess at the city and state. You can work with your case manager
              or parole officer to update the address later.
            </p>
          </div>
          <div className={styles["formContainer"]}>
            <form className={styles["form"]} onSubmit={handleSubmit}>
              <div className={styles["streetAddress"]}>
                <label className={styles["label"]} htmlFor="streetAddress">
                  Street Address
                </label>
                <input
                  id="streetAddress"
                  name="streetAddress"
                  className={styles["input"]}
                  type="text"
                  placeholder="123 Main St"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                />
              </div>

              <div className={styles["row"]}>
                <div className={styles["col"]}>
                  <label className={styles["label"]} htmlFor="city">
                    City{" "}
                    <span className={styles["requiredMark"]}>(required)</span>
                  </label>
                  <input
                    id="city"
                    name="city"
                    className={styles["input"]}
                    type="text"
                    placeholder="City"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className={styles["col"]}>
                  <label className={styles["label"]} htmlFor="state">
                    State{" "}
                    <span className={styles["requiredMark"]}>(required)</span>
                  </label>
                  <input
                    id="state"
                    name="state"
                    className={styles["input"]}
                    type="text"
                    placeholder="State"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </div>
              </div>
              <div className={styles["buttonRow"]}>
                <button
                  type="submit"
                  className={`${styles["buttonCommon"]} ${styles["submit"]}`}
                  disabled={!isValid || isSubmitting}
                  aria-disabled={!isValid || isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Address;
