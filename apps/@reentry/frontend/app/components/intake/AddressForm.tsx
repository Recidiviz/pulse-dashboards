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

import { $api } from "~@reentry/frontend/api";
import { useSocket } from "~@reentry/frontend/websockets/IntakeSocketContext";

interface AddressFormData {
  streetAddress?: string;
  city: string;
  state: string;
}

interface AddressFormProps {
  onError: (error: string) => void;
}

const AddressForm = ({ onError }: AddressFormProps) => {
  const { intakeDispatchContext } = useSocket();

  const { setIntakeComplete } = intakeDispatchContext;
  const [formData, setFormData] = useState<AddressFormData>({
    streetAddress: "",
    city: "",
    state: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { mutateAsync: submitAddressMutation } = $api.useMutation(
    "post",
    "/intake/client/address",
  );

  const getIntakeToken = () => {
    // Get token from sessionStorage where it's stored for intake authentication
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("intake_token") || "";
    }
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.city.trim() || !formData.state.trim()) {
      onError("City and state are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await submitAddressMutation({
        body: {
          street_address: formData.streetAddress,
          city: formData.city,
          state: formData.state,
        },
        headers: {
          Authorization: `Bearer ${getIntakeToken()}`,
        },
      });
      if (response.intake_completed) {
        setIntakeComplete();
      }
    } catch {
      onError("Failed to submit address. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-[2vh] font-public">
      <div className="w-full max-w-3xl ">
        <div className="bg-white shadow-[0_4px_4px_0_rgba(0,0,0,0.25)] rounded-lg px-12 pt-14 pb-10 flex flex-col justify-between">
          <div className="space-y-6 text-center leading-normal tracking-[-0.02em]">
            <h1 className="font-['Libre_Baskerville'] font-normal leading-snug text-4xl tracking-[-0.04em] text-black text-center">
              Your Home Address After Release
            </h1>
            <p className="font-semibold text-lg text-center tracking-tight leading-snug">
              Please provide the address where you plan to live after release.
            </p>
            <div className="space-y-4 text-left">
              <div>
                <p className="font-bold">
                  Why are you asking for my home address?
                </p>
                <p>
                  We will use the address information to identify resources
                  nearby your home.
                </p>
              </div>
              <div>
                <p className="font-bold text-base">
                  Is this my official home address?
                </p>
                <p>
                  <u>No.</u> This address will only be used to help you identify
                  useful community resources.
                </p>
              </div>
              <div>
                <p className="font-bold">
                  What if I don&apos; t know the adress yet?
                </p>
                <p>
                  No problem! Leave the street address blank and make your best
                  guess at the city and state. You can work with your case
                  manager or parole officer to update the address later.
                </p>
              </div>
            </div>
            <div className="w-full">
              <form
                onSubmit={handleSubmit}
                className="space-y-4 max-w-lg m-auto"
              >
                <div>
                  <label
                    htmlFor="streetAddress"
                    className="block font-medium text-[16px] tracking-[-0.02em] text-[#012322] mb-1 text-left"
                  >
                    Street Address
                  </label>
                  <input
                    type="text"
                    id="streetAddress"
                    value={formData.streetAddress}
                    placeholder="123 Reentry Way"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        streetAddress: e.target.value,
                      })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 text-start"
                  />
                </div>

                <div className="w-full flex justify-center gap-4 mt-10 flex-col sm:flex-row ">
                  <div className="flex flex-col flex-grow">
                    <label
                      htmlFor="city"
                      className="block font-medium text-[16px] tracking-[-0.02em] text-[#012322] mb-1 text-left"
                    >
                      City (required)
                    </label>
                    <input
                      type="text"
                      id="city"
                      required
                      placeholder="Anywhere"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 text-start"
                    />
                  </div>

                  <div className="flex flex-col flex-grow">
                    <label
                      htmlFor="state"
                      className="block font-medium text-[16px] tracking-[-0.02em] text-[#012322] mb-1 text-left"
                    >
                      State (required)
                    </label>
                    <input
                      type="text"
                      id="state"
                      required
                      placeholder="NY"
                      value={formData.state}
                      onChange={(e) =>
                        setFormData({ ...formData, state: e.target.value })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 text-start"
                    />
                  </div>
                </div>
                <div className="w-11/12">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="hover:bg-gray-950 text-white rounded-full py-2 w-full disabled:opacity-50 bg-[#003331]"
                  >
                    {isSubmitting ? (
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
                      "Submit"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressForm;
