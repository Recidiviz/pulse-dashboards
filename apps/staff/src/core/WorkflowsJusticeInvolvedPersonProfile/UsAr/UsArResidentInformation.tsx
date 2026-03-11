// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { startOfToday } from "date-fns";
import React from "react";

import { ResidentMetadata } from "~datatypes";

import { formatWorkflowsDate } from "../../../utils";
import {
  DetailsHeading,
  DetailsList,
  DetailsSection,
  DetailsSubheading,
  Divider,
  SecureDetailsContent,
} from "../styles";
import { ResidentProfileProps } from "../types";

export function UsArResidentInformation({
  resident,
}: ResidentProfileProps): React.ReactElement<any> | null {
  const { metadata } = resident;

  if (metadata.stateCode !== "US_AR") return null;

  return (
    <>
      <Divider />
      <UsArCurrentStatus metadata={metadata} />
      <Divider />
      <UsArReleaseDates metadata={metadata} />
      <Divider />
      <UsArGoodTimeClassification metadata={metadata} />
      <Divider />
      <UsArProgramming metadata={metadata} />
    </>
  );
}

function UsArGoodTimeClassification({
  metadata: {
    currentCustodyClassification,
    currentGtEarningClass,
    gedCompletionDate,
    noIncarcerationSanctionsWithin12Months,
    noIncarcerationSanctionsWithin6Months,
  },
}: {
  metadata: ResidentMetadata<"US_AR">;
}): React.ReactElement<any> {
  return (
    <DetailsSection>
      <DetailsHeading>Good Time Classification</DetailsHeading>
      <DetailsList>
        <DetailsSubheading>Current Custody Classification</DetailsSubheading>
        <SecureDetailsContent>
          {currentCustodyClassification}
        </SecureDetailsContent>
        <DetailsSubheading>Current GT Earning Class</DetailsSubheading>
        <SecureDetailsContent>{currentGtEarningClass}</SecureDetailsContent>
        {gedCompletionDate && (
          <>
            <DetailsSubheading>GED Completion Date</DetailsSubheading>
            <SecureDetailsContent>
              {formatWorkflowsDate(gedCompletionDate)}
            </SecureDetailsContent>
          </>
        )}
        <DetailsSubheading>Incarceration Sanctions</DetailsSubheading>
        <SecureDetailsContent>
          {/* eslint-disable-next-line no-nested-ternary */}
          {noIncarcerationSanctionsWithin12Months
            ? "No incarceration sanctions within last 12 months"
            : noIncarcerationSanctionsWithin6Months
              ? "No incarceration sanctions within last 6 months"
              : "Sanctions within last 6 months"}
        </SecureDetailsContent>
      </DetailsList>
    </DetailsSection>
  );
}

function UsArCurrentStatus({
  metadata: { currentLocation, currentSentences },
}: {
  metadata: ResidentMetadata<"US_AR">;
}): React.ReactElement<any> {
  return (
    <DetailsSection>
      <DetailsHeading>Current Status</DetailsHeading>
      <DetailsList>
        <DetailsSubheading>Current Location</DetailsSubheading>
        <SecureDetailsContent>{currentLocation}</SecureDetailsContent>
        <DetailsSubheading>Current Sentences</DetailsSubheading>
        {currentSentences.length === 0 ? (
          <SecureDetailsContent>None</SecureDetailsContent>
        ) : (
          currentSentences.map(
            ({ sentenceId, startDate, endDate, initialTimeServedDays }) => {
              if (!endDate || !startDate) {
                return null;
              }

              const currentlyServing = endDate > startOfToday();

              return (
                <SecureDetailsContent key={`${sentenceId}-${startDate}`}>
                  {currentlyServing ? "Serving" : "Served"} sentence{" "}
                  {sentenceId} from {formatWorkflowsDate(startDate)} to{" "}
                  {formatWorkflowsDate(endDate)} with{" "}
                  {initialTimeServedDays || "no"} initial days served
                </SecureDetailsContent>
              );
            },
          )
        )}
      </DetailsList>
    </DetailsSection>
  );
}

function UsArReleaseDates({
  metadata: { eligibilityDate, eligibilityDateName, maximumReleaseDate },
}: {
  metadata: ResidentMetadata<"US_AR">;
}): React.ReactElement<any> {
  return (
    <DetailsSection>
      <DetailsHeading>Release Dates</DetailsHeading>
      <DetailsList>
        <DetailsSubheading>{eligibilityDateName}</DetailsSubheading>
        <SecureDetailsContent>
          {formatWorkflowsDate(eligibilityDate)}
        </SecureDetailsContent>
        <DetailsSubheading>Maximum Release Date</DetailsSubheading>
        <SecureDetailsContent>
          {formatWorkflowsDate(maximumReleaseDate)}
        </SecureDetailsContent>
      </DetailsList>
    </DetailsSection>
  );
}

function UsArProgramming({
  metadata: { programAchievement },
}: {
  metadata: ResidentMetadata<"US_AR">;
}): React.ReactElement<any> {
  return (
    <DetailsSection>
      <DetailsHeading>Programming</DetailsHeading>
      <SecureDetailsContent>
        {programAchievement.length === 0 ? (
          "None"
        ) : (
          <DetailsList>
            {programAchievement.map(
              ({
                programAchievementDate,
                programType,
                programEvaluationScore,
                programLocation,
              }) => (
                <React.Fragment
                  key={`${programType}-${programAchievementDate}`}
                >
                  <DetailsSubheading>Program: {programType}</DetailsSubheading>
                  <SecureDetailsContent>
                    Completed at {programLocation} on{" "}
                    {formatWorkflowsDate(programAchievementDate)}
                    {programEvaluationScore &&
                      ` with an evaluation score of ${programEvaluationScore}`}
                  </SecureDetailsContent>
                </React.Fragment>
              ),
            )}
          </DetailsList>
        )}
      </SecureDetailsContent>
    </DetailsSection>
  );
}
