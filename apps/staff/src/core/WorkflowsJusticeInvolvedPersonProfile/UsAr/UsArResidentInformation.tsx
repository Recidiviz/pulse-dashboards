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
}: ResidentProfileProps): React.ReactElement | null {
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
}): React.ReactElement {
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
              {formatWorkflowsDate(new Date(gedCompletionDate))}
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
}): React.ReactElement {
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
              return !endDate || !startDate ? undefined : (
                <SecureDetailsContent key={`${sentenceId}-${startDate}`}>
                  {new Date(endDate) > new Date() ? "Serving" : "Served"}{" "}
                  sentence {sentenceId} from{" "}
                  {formatWorkflowsDate(new Date(startDate))} to{" "}
                  {formatWorkflowsDate(new Date(endDate))} with{" "}
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
  metadata: { paroleEligibilityDate, maxFlatReleaseDate, projectedReleaseDate },
}: {
  metadata: ResidentMetadata<"US_AR">;
}): React.ReactElement {
  return (
    <DetailsSection>
      <DetailsHeading>Release Dates</DetailsHeading>
      <DetailsList>
        <DetailsSubheading>Parole Eligibility Date</DetailsSubheading>
        <SecureDetailsContent>
          {formatWorkflowsDate(new Date(paroleEligibilityDate))}
        </SecureDetailsContent>
        <DetailsSubheading>Projected Release Date</DetailsSubheading>
        <SecureDetailsContent>
          {formatWorkflowsDate(new Date(projectedReleaseDate))}
        </SecureDetailsContent>
        <DetailsSubheading>Max Flat Release Date</DetailsSubheading>
        <SecureDetailsContent>
          {formatWorkflowsDate(new Date(maxFlatReleaseDate))}
        </SecureDetailsContent>
      </DetailsList>
    </DetailsSection>
  );
}

function UsArProgramming({
  metadata: { programAchievement },
}: {
  metadata: ResidentMetadata<"US_AR">;
}): React.ReactElement {
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
                    {formatWorkflowsDate(new Date(programAchievementDate))}
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
