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

import type React from "react";
import { useState } from "react";

import { getStateLabel } from "../../../constants/states";
import { useApplicationContext } from "../../../contexts/ApplicationContext";
import { getUserFacingErrorMessage } from "../../../utils/errors";
import { showSuccessToast } from "../../../utils/toast";
import { Dropdown } from "../../inputs";

type AssessmentLoginMode = "dob+token" | "dob+fullname" | "state+docid";

interface AssessmentLoginPageProps {
  urlToken?: string | null;
  mode: AssessmentLoginMode;
  onConfirmation: () => void;
}

export function AssessmentLoginPage({
  urlToken,
  mode,
  onConfirmation,
}: AssessmentLoginPageProps) {
  const { $api, Image, analytics } = useApplicationContext();
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [stateCode, setStateCode] = useState<string>("");
  const [docId, setDocId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  //const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  // Fetch available state codes from the backend
  const { data: stateCodesData, isLoading: isLoadingStates } = $api.useQuery(
    "get",
    "/public/intake-config/conversation-states",
    {
      refetchOnWindowFocus: false,
    }
  );

  const availableStates =
    stateCodesData?.state_codes.map((code) => ({
      value: code,
      label: getStateLabel(code),
    })) ?? [];

  const { mutateAsync: verifyDobFullnameMutation } = $api.useMutation(
    "post",
    "/external/client/verify/dob+fullname",
  );

  const { mutateAsync: verifyDobUrlTokenMutation } = $api.useMutation(
    "post",
    "/external/client/verify/dob+urltoken",
  );

  const { mutateAsync: verifyStateDocIdMutation } = $api.useMutation(
    "post",
    "/external/client/verify/state+docid",
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading) {
      handleContinue();
    }
  };

  const validateStateDocId = () => {
    if (!stateCode) {
      setError("Please select your state");
      return;
    }
    if (!docId.trim()) {
      setError("Please enter your DOC ID");
      return;
    }
  };

  const validateDob = () => {
    if (!day || !month || !year) {
      setError("Please enter your complete date of birth");
      return;
    }
    if (
      !/^\d{1,2}$/.test(day) ||
      Number.parseInt(day) < 1 ||
      Number.parseInt(day) > 31
    ) {
      setError("Please enter a valid day (1-31)");
      return;
    }

    if (
      !/^\d{1,2}$/.test(month) ||
      Number.parseInt(month) < 1 ||
      Number.parseInt(month) > 12
    ) {
      setError("Please enter a valid month (1-12)");
      return;
    }

    if (
      !/^\d{4}$/.test(year) ||
      Number.parseInt(year) < 1900 ||
      Number.parseInt(year) > new Date().getFullYear()
    ) {
      setError("Please enter a valid year");
      return;
    }
  };

  const validateFullname = () => {
    if (!firstName.trim()) {
      setError("Please enter your first name");
      return;
    }
    if (!lastName.trim()) {
      setError("Please enter your last name");
      return;
    }
  };

  const handleContinue = async () => {
    /* pending to define if recaptcha is needed */
    // if (!recaptchaToken) {
    // 	setError("Please complete the CAPTCHA.");
    // 	return;
    // }
    switch (mode) {
      case "state+docid":
        validateStateDocId();
        break;
      case "dob+fullname":
        validateFullname();
        validateDob();
        break;
      case "dob+token":
        validateDob();
        break;
      default:
        console.error("assessment mode error");
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create date in UTC to avoid timezone conversion issues
      // Format: YYYY-MM-DD (ISO 8601 date format)
      const paddedMonth = month.padStart(2, "0");
      const paddedDay = day.padStart(2, "0");
      const isoDateString = `${year}-${paddedMonth}-${paddedDay}`;

      let response: Awaited<ReturnType<typeof verifyDobFullnameMutation>>;

      if (mode === "dob+token" && urlToken) {
        response = await verifyDobUrlTokenMutation({
          body: {
            token_from_url: urlToken,
            date_of_birth: isoDateString,
          },
        });
      } else if (mode === "dob+fullname") {
        response = await verifyDobFullnameMutation({
          body: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            date_of_birth: isoDateString,
            //recaptchaToken: recaptchaToken,
          },
        });
      } else if (mode === "state+docid") {
        response = await verifyStateDocIdMutation({
          body: {
            doc_id: docId.trim(),
            state_code: stateCode,
          },
        });
      } else {
        setError("Missing authentication information. Please try again.");
        return;
      }

      analytics.trackIntakeChatClientLogin({
        justiceInvolvedPersonPseudoId: response.client_pseudo_id,
      });

      showSuccessToast("Successful!");

      if (response?.access_token && response?.client_pseudo_id) {
        sessionStorage.setItem("intake_token", response.access_token);
        sessionStorage.setItem("client_pseudo_id", response.client_pseudo_id);
        onConfirmation();
      } else {
        setError("Invalid response from server. Please try again.");
        return;
      }
    } catch (err: unknown) {
      console.error("Error verifying:", err);
      setError(getUserFacingErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col p-6">
      {/* Logo */}
      <div className="w-full flex justify-center pt-8 pb-4">
        <Image
          src="/images/brand.svg"
          alt="Brand logo"
          width={90}
          height={90}
          priority
        />
      </div>

      <div className="flex-grow flex items-start justify-center pt-4 sm:pt-8 md:items-center">
        <div className="max-w-md text-center w-10/12">
          <h1 className="self-stretch text-[#003331] text-[34px] font-normal font-['Libre Baskerville'] leading-[40.80px] mb-1">
            Welcome!
          </h1>
          <p className="font-[Public Sans, sans-serif] text-[18px] font-semibold tracking-[-0.02em] text-[#2B5469B2] mb-8">
            {
              {
                "dob+fullname":
                  "Before you proceed, please confirm your name and birthdate.",
                "dob+token":
                  "Before you proceed, Please confirm your full name and birthdate.",
                "state+docid":
                  "Before you proceed, please select your state and enter your DOC ID.",
              }[mode]
            }
          </p>
          {error && (
            <div className="text-red-700 text-sm font-medium p-1 rounded space-y-1 w-11/12 mx-auto mb-4">
              {error
                .split(".")
                .filter((sentence) => sentence.trim() !== "")
                .map((sentence, index) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <p key={index}>{sentence.trim()}.</p>
                ))}
            </div>
          )}

          {/* Name fields - only show if mode is nonPseudoId */}
          {mode === "dob+fullname" && (
            <div className="flex space-x-3 mb-6 justify-start w-11/12 pr-4">
              <div className="w-full">
                <label
                  htmlFor="first-name-input"
                  className="block font-public font-medium text-[16px] tracking-[-0.02em] text-[#012322] mb-1 text-left"
                >
                  First Name
                </label>
                <input
                  id="first-name-input"
                  type="text"
                  placeholder="First name"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 text-start"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isLoading}
                  onKeyDown={handleKeyDown}
                />
              </div>
              <div className="w-full">
                <label
                  htmlFor="last-name-input"
                  className="block font-public font-medium text-[16px] tracking-[-0.02em] text-[#012322] mb-1 text-left"
                >
                  Last Name
                </label>
                <input
                  id="last-name-input"
                  type="text"
                  placeholder="Last name"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 text-start"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={isLoading}
                  onKeyDown={handleKeyDown}
                />
              </div>
            </div>
          )}

          {/* State and DOC ID fields - only show if mode is stateDocId */}
          {mode === "state+docid" && (
            <div className="mb-6 w-11/12 mx-auto">
              <div className="mb-4">
                <label
                  htmlFor="state-select"
                  className="block font-public font-medium text-[16px] tracking-[-0.02em] text-[#012322] mb-1 text-left"
                >
                  State
                </label>
                <Dropdown
                  value={stateCode}
                  onChange={(value) => setStateCode(value)}
                  options={availableStates}
                  placeholder={
                    isLoadingStates ? "Loading states..." : "Select state"
                  }
                  disabled={isLoading || isLoadingStates}
                />
              </div>
              <div>
                <label
                  htmlFor="doc-id-input"
                  className="block font-public font-medium text-[16px] tracking-[-0.02em] text-[#012322] mb-1 text-left"
                >
                  DOC ID
                </label>
                <input
                  id="doc-id-input"
                  type="text"
                  placeholder="Enter DOC ID"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 text-start placeholder:text-gray-500"
                  value={docId}
                  onChange={(e) => setDocId(e.target.value)}
                  disabled={isLoading}
                  onKeyDown={handleKeyDown}
                />
              </div>
            </div>
          )}

          {mode !== "state+docid" && (
            <div className="flex space-x-3 mb-6 justify-start">
              <div className="w-1/6">
                <label
                  htmlFor="month-input"
                  className="block font-public font-medium text-[16px] tracking-[-0.02em] text-[#012322] mb-1 text-left"
                >
                  Month
                </label>
                <input
                  id="month-input"
                  type="text"
                  placeholder="MM"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 text-start"
                  value={month}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (
                      /^\d{0,2}$/.test(value) &&
                      (value === "" || Number.parseInt(value) <= 12)
                    ) {
                      setMonth(value);
                    }
                  }}
                  disabled={isLoading}
                  maxLength={2}
                  pattern="[0-9]*"
                />
              </div>
              <div className="w-1/6">
                <label
                  htmlFor="day-input"
                  className="block font-public font-medium text-[16px] tracking-[-0.02em] text-[#012322] mb-1 text-left"
                >
                  Day
                </label>
                <input
                  id="day-input"
                  type="text"
                  placeholder="DD"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 text-start"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  disabled={isLoading}
                  maxLength={2}
                  pattern="[0-9]*"
                  onKeyDown={handleKeyDown}
                />
              </div>
              <div className="w-2/4">
                <label
                  htmlFor="year-input"
                  className="block font-public font-medium text-[16px] tracking-[-0.02em] text-[#012322] mb-1 text-left"
                >
                  Year
                </label>
                <input
                  id="year-input"
                  type="text"
                  placeholder="YYYY"
                  className="w-11/12 p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 text-start"
                  value={year}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d{0,4}$/.test(value)) {
                      setYear(value);
                    }
                  }}
                  disabled={isLoading}
                  maxLength={4}
                  pattern="[0-9]*"
                  onKeyDown={handleKeyDown}
                />
              </div>
            </div>
          )}

          {/* pending to define if recaptcha is needed */}
          {/*{mode === "nonPseudoId" && (*/}
          {/*	<div className="text-center mb-4">*/}
          {/*		<RecaptchaWidget onChange={setRecaptchaToken} />*/}
          {/*	</div>*/}
          {/*)}*/}

          <div className="w-11/12 mx-auto">
            <button
              type="button"
              onClick={handleContinue}
              disabled={isLoading}
              className="hover:bg-gray-950 text-white rounded-full py-2 w-full disabled:opacity-50 bg-[#003331]"
            >
              {isLoading ? (
                <svg
                  className="animate-spin h-5 w-5 mx-auto"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-labelledby="loading-title"
                  role="img"
                >
                  <title id="loading-title">Loading</title>
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                "Continue"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
