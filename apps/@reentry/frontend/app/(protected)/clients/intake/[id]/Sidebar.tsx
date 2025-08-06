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

import type { FC } from "react";

import type { components } from "~@reentry/frontend/recidiviz-schema";

type ClientIntakeSection = components["schemas"]["ClientIntakeSectionResponse"];

interface SidebarProps {
  onClose: () => void;
  onSectionSelect: (sectionId: string) => void;
  intakeData: ClientIntakeSection[];
  activeSectionId?: string | null;
}

type StepStatus = "completed" | "in_progress" | "not_started";

interface StepIndicatorProps {
  status: StepStatus;
  hasNext: boolean;
  text: string;
  description: string;
  sectionId: string;
  isClickable: boolean;
  isActive: boolean;
  onClick?: () => void;
}

const Sidebar: FC<SidebarProps> = ({
  onClose,
  onSectionSelect,
  intakeData,
  activeSectionId,
}) => {
  const StepIndicator: FC<StepIndicatorProps> = ({
    status,
    hasNext,
    text,
    description,
    isClickable,
    isActive,
    onClick,
  }) => {
    const isCompleted = status === "completed";
    const isInProgress = status === "in_progress";

    const renderStatusIcon = () => {
      if (isCompleted) {
        return (
          <div
            className={`flex items-center justify-center w-6 h-6 rounded-full border border-[#25636F] flex-shrink-0
      ${isActive ? "bg-[#F9FAFA]" : "bg-[#25636F]"}`}
          >
            <svg
              className={`w-[12px] h-[18px] ${isActive ? "text-[#25636F]" : "text-[#F9FAFA]"}`}
              viewBox="0 0 24 24"
              fill="none"
            >
              <title>Check Mark</title>
              <path
                d="M4 13l5 6L15 5"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        );
      }

      return (
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
            isInProgress || isActive
              ? ""
              : "bg-[#F9FAFA] border border-[#E9EDED]"
          }`}
          style={
            isInProgress
              ? {
                  boxShadow: isActive ? undefined : "0px 0px 0px 3px #D5ECF1",
                  backgroundColor: isActive ? "#F9FAFA" : "#25636F",
                }
              : {}
          }
        >
          <div
            className={`rounded-full w-2 h-2 ${
              // eslint-disable-next-line no-nested-ternary
              isInProgress
                ? isActive
                  ? "bg-[#25636F]"
                  : "bg-white"
                : "bg-slate-200"
            }`}
          />
        </div>
      );
    };

    const getConnectorColor = () => {
      if (isActive) return "bg-white";
      if (isCompleted || isInProgress) return "bg-[#25636F]";
      return "bg-slate-200";
    };

    return (
      <div
        className={`flex flex-row items-start gap-1 w-full mb-1 cursor-${
          isClickable ? "pointer" : "default"
        } ${isActive ? "bg-[#25636F] text-white rounded-md p-1" : "p-1"} transition-colors duration-200`}
        onClick={isClickable ? onClick : undefined}
      >
        <div className="flex flex-col items-center w-6 min-h-[50px] gap-0">
          {renderStatusIcon()}
          {hasNext && (
            <div
              className={`w-0.5 ${getConnectorColor()}`}
              style={{
                height: "38px",
                marginTop: "3px",
                borderRadius: "1px",
              }}
            />
          )}
        </div>

        <div className="flex flex-col gap-0.3 pt-0.3 pb-1.5 flex-1 w-full">
          <h3
            className={`text-sm font-bold leading-snug tracking-tight ${isActive ? "text-white" : "text-[#012322]"}`}
          >
            {text}
          </h3>
          <p
            className={`font-public text-sm font-medium leading-snug tracking-tight w-full ${isActive ? "text-white" : "text-[#2B5469D9]"}`}
          >
            {description}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="w-[300px] flex flex-col ml-5 h-full">
      <div className="flex items-center justify-between p-2 mr-2 mb-6 md:hidden">
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full hover:bg-slate-100 "
          aria-label="Close sidebar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            role="img"
            aria-hidden="true"
          >
            <title>Close Icon</title>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="p-2">
        {intakeData.map((section, index) => {
          const status: StepStatus =
            // eslint-disable-next-line no-nested-ternary
            section.completion_status === "completed"
              ? "completed"
              : section.completion_status === "in_progress"
                ? "in_progress"
                : "not_started";

          const hasNext = index < intakeData.length - 1;
          const isClickable =
            status === "completed" || status === "in_progress";
          const isActive = section.id === activeSectionId;

          return (
            <StepIndicator
              key={section.id}
              sectionId={section.id}
              status={status}
              hasNext={hasNext}
              text={section.intake_section.title}
              description={section.intake_section.description}
              isClickable={isClickable}
              isActive={isActive}
              onClick={() => {
                if (isClickable) onSectionSelect(section.id);
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;
