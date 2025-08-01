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

export interface IntakeStep {
  id: string;
  completion_status: string;
  intake_section: {
    id: string;
    title: string;
    description: string;
    order?: string;
  };
}

interface VerticalStepperProps {
  steps: IntakeStep[];
}

const getOrderNumber = (order?: string): number => {
  if (!order) return 0;
  const numStr = order.replace(/\D/g, "");
  return Number.parseInt(numStr, 10) || 0;
};

const VerticalStepper: React.FC<VerticalStepperProps> = ({ steps }) => {
  const sortedSteps = [...steps].sort((a, b) => {
    if (a.intake_section.order && b.intake_section.order) {
      return (
        getOrderNumber(a.intake_section.order) -
        getOrderNumber(b.intake_section.order)
      );
    }
    return 0;
  });

  const completedSteps = sortedSteps.filter(
    (step) => step.completion_status === "completed",
  ).length;
  const progressPercentage = (completedSteps / sortedSteps.length) * 100;

  return (
    <div className="relative max-w-md px-1">
      <div className="mb-6 space-y-3 bg-white p-4 rounded-md border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-gray-700">Progress</h3>
          <div className="bg-[#e0f2f1] px-3 py-1 rounded-full text-sm font-medium text-[#006B66]">
            {Math.round(progressPercentage)}% Complete
          </div>
        </div>

        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-2 bg-[#006B66] rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <div className="text-sm pt-1">
          <div className="text-gray-600">
            <span className="font-medium text-[#006B66]">{completedSteps}</span>{" "}
            of <span className="font-medium">{sortedSteps.length}</span>{" "}
            sections completed
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="flex justify-center space-x-2 mb-2">
          <button
            type="button"
            className="w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center text-[#006B66] hover:bg-[#f5f5f5] focus:outline-none border border-gray-200"
            onClick={() => {
              const container = document.getElementById("steps-container");
              if (container) {
                container.scrollBy({ top: -100, behavior: "smooth" });
              }
            }}
            aria-label="Scroll up"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Scroll up"
            >
              <title>Scroll up</title>
              <path
                d="M18 15L12 9L6 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <button
            type="button"
            className="w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center text-[#006B66] hover:bg-[#f5f5f5] focus:outline-none border border-gray-200"
            onClick={() => {
              const container = document.getElementById("steps-container");
              if (container) {
                container.scrollBy({ top: 100, behavior: "smooth" });
              }
            }}
            aria-label="Scroll down"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Scroll down"
            >
              <title>Scroll down</title>
              <path
                d="M6 9L12 15L18 9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div
          id="steps-container"
          className="relative flex flex-col space-y-6 py-1 max-h-[400px] overflow-y-auto pr-2 scroll-smooth"
        >
          {sortedSteps.map((step, idx) => {
            const isCompleted = step.completion_status === "completed";
            const isInProgress = step.completion_status === "in_progress";

            return (
              <div key={step.id} className="flex items-start ml-1">
                <div className="flex flex-col items-center relative w-8">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm z-10 ${
                      // eslint-disable-next-line no-nested-ternary
                      isCompleted
                        ? "bg-[#006B66]"
                        : isInProgress
                          ? "bg-blue-500"
                          : "bg-gray-400"
                    }`}
                  >
                    {isCompleted ? (
                      <svg
                        className="w-4 h-4 text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <title>status</title>
                        <path
                          d="M5 13l4 4L19 7"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <span className="text-xs font-bold text-white" />
                    )}
                  </div>
                  {idx < sortedSteps.length - 1 && (
                    <div
                      className={`absolute left-1/2 transform -translate-x-1/2 w-[2px] top-full h-6 ${
                        isCompleted ? "bg-[#006B66]" : "bg-gray-200"
                      }`}
                      style={{ height: "calc(34px)" }}
                    />
                  )}
                </div>

                <div className="ml-4">
                  <p
                    className={`text-sm font-medium ${
                      // eslint-disable-next-line no-nested-ternary
                      isCompleted
                        ? "text-[#006B66]"
                        : isInProgress
                          ? "text-blue-700"
                          : "text-gray-800"
                    }`}
                  >
                    {step.intake_section.title}
                  </p>
                  <p
                    className={`text-xs flex items-center ${
                      // eslint-disable-next-line no-nested-ternary
                      isCompleted
                        ? "text-[#006B66]"
                        : isInProgress
                          ? "text-blue-500"
                          : "text-gray-400"
                    }`}
                  >
                    <span
                      className={`inline-block w-2 h-2 rounded-full mr-2 ${
                        // eslint-disable-next-line no-nested-ternary
                        isCompleted
                          ? "bg-[#006B66]"
                          : isInProgress
                            ? "bg-blue-500"
                            : "bg-gray-400"
                      }`}
                    />
                    {/* eslint-disable-next-line no-nested-ternary, no-nested-ternary */}
                    {isCompleted
                      ? "Completed"
                      : isInProgress
                        ? "In Progress"
                        : "Not Started"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Scroll hint overlay: only shown if there are more than 4 steps */}
        {sortedSteps.length > 4 && (
          <div className="pointer-events-none absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white to-transparent" />
        )}
      </div>
    </div>
  );
};

export default VerticalStepper;
