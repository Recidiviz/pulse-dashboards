// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import {
  Icon,
  IconSVG,
  palette,
  spacing,
  TooltipTrigger,
} from "@recidiviz/design-system";
import { isEqual } from "date-fns";
import { rem } from "polished";
import React from "react";
import styled from "styled-components/macro";

import type { Client } from "../../../PracticesStore/Client";
import { formatPracticesDate } from "../../../utils";
import { formatRelativeToNow } from "../../utils/timePeriod";
import { ClientProfileProps } from "../types";
import { StatusPalette } from "./common";

function getEligibilityCriteria(
  client: Client
): { text: string; tooltip?: string }[] {
  if (!client.compliantReportingEligible) return [];

  const {
    supervisionLevel,
    supervisionLevelStart,
    compliantReportingEligible: {
      eligibilityCategory,
      eligibleLevelStart,
      sanctionsPastYear,
      drugScreensPastYear,
      currentOffenses,
      lifetimeOffensesExpired,
      mostRecentArrestCheck,
      finesFeesEligible,
      pastOffenses,
      zeroToleranceCodes,
    },
    specialConditionsFlag,
    lastSpecialConditionsNote,
    specialConditionsTerminatedDate,
    feeExemptions,
  } = client;

  // current level by default
  let requiredSupervisionLevel = `${supervisionLevel.toLowerCase()} supervision`;
  // if eligible start is not the same as current level start,
  // this indicates they moved up or down a level but qualify under medium
  if (
    supervisionLevelStart &&
    eligibleLevelStart &&
    !isEqual(supervisionLevelStart, eligibleLevelStart)
  ) {
    requiredSupervisionLevel = "medium supervision or less";
  }

  let supervisionDurationText: string;
  let supervisionDurationTooltip: string;
  if (eligibilityCategory === "c4") {
    supervisionDurationText = "ICOTS";
    supervisionDurationTooltip = `All misdemeanor cases and ICOTS minimum cases shall automatically 
      transfer to Compliant Reporting after intake and after the completion of the risk needs 
      assessment pursuant to Policy #704.01.1.`;
  } else {
    supervisionDurationText = `On ${requiredSupervisionLevel} for ${formatRelativeToNow(
      // this date should only ever be missing for ICOTS cases,
      // since it's not actually part of their eligibility criteria
      eligibleLevelStart as Date
    )}`;
    supervisionDurationTooltip = `Policy requirement: On minimum supervision level for 1 year
      or medium level for 18 months.`;
  }

  let feeText =
    "Fee balance for current sentence less than $2,000 and has made payments on three consecutive months";
  if (finesFeesEligible === "exempt") {
    feeText = `Exemption: ${feeExemptions}`;
  } else if (finesFeesEligible === "low_balance") {
    feeText = "Fee balance less than $500";
  }

  // legacy version
  let specialConditionsText: string;

  switch (specialConditionsFlag) {
    case "current":
      specialConditionsText = `Special conditions up to date, last SPEC on ${formatPracticesDate(
        lastSpecialConditionsNote
      )}`;
      break;
    case "none":
      specialConditionsText = "No special conditions";
      break;
    case "terminated":
      specialConditionsText = `SPET on ${formatPracticesDate(
        specialConditionsTerminatedDate
      )}`;
      break;
    default:
      // this can happen while schema is in transition, or if we get an unexpected value;
      // provides a generic fallback
      specialConditionsText = "Special conditions up to date";
      break;
  }

  let sanctionsText: string;
  if (sanctionsPastYear.length) {
    sanctionsText = `Sanctions in the past year: ${sanctionsPastYear
      .map((s) => s.type)
      .join(", ")}`;
  } else {
    sanctionsText = "No sanctions in the past year";
  }

  let lifetimeOffensesText = "No lifetime offenses";
  if (lifetimeOffensesExpired.length) {
    lifetimeOffensesText = `Lifetime offense${
      lifetimeOffensesExpired.length !== 1 ? "s" : ""
    } expired 10+ years ago: ${lifetimeOffensesExpired.join("; ")}`;
  }

  const criteria = [
    {
      text: `Currently on ${supervisionLevel.toLowerCase()} supervision level`,
      tooltip:
        "Policy requirement: Currently on medium or minimum supervision.",
    },
    {
      text: supervisionDurationText,
      tooltip: supervisionDurationTooltip,
    },
    {
      text: `Negative arrest check on ${formatPracticesDate(
        mostRecentArrestCheck
      )}`,
      tooltip: "Policy requirement: No arrests in the last 1 year.",
    },
    {
      text: sanctionsText,
      tooltip:
        "Policy requirement: No sanctions higher than Level 1 in the last 1 year.",
    },
    {
      text: feeText,
    },
    {
      text: `Passed drug screens in last 12 months: ${
        drugScreensPastYear
          .map(
            ({ result, date }) => `${result} on ${formatPracticesDate(date)}`
          )
          .join("; ") || "None"
      }`,
      tooltip: `Policy requirement: Passed drug screen in the last 12 months for non-drug offenders.
        Passed 2 drug screens in last 12 months for drug offenders, most recent is negative.`,
    },
    {
      text: specialConditionsText,
      tooltip: "Policy requirement: Special conditions are current.",
    },
    {
      text: "No DECF, DEDF, DEDU, DEIO, DEIR codes in the last 3 months",
      tooltip: `Policy requirement: Has reported as instructed without incident unless excused
        and documented by the officer.`,
    },
    {
      text: `Valid current offense${currentOffenses.length !== 1 ? "s" : ""}: ${
        currentOffenses.join("; ") || "None"
      }`,
      tooltip: `Policy requirement: Offense type not domestic abuse or sexual assault,
        DUI in past 5 years, not crime against person that resulted in physical bodily harm,
        not crime where victim was under 18.`,
    },
    {
      text: lifetimeOffensesText,
      tooltip: `Policy requirement: If the offender has a previous conviction for one of
        the crimes listed in Section VI.(A)(3) but is not currently on supervision for one
        of those crimes, then the  DD shall make a case by case determination as to whether
        an offender is suitable for CR. The DD review process is waived if the expiration date
        is more than ten years old.`,
    },
  ];

  if (eligibilityCategory === "c2" && pastOffenses.length) {
    criteria.push({
      text: `Eligible with discretion: Prior offenses and lifetime offenses
        expired less than 10 years ago: ${pastOffenses.join("; ")}`,
      tooltip: `If the offender has a previous conviction for one of the crimes listed in
        Section VI.(A)(3) but is not currently on supervision for one of those crimes,
        then the  DD shall make a case by case determination as to whether an offender
        is suitable for CR. The DD review process is waived if the expiration date is
        more than ten years old.`,
    });
  }

  if (eligibilityCategory === "c3" && zeroToleranceCodes.length) {
    criteria.push({
      text: `Eligible with discretion: Previous zero-tolerance codes ${zeroToleranceCodes
        .map(
          ({ contactNoteDate, contactNoteType }) =>
            `${contactNoteType} on ${formatPracticesDate(contactNoteDate)}`
        )
        .join("; ")}`,
      tooltip: `If the person has received a zero tolerance code since starting their
          latest supervision, they may still be eligible for compliant reporting.`,
    });
  }

  if (
    eligibilityCategory === "c3" &&
    currentOffenses.length === 0 &&
    pastOffenses.length === 0
  ) {
    criteria.push({
      text: "Eligible with discretion: Missing sentence information",
      tooltip: `If the person is missing sentencing information, they may still be
            eligible for compliant reporting.`,
    });
  }

  return criteria;
}

