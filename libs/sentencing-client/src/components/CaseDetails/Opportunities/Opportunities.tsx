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

import {
  CellContext,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { keyBy, mapValues, pick } from "lodash";
import moment from "moment";
import { Fragment, useState } from "react";
import toast from "react-hot-toast";

import { Case, Opportunities as OpportunitiesType } from "../../../api";
import CheckIcon from "../../assets/check-icon.svg?react";
import MagnifyingGlassIcon from "../../assets/magnifying-class-icon.svg?react";
import PlusIcon from "../../assets/plus-icon.svg?react";
import TrashIcon from "../../assets/trash-icon.svg?react";
import * as StyledDashboard from "../../Dashboard/Dashboard.styles";
import * as Styled from "../CaseDetails.styles";
import {
  ASAM_CARE_RECOMMENDATION_KEY,
  HAS_DEVELOPMENTAL_DISABILITY_KEY,
  HAS_OPEN_CHILD_PROTECTIVE_SERVICES_CASE_KEY,
  HAS_PREVIOUS_FELONY_KEY,
  HAS_PREVIOUS_SEX_OFFENSE_KEY,
  HAS_PREVIOUS_TREATMENT_COURT_KEY,
  HAS_PREVIOUS_VIOLENT_OFFENSE_KEY,
  IS_VETERAN_KEY,
  LSIR_SCORE_KEY,
  MENTAL_HEALTH_DIAGNOSES_KEY,
  NEEDS_TO_BE_ADDRESSED_KEY,
  NOT_SURE_YET_OPTION,
  PLEA_KEY,
  PREVIOUSLY_INCARCERATED_OR_UNDER_SUPERVISION_KEY,
  SUBSTANCE_USER_DISORDER_DIAGNOSIS_KEY,
} from "../constants";
import { parseAttributeValue } from "../Form/utils";
import {
  OpportunitiesIdentifier,
  RecommendationType,
  SelectedRecommendation,
} from "../types";

type OpportunitiesProps = {
  firstName?: string;
  selectedRecommendation: SelectedRecommendation;
  communityOpportunities: OpportunitiesType;
  recommendedOpportunities: OpportunitiesIdentifier;
  caseAttributes: Case;
  updateRecommendedOpportunities: (
    opportunity: OpportunitiesIdentifier[number],
  ) => void;
};

type OpportunitiesWithOppNameProviderName = (OpportunitiesType[number] & {
  opportunityNameProviderName: string;
})[];

const columns = [
  {
    header: "Opportunity & Provider",
    accessorKey: "opportunityNameProviderName",
  },
  {
    header: "Needs Addressed",
    accessorKey: "needsAddressed",
    cell: (
      needs: CellContext<
        OpportunitiesWithOppNameProviderName[number],
        OpportunitiesWithOppNameProviderName[number]["needsAddressed"]
      >,
    ) => {
      const value = parseAttributeValue(
        NEEDS_TO_BE_ADDRESSED_KEY,
        needs.getValue(),
      ) as string[];
      return (
        <div style={{ textTransform: "capitalize" }}>
          {value?.map((need) => <div key={need}>- {need}</div>)}
        </div>
      );
    },
  },
  {
    header: "",
    accessorKey: "addToRecommendationAction",
  },
];

// TODO(Recidiviz/recidiviz-data#30650) Implement Opportunities flow
export const Opportunities: React.FC<OpportunitiesProps> = ({
  firstName,
  selectedRecommendation,
  communityOpportunities,
  recommendedOpportunities,
  caseAttributes,
  updateRecommendedOpportunities,
}) => {
  const [showRemoveOnHover, setShowRemoveOnHover] = useState<{
    [column: string]: boolean;
  }>({});

  const [data] = useState(
    communityOpportunities.map((opp) => ({
      ...opp,
      opportunityNameProviderName: `${opp.opportunityName} - ${opp.providerName}`,
      opportunityNamePhoneNumber: opp.opportunityName + opp.providerPhoneNumber,
    })),
  );

  const table = useReactTable<OpportunitiesWithOppNameProviderName[number]>({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const isProbationRecommendation =
    selectedRecommendation === RecommendationType.Probation;

  const opportunitiesByNameProviderName = keyBy(
    data,
    "opportunityNameProviderName",
  );

  const opportunitiesNameProviderNameToOpportunityNamePhoneNumber = mapValues(
    opportunitiesByNameProviderName,
    (opp) => pick(opp, ["opportunityName", "providerPhoneNumber"]),
  );

  // TODO(Recidiviz/recidiviz-data#30954) - Refactor structure and move outside of component. This is placeholder for now to display the UI banner.
  const eligibilityFiltersList = [
    {
      key: "Age",
      label: "Age",
      value:
        moment().diff(caseAttributes.Client?.birthDate, "years") >= 18
          ? "Adult 18+"
          : "Minor",
    },
    {
      key: LSIR_SCORE_KEY,
      label: "LSI-R Score",
      value: parseAttributeValue(LSIR_SCORE_KEY, caseAttributes.lsirScore),
    },
    {
      key: NEEDS_TO_BE_ADDRESSED_KEY,
      label: "Needs",
      value: parseAttributeValue(
        NEEDS_TO_BE_ADDRESSED_KEY,
        caseAttributes.needsToBeAddressed,
      ),
    },
    {
      key: SUBSTANCE_USER_DISORDER_DIAGNOSIS_KEY,
      label: "Substance use disorder diagnosis",
      value: parseAttributeValue(
        SUBSTANCE_USER_DISORDER_DIAGNOSIS_KEY,
        caseAttributes.substanceUseDisorderDiagnosis,
      ),
    },
    {
      key: ASAM_CARE_RECOMMENDATION_KEY,
      label: "ASAM level of care recommendation",
      value: parseAttributeValue(
        ASAM_CARE_RECOMMENDATION_KEY,
        caseAttributes.asamCareRecommendation,
      ),
    },
    {
      key: MENTAL_HEALTH_DIAGNOSES_KEY,
      label: "Mental health diagnoses",
      value: parseAttributeValue(
        MENTAL_HEALTH_DIAGNOSES_KEY,
        caseAttributes.mentalHealthDiagnoses,
      ),
    },
    {
      key: IS_VETERAN_KEY,
      label: "Is veteran",
      value: parseAttributeValue(IS_VETERAN_KEY, caseAttributes.isVeteran),
    },
    {
      key: PREVIOUSLY_INCARCERATED_OR_UNDER_SUPERVISION_KEY,
      label: "Has a prior history of supervision/incarceration",
      value: parseAttributeValue(
        PREVIOUSLY_INCARCERATED_OR_UNDER_SUPERVISION_KEY,
        caseAttributes.previouslyIncarceratedOrUnderSupervision,
      ),
    },
    {
      key: HAS_PREVIOUS_FELONY_KEY,
      label: "Has a prior felony conviction",
      value: parseAttributeValue(
        HAS_PREVIOUS_FELONY_KEY,
        caseAttributes.hasPreviousFelonyConviction,
      ),
    },
    {
      key: HAS_PREVIOUS_VIOLENT_OFFENSE_KEY,
      label: "Has a previous violent offense",
      value: parseAttributeValue(
        HAS_PREVIOUS_VIOLENT_OFFENSE_KEY,
        caseAttributes.hasPreviousViolentOffenseConviction,
      ),
    },
    {
      key: HAS_PREVIOUS_SEX_OFFENSE_KEY,
      label: "Has a previous sex offense",
      value: parseAttributeValue(
        HAS_PREVIOUS_SEX_OFFENSE_KEY,
        caseAttributes.hasPreviousSexOffenseConviction,
      ),
    },
    {
      key: HAS_PREVIOUS_TREATMENT_COURT_KEY,
      label: "Has previously participated in a treatment court",
      value: parseAttributeValue(
        HAS_PREVIOUS_TREATMENT_COURT_KEY,
        caseAttributes.hasPreviousTreatmentCourt,
      ),
    },
    {
      key: HAS_DEVELOPMENTAL_DISABILITY_KEY,
      label: "Has a developmental disability",
      value: parseAttributeValue(
        HAS_DEVELOPMENTAL_DISABILITY_KEY,
        caseAttributes.hasDevelopmentalDisability,
      ),
    },
    {
      key: HAS_OPEN_CHILD_PROTECTIVE_SERVICES_CASE_KEY,
      label: "Has an open child protective services case",
      value: parseAttributeValue(
        HAS_OPEN_CHILD_PROTECTIVE_SERVICES_CASE_KEY,
        caseAttributes.hasOpenChildProtectiveServicesCase,
      ),
    },
    {
      key: PLEA_KEY,
      label: "Plea",
      value: parseAttributeValue(PLEA_KEY, caseAttributes.plea),
    },
  ];

  const currentDetailsApplied = eligibilityFiltersList.map((detail) => {
    if (
      detail.value === null ||
      detail.value === NOT_SURE_YET_OPTION ||
      (Array.isArray(detail.value) && detail.value && !detail.value.length)
    )
      return;
    return (
      <Fragment key={detail.key}>
        <span style={{ fontWeight: 600 }}>{detail.label}: </span>
        {Array.isArray(detail.value)
          ? detail.value.join(", ")
          : detail.value?.toString()}
        {"; "}
      </Fragment>
    );
  });

  const addToRecommendationButtonContent = (
    rowId: string,
    isAddedOpportunity: boolean,
  ) => {
    return (
      <>
        {showRemoveOnHover[rowId] && (
          <>
            <TrashIcon /> Remove
          </>
        )}
        {!showRemoveOnHover[rowId] &&
          (isAddedOpportunity ? (
            <>
              <CheckIcon /> Added
            </>
          ) : (
            <>
              <PlusIcon /> Add to Recommendation
            </>
          ))}
      </>
    );
  };

  const toggleAddRemoveOpportunity = (
    opportunityNameProviderName: string,
    rowId: string,
  ) => {
    const isRemovingOpportunity = recommendedOpportunities.find(
      (opp) =>
        opportunitiesNameProviderNameToOpportunityNamePhoneNumber[
          opportunityNameProviderName
        ].opportunityName === opp.opportunityName,
    );

    updateRecommendedOpportunities(
      opportunitiesNameProviderNameToOpportunityNamePhoneNumber[
        opportunityNameProviderName
      ],
    );

    toast(
      `An opportunity has been ${isRemovingOpportunity ? `removed from` : `added to`} your
    Recommendation`,
    );

    if (isRemovingOpportunity) {
      setShowRemoveOnHover((prev) => ({
        ...prev,
        [rowId]: false,
      }));
    }
  };

  return (
    <Styled.Opportunities>
      <Styled.Title>
        Opportunities for {firstName} <Styled.InfoIcon />
      </Styled.Title>
      <Styled.Description>
        <span>
          The following opportunities are available to {firstName} based on the
          details of his case and personal information.
        </span>
        <span>
          Explore and add any opportunities that would set {firstName} up for
          success on probation.
        </span>
      </Styled.Description>
      <Styled.OpportunitiesTableWrapper>
        <Styled.CaseDetailsApplied>
          <Styled.CaseDetailsAppliedTitle>
            Current details applied
          </Styled.CaseDetailsAppliedTitle>
          <Styled.CaseDetailsAppliedList>
            {currentDetailsApplied}
          </Styled.CaseDetailsAppliedList>
        </Styled.CaseDetailsApplied>
        <Styled.Search>
          <MagnifyingGlassIcon />
          <Styled.SearchInput type="text" placeholder="Search" />
        </Styled.Search>

        <Styled.TableWrapper>
          {/* Caption for non-Probation selections */}
          {!isProbationRecommendation && (
            <Styled.OpportunitiesNotAvailable>
              Community opportunities are only available for Probation
              participants
            </Styled.OpportunitiesNotAvailable>
          )}

          {/* Table */}
          <Styled.Table disabled={!isProbationRecommendation}>
            <StyledDashboard.TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <StyledDashboard.Row key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <Styled.HeaderCell key={header.id} colSpan={header.colSpan}>
                      <StyledDashboard.SortableHeader
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </StyledDashboard.SortableHeader>
                    </Styled.HeaderCell>
                  ))}
                </StyledDashboard.Row>
              ))}
            </StyledDashboard.TableHeader>
            <StyledDashboard.TableBody>
              {table.getRowModel().rows.map((row) => (
                <Styled.TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => {
                    const isAddedOpportunity = Boolean(
                      recommendedOpportunities.find(
                        (opp) =>
                          opp.opportunityName ===
                            opportunitiesNameProviderNameToOpportunityNamePhoneNumber[
                              cell.row.original.opportunityNameProviderName
                            ].opportunityName &&
                          opp.providerPhoneNumber ===
                            opportunitiesNameProviderNameToOpportunityNamePhoneNumber[
                              cell.row.original.opportunityNameProviderName
                            ].providerPhoneNumber,
                      ),
                    );

                    return (
                      <StyledDashboard.Cell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}

                        {/* Add To Recommendation Button */}
                        {cell.column.id === "addToRecommendationAction" && (
                          <Styled.AddRecommendationButton
                            onClick={() => {
                              const opportunityNameProviderName =
                                cell.row.original.opportunityNameProviderName;
                              toggleAddRemoveOpportunity(
                                opportunityNameProviderName,
                                row.id,
                              );
                            }}
                            isAdded={isAddedOpportunity}
                            onMouseEnter={() =>
                              isAddedOpportunity &&
                              setShowRemoveOnHover((prev) => ({
                                ...prev,
                                [row.id]: true,
                              }))
                            }
                            onMouseLeave={() =>
                              setShowRemoveOnHover((prev) => ({
                                ...prev,
                                [row.id]: false,
                              }))
                            }
                          >
                            {addToRecommendationButtonContent(
                              row.id,
                              isAddedOpportunity,
                            )}
                          </Styled.AddRecommendationButton>
                        )}
                      </StyledDashboard.Cell>
                    );
                  })}
                </Styled.TableRow>
              ))}

              {/* No opportunities to display */}
              {data.length === 0 && (
                <StyledDashboard.Row>
                  <StyledDashboard.Cell>
                    No opportunities available to display
                  </StyledDashboard.Cell>
                </StyledDashboard.Row>
              )}
            </StyledDashboard.TableBody>
          </Styled.Table>
        </Styled.TableWrapper>
      </Styled.OpportunitiesTableWrapper>
    </Styled.Opportunities>
  );
};
