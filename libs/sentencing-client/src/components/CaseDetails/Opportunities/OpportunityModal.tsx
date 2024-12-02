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

import { observer } from "mobx-react-lite";
import moment from "moment";

import { Opportunities as OpportunitiesType } from "../../../api";
import { Modal } from "../../Modal/Modal";
import { Tooltip } from "../../Tooltip/Tooltip";
import * as Styled from "../CaseDetails.styles";
import { NeedsIcons } from "../components/NeedsIcons/NeedsIcons";
import { NEEDS_TO_BE_ADDRESSED_KEY } from "../constants";
import { parseAttributeValue } from "../Form/utils";
import { RecommendationType } from "../types";
import {
  ASAM_CARE_RECOMMENDATION_CRITERIA_KEY,
  DIAGNOSED_SUBSTANCE_USE_SEVERITY_CRITERIA_KEY,
  eligibilityCriteriaToLabelName,
  MAX_AGE_KEY,
  MAX_LSIR_SCORE_CRITERIA_KEY,
  MIN_AGE_KEY,
  MIN_LSIR_SCORE_CRITERIA_KEY,
  OPPORTUNITY_TOOLTIP_WIDTH,
} from "./constants";
import { EligibilityCriteria } from "./types";
import {
  createOpportunityProviderDisplayName,
  formatPhoneNumberWithExtension,
  getEligibilityCriteria,
  getOpportunityButtonTooltipText,
} from "./utils";

type OpportunityModalProps = {
  isOpen: boolean;
  selectedOpportunity?: OpportunitiesType[number];
  isAddedOpportunity: boolean;
  selectedRecommendation?: string | null;
  hideModal: () => void;
  toggleOpportunity: () => void;
};

const displayEligibilityCriterias = (
  key: keyof EligibilityCriteria,
  value: number | string | string[] | boolean | null | undefined,
) => {
  const isArray = Array.isArray(value);
  const shouldDisplayLabelValue = [
    MIN_LSIR_SCORE_CRITERIA_KEY,
    MAX_LSIR_SCORE_CRITERIA_KEY,
    ASAM_CARE_RECOMMENDATION_CRITERIA_KEY,
    DIAGNOSED_SUBSTANCE_USE_SEVERITY_CRITERIA_KEY,
    MIN_AGE_KEY,
    MAX_AGE_KEY,
  ].includes(key);
  const label = eligibilityCriteriaToLabelName[key];
  // We only need to display the `<label>: <val>` for LSI-R score and lists, because `val` for all other
  // properties will be a boolean, which we can represent by only displaying the descriptive `label`
  const val =
    shouldDisplayLabelValue || isArray
      ? parseAttributeValue(key, value)
      : undefined;

  return Array.isArray(val) ? (
    <div key={key}>
      {label}: {val?.map((item) => <div key={item}>&bull; {item}</div>)}
    </div>
  ) : (
    <div
      style={{ textIndent: "-14px", marginLeft: "14px" }} // Hanging indent
      key={key}
    >{`- ${label}${val ? `: ${val}` : ``}`}</div>
  );
};