const CriterionIcon = styled(Icon)`
  grid-column: 1;
  /* slight vertical offset to approximate baseline alignment */
  margin-top: ${rem(1)};
`;

const CriterionContent = styled.div`
  grid-column: 2;
`;

const Wrapper = styled.ul`
  list-style: none;
  font-size: ${rem(14)};
  margin: ${rem(spacing.md)} 0;
  padding: 0;
`;

const Criterion = styled.li`
  display: grid;
  grid-template-columns: ${rem(spacing.lg)} 1fr;
  margin: 0 0 8px;
  line-height: 1.3;
`;

const KeepTogether = styled.span`
  white-space: nowrap;
`;

const InfoTooltipWrapper = styled(TooltipTrigger)`
  vertical-align: text-bottom;
`;

const InfoLink = styled.a`
  color: ${palette.slate30};

  &:hover,
  &:focus {
    color: ${palette.slate60};
  }
`;

const InfoButton = () => (
  <InfoLink
    href="https://drive.google.com/file/d/1YNAUTViqg_Pgt15KsZPUiNG11Dh2TTiB/view?usp=sharing"
    target="_blank"
    rel="noreferrer"
  >
    <Icon kind="Info" size={12} />
  </InfoLink>
);

export const CriteriaList = ({
  client,
  colors,
}: ClientProfileProps & { colors: StatusPalette }): React.ReactElement => {
  return (
    <Wrapper style={{ color: colors.text }}>
      {getEligibilityCriteria(client).map(({ text, tooltip }) => {
        // split text so we can prevent orphaned tooltips
        const textTokens = text.split(" ");
        return (
          <Criterion key={text}>
            <CriterionIcon
              kind={IconSVG.Success}
              color={colors.icon}
              size={16}
            />
            <CriterionContent>
              {textTokens.slice(0, -1).join(" ")}{" "}
              <KeepTogether>
                {textTokens.slice(-1)}{" "}
                {tooltip && (
                  <InfoTooltipWrapper contents={tooltip} maxWidth={340}>
                    <InfoButton />
                  </InfoTooltipWrapper>
                )}
              </KeepTogether>
            </CriterionContent>
          </Criterion>
        );
      })}
    </Wrapper>
  );
};
