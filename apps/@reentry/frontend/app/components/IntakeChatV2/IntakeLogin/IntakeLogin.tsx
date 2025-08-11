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

import { AxiosError } from "axios";
import Image from "next/image";
import React, { useState } from "react";

import { getIntakeToken } from "~@reentry/frontend/components/IntakeChatV2/api/api";
import styles from "~@reentry/frontend/components/IntakeChatV2/IntakeLogin/IntakeLogin.module.css";
import { useIntakeAuthContext } from "~@reentry/frontend/components/IntakeChatV2/providers/IntakeAuthProvider";
import { IntakeFields } from "~@reentry/frontend/components/IntakeChatV2/types";
import { validateIntakeFields } from "~@reentry/frontend/components/IntakeChatV2/utils";
import { showSuccessToast } from "~@reentry/frontend/utils/toast";

export default function IntakeLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const { setToken, setClientId, setStateCode, setFirstName, setLastName } =
    useIntakeAuthContext();

  const [fields, setFields] = useState<IntakeFields>({
    firstName: "",
    lastName: "",
    month: "",
    day: "",
    year: "",
    stateCode: "",
  });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
  };

  const handleContinue = async () => {
    const error = validateIntakeFields(fields);
    if (error) {
      setError(error);
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const { token, clientPseudoId } = await getIntakeToken(fields);

      if (!clientPseudoId)
        throw new Error("There was an issue verifying the client.");

      showSuccessToast(`Success! Welcome, ${fields.firstName}.`);
      setToken(token);
      setClientId(clientPseudoId);
      setStateCode(fields.stateCode);
      setFirstName(fields.firstName);
      setLastName(fields.lastName);
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        console.error(
          "Error during intake verification:",
          err.response?.data || err.message,
        );
      }

      setError("Verification failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) handleContinue();
  };

  return (
    <div className={styles["container"]}>
      <div className={styles["logoWrapper"]}>
        <Image
          src="/images/brand.svg"
          alt="Brand logo"
          width={90}
          height={90}
          priority
        />
      </div>
      <div className={styles["content"]}>
        <div className={styles["card"]}>
          {/* Header */}
          <h1 className={styles["title"]}>Welcome!</h1>
          <p className={styles["subtitle"]}>
            Before you proceed, please confirm your full name and birthdate.
          </p>

          {/* Error Message */}
          {error && <div className={styles["errorBox"]}>{error}</div>}

          {/* First & Last Name  */}
          <div className={styles["fieldGroup"]}>
            <div className={styles["field"]}>
              <label htmlFor="firstName" className={styles["label"]}>
                First Name
              </label>
              <input
                id="firstName"
                name="firstName"
                className={styles["input"]}
                value={fields.firstName}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
            </div>
            <div className={styles["field"]}>
              <label htmlFor="lastName" className={styles["label"]}>
                Last Name
              </label>
              <input
                id="lastName"
                name="lastName"
                className={styles["input"]}
                value={fields.lastName}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Date of Birth */}
          <div className={styles["fieldGroup"]}>
            <div className={styles["field"]}>
              <label htmlFor="month" className={styles["label"]}>
                Month
              </label>
              <input
                id="month"
                name="month"
                className={styles["input"]}
                value={fields.month}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                maxLength={2}
                disabled={isLoading}
              />
            </div>
            <div className={styles["field"]}>
              <label htmlFor="day" className={styles["label"]}>
                Day
              </label>
              <input
                id="day"
                name="day"
                className={styles["input"]}
                value={fields.day}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                maxLength={2}
                disabled={isLoading}
              />
            </div>
            <div className={styles["field"]}>
              <label htmlFor="year" className={styles["label"]}>
                Year
              </label>
              <input
                id="year"
                name="year"
                className={styles["input"]}
                value={fields.year}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                maxLength={4}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* State */}
          <div className={styles["field"]}>
            <label htmlFor="stateCode" className={styles["label"]}>
              State
            </label>
            <select
              id="stateCode"
              name="stateCode"
              className={styles["select"]}
              value={fields.stateCode}
              onChange={handleChange}
              disabled={isLoading}
            >
              <option value="">Select a state</option>
              <option value="US_AZ">Arizona</option>
              <option value="US_ID">Idaho</option>
              <option value="US_UT">Utah</option>
            </select>
          </div>

          {/* Continue */}
          <button
            className={styles["button"]}
            onClick={handleContinue}
            disabled={isLoading}
          >
            {isLoading ? <div className={styles["spinner"]} /> : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
