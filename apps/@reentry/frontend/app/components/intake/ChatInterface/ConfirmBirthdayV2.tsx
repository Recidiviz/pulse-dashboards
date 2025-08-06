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
import type React from "react";
import { useState } from "react";

//import RecaptchaWidget from "~@reentry/frontend/components/RecaptchaWidget";
import { showSuccessToast } from "~@reentry/frontend/utils/toast";

interface ConfirmBirthdatePageProps {
  mode: "dob" | "pseudoDob" | "nonPseudoId";
  pseudonymized_id?: string | null;
}

const API_BASE_URL = process.env["NEXT_PUBLIC_API_URL"] || "";

export default function ConfirmBirthdatePageV2({
  mode,
  pseudonymized_id,
}: ConfirmBirthdatePageProps) {
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [currentState, setCurrentState] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  //const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading) {
      // eslint-disable-next-line no-use-before-define
      handleContinue();
    }
  };

  const handleContinue = async () => {
    if (mode === "nonPseudoId") {
      /* pending to define if recaptcha is needed */
      // if (!recaptchaToken) {
      // 	setError("Please complete the CAPTCHA.");
      // 	return;
      // }

      if (!firstName.trim()) {
        setError("Please enter your first name");
        return;
      }
      if (!lastName.trim()) {
        setError("Please enter your last name");
        return;
      }
    }

    if (mode === "pseudoDob") {
      if (!lastName.trim()) {
        setError("Please enter your last name");
        return;
      }
    }

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

    if (!currentState) {
      setError("Please select a state");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const paddedMonth = month.padStart(2, "0");
      const paddedDay = day.padStart(2, "0");
      const dateString = `${year}-${paddedMonth}-${paddedDay}`;

      const res = await fetch(`${API_BASE_URL}/get-intake-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          date_of_birth: dateString,
          state_code: currentState,
        }),
      });

      if (!res.ok) {
        throw new Error(`Token request failed: ${res.statusText}`);
      }

      const data = await res.json();
      const accessToken = data.access_token;
      const lastIntakeId = data.last_intake_id;

      showSuccessToast("Access token obtained");

      if (accessToken) {
        sessionStorage.setItem("intake_token", accessToken);
        sessionStorage.setItem("state_code", currentState);
        sessionStorage.setItem("last_intake_id", lastIntakeId || "");
        window.location.reload();
      } else {
        setError("No token returned. Please try again.");
        return;
      }
    } catch (err: unknown) {
      console.error("Error verifying information:", err);
      // @ts-expect-error ported from old codebase
      setError(err.detail);
      // @ts-expect-error ported from old codebase
      setError(err.detail || "Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-6">
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

      <div className="flex-grow flex items-center justify-center">
        <div className="max-w-md text-center w-10/12">
          <h1 className="self-stretch text-[#003331] text-[34px] font-normal font-['Libre Baskerville'] leading-[40.80px] mb-1">
            Welcome!
          </h1>
          <p className="font-[Public Sans, sans-serif] text-[18px] font-semibold tracking-[-0.02em] text-[#2B5469B2] mb-8">
            {/* eslint-disable-next-line no-nested-ternary */}
            {mode === "pseudoDob"
              ? "Before you proceed, please confirm your name and birthdate."
              : mode === "nonPseudoId"
                ? "Before you proceed, Please confirm your full name and birthdate."
                : "Before you proceed, please confirm your birthdate."}
          </p>
          <div className="text-start">
            {error && (
              <div className="text-red-700 text-sm font-medium p-1 rounded space-y-1">
                {error
                  .split(".")
                  .filter((sentence) => sentence.trim() !== "")
                  .map((sentence, index) => (
                    <p key={index}>{sentence.trim()}.</p>
                  ))}
              </div>
            )}
          </div>

          {/* Name fields - only show if pseudonymized_id is provided */}
          {mode === "pseudoDob" && pseudonymized_id && (
            <div className="flex space-x-3 mb-6 justify-start w-11/12">
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

          {/* Name fields - only show if mode is nonPseudoId */}
          {mode === "nonPseudoId" && (
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

          {/* State Selector */}
          <div className="mb-6">
            <label
              htmlFor="state-selector"
              className="block font-public font-medium text-[16px] tracking-[-0.02em] text-[#012322] mb-1 text-left"
            >
              State
            </label>
            <select
              id="state-selector"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 text-start"
              value={currentState}
              onChange={(e) => setCurrentState(e.target.value)}
              disabled={isLoading}
              required
            >
              <option value="">Select a state</option>
              <option value="US_AZ">Arizona</option>
              <option value="US_ID">Idaho</option>
              <option value="US_UT">Utah</option>
            </select>
          </div>

          {/* pending to define if recaptcha is needed */}
          {/*{mode === "nonPseudoId" && (*/}
          {/*	<div className="text-center mb-4">*/}
          {/*		<RecaptchaWidget onChange={setRecaptchaToken} />*/}
          {/*	</div>*/}
          {/*)}*/}

          <div className="w-11/12">
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
