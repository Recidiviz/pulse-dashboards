// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { useState } from "react";

import { Checkbox, CheckboxGroup, Icon } from "~design-system";

import { InfoBanner } from "./InfoBanner";
import {
  AgreeButton,
  BackButton,
  TermsActionRow,
  TermsAgreementRow,
  TermsBody,
  TermsHeading,
} from "./TermsOfUseStep.styles";

const TERMS_OF_USE_INTRO =
  'By clicking "Download," or by downloading, accessing, or using this data, you agree to the following terms:';

const TERMS_OF_USE_ITEMS = [
  {
    heading: "No Re-identification, Linkage, or Contact.",
    body: "You will not attempt to identify, re-identify, contact, or learn the identity of any individual from this data, including by linking or combining it with other data sources. If you inadvertently discover the identity of any individual, you will not use, disclose, or further share that information.",
  },
  {
    heading: "No Automated Extraction or Circumvention.",
    body: "You will not use automated tools, scripts, bots, scraping, or similar methods to access, copy, repeatedly download, or systematically extract data from this dashboard or to circumvent any access controls, rate limits, or technical safeguards.",
  },
  {
    heading: "No Individual-Level Databases or Redistribution.",
    body: "You will not use this data to create, update, publish, sell, license, or distribute any database, dataset, or other product that contains or enables access to individual-level records, whether or not searchable.",
  },
  {
    heading: "Compliance with Applicable Law; No Discriminatory Use.",
    body: "You will use this data only in compliance with applicable law, including the anti-discrimination provisions of Executive Law § 296(15) and Correction Law § 752, and you will not use the data to unlawfully deny or restrict employment, housing, insurance, credit, benefits, services, or other opportunities.",
  },
  {
    heading: "No Retention or Use Beyond Permissible Period.",
    body: "You will not retain, use, disclose, or rely on data beyond five years from the date of download without re-downloading a current version from the dashboard. You acknowledge that records may be sealed, expunged, or otherwise removed from public disclosure under applicable law, and you will not retain, use, disclose, or rely on data that you know or reasonably should know relates to records that are no longer subject to public disclosure.",
  },
  {
    heading: "Remedies.",
    body: "Any violation of these terms may result in immediate termination of your access to this data and the dashboard, as well as the exercise of all rights and remedies available at law or in equity.",
  },
];

const AGREE_CHECKBOX_VALUE = "agree";

type TermsOfUseStepProps = {
  /**
   * When a single month/year snapshot was chosen on the previous step,
   * describes it (e.g. "March 2024 snapshot — complete and unfiltered.") so
   * the user can confirm their selection before agreeing to the terms.
   * Omitted for the bulk "every month" option.
   */
  snapshotInfoBannerText?: string;
  onBack: () => void;
  onAgree: () => void;
};

export function TermsOfUseStep({
  snapshotInfoBannerText,
  onBack,
  onAgree,
}: TermsOfUseStepProps) {
  const [hasAgreed, setHasAgreed] = useState(false);

  const handleAgree = () => {
    setHasAgreed(false);
    onAgree();
  };

  return (
    <>
      <TermsHeading>Terms of use</TermsHeading>
      {snapshotInfoBannerText && (
        <InfoBanner>
          <Icon kind="Info" size={14} />
          <span>{snapshotInfoBannerText}</span>
        </InfoBanner>
      )}
      <TermsBody>
        <p>{TERMS_OF_USE_INTRO}</p>
        <ol>
          {TERMS_OF_USE_ITEMS.map((item) => (
            <li key={item.heading}>
              <b>{item.heading}</b> {item.body}
            </li>
          ))}
        </ol>
      </TermsBody>
      <TermsAgreementRow>
        <CheckboxGroup
          value={hasAgreed ? [AGREE_CHECKBOX_VALUE] : []}
          onChange={(value) =>
            setHasAgreed(value.includes(AGREE_CHECKBOX_VALUE))
          }
          orientation="horizontal"
          ariaLabel="Terms of use agreement"
        >
          <Checkbox value={AGREE_CHECKBOX_VALUE}>
            I have read and agree to the terms of use for individual-level data.
          </Checkbox>
        </CheckboxGroup>
      </TermsAgreementRow>
      <TermsActionRow>
        <BackButton kind="borderless" onClick={onBack}>
          Back
        </BackButton>
        <AgreeButton kind="primary" disabled={!hasAgreed} onClick={handleAgree}>
          Agree &amp; download
        </AgreeButton>
      </TermsActionRow>
    </>
  );
}