function isValidURL(url?: string | null) {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

const normalizeURL = (url: string) => {
  const protocolRegex = /^https?:\/\//i;
  const hasProtocol = protocolRegex.test(url);
  const encodedURI = encodeURI(url);
  if (!hasProtocol) return `https://${encodedURI}`;
  return encodedURI;
};

const OpportunityModal: React.FC<OpportunityModalProps> = ({
  isOpen,
  selectedOpportunity,
  hideModal,
  toggleOpportunity,
  isAddedOpportunity,
  selectedRecommendation,
}) => {
  if (!selectedOpportunity) return null;
  const needsAddressed =
    (parseAttributeValue(
      NEEDS_TO_BE_ADDRESSED_KEY,
      selectedOpportunity.needsAddressed,
    ) as string[]) ?? [];
  const eligibilityCriteria = getEligibilityCriteria(selectedOpportunity);
  const eligibilityCriteriaEntries = Object.entries(eligibilityCriteria);
  const providerURL =
    selectedOpportunity.providerWebsite &&
    isValidURL(selectedOpportunity.providerWebsite)
      ? new URL(normalizeURL(selectedOpportunity.providerWebsite)).href
      : undefined;

  return (
    <Modal isOpen={isOpen} hideModal={hideModal}>
      <Styled.ModalHeaderWrapper>
        <Styled.ModalHeader>
          {createOpportunityProviderDisplayName(
            selectedOpportunity.opportunityName,
            selectedOpportunity.providerName,
          )}
        </Styled.ModalHeader>
        {selectedOpportunity.lastUpdatedAt && (
          <Styled.SectionLabel>
            Last updated{" "}
            {moment(selectedOpportunity.lastUpdatedAt)
              .utc()
              .format("MM/DD/YYYY")}
          </Styled.SectionLabel>
        )}
      </Styled.ModalHeaderWrapper>

      <Styled.ModalBody>
        <Styled.Section>
          <Styled.SectionLabel>Description</Styled.SectionLabel>
          <Styled.SectionContent>
            {selectedOpportunity.description}
          </Styled.SectionContent>
        </Styled.Section>

        {providerURL && (
          <Styled.Section>
            <Styled.SectionLabel>Provider</Styled.SectionLabel>
            <Styled.SectionContent
              isLink={providerURL !== undefined}
              onClick={() => {
                if (!providerURL) {
                  return;
                }
                return window.open(
                  providerURL,
                  "_blank",
                  "noopener,noreferrer",
                );
              }}
            >
              {selectedOpportunity.providerName ??
                selectedOpportunity.opportunityName}
            </Styled.SectionContent>
          </Styled.Section>
        )}

        <Styled.SectionRowWrapper>
          {selectedOpportunity.providerPhoneNumber && (
            <Styled.Section>
              <Styled.SectionLabel>Phone</Styled.SectionLabel>
              <Styled.SectionContent>
                {formatPhoneNumberWithExtension(
                  selectedOpportunity.providerPhoneNumber,
                )}
              </Styled.SectionContent>
            </Styled.Section>
          )}
          {selectedOpportunity.providerAddress && (
            <Styled.Section>
              <Styled.SectionLabel>Address</Styled.SectionLabel>
              <Styled.SectionContent>
                {selectedOpportunity.providerAddress}
              </Styled.SectionContent>
            </Styled.Section>
          )}
        </Styled.SectionRowWrapper>

        <Styled.SectionRowWrapper>
          {needsAddressed.length > 0 && (
            <Styled.Section>
              <Styled.SectionLabel>Needs Addressed</Styled.SectionLabel>
              <Styled.SectionContent>
                {needsAddressed.map((need) => {
                  return (
                    <Styled.Need key={need}>
                      {NeedsIcons[need]} {need}
                    </Styled.Need>
                  );
                })}
              </Styled.SectionContent>
            </Styled.Section>
          )}
          {eligibilityCriteriaEntries.length > 0 && (
            <Styled.Section>
              <Styled.SectionLabel>Eligibility Criteria</Styled.SectionLabel>
              <Styled.SectionContent>
                {eligibilityCriteriaEntries.map(([key, value]) =>
                  displayEligibilityCriterias(
                    key as keyof EligibilityCriteria,
                    value,
                  ),
                )}
              </Styled.SectionContent>
            </Styled.Section>
          )}
        </Styled.SectionRowWrapper>

        <Styled.SectionRowWrapper>
          {selectedOpportunity.additionalNotes && (
            <Styled.Section>
              <Styled.SectionLabel>Additional Notes</Styled.SectionLabel>
              <Styled.SectionContent>
                {selectedOpportunity.additionalNotes}
              </Styled.SectionContent>
            </Styled.Section>
          )}
        </Styled.SectionRowWrapper>
      </Styled.ModalBody>

      <Styled.StickyActionButtonWrapper>
        <Styled.ActionButton kind="link" onClick={hideModal}>
          Cancel
        </Styled.ActionButton>
        <Tooltip
          disabled={selectedRecommendation === RecommendationType.Probation}
          width={OPPORTUNITY_TOOLTIP_WIDTH}
          content={getOpportunityButtonTooltipText(
            isAddedOpportunity,
            selectedRecommendation,
          )}
        >
          <Styled.ActionButton
            disabled={selectedRecommendation !== RecommendationType.Probation}
            onClick={() => {
              hideModal();
              toggleOpportunity();
            }}
          >
            {isAddedOpportunity
              ? "Remove Recommendation"
              : "+ Add to recommendation"}
          </Styled.ActionButton>
        </Tooltip>
      </Styled.StickyActionButtonWrapper>
    </Modal>
  );
};

export default observer(OpportunityModal);
