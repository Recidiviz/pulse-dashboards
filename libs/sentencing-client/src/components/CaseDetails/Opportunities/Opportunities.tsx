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
  getFilteredRowModel,
  getPaginationRowModel,
  PaginationState,
  useReactTable,
} from "@tanstack/react-table";
import { keyBy, mapValues, pick } from "lodash";
import { Fragment, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { CaseStore } from "../../../../src/datastores/CaseStore";
import { Opportunities as OpportunitiesType } from "../../../api";
import { OpportunityViewOrigin } from "../../../datastores/types";
import { formatPossessiveName } from "../../../utils/utils";
import CheckIcon from "../../assets/check-icon.svg?react";
import ResetSearchIcon from "../../assets/close-icon.svg?react";
import LeftArrowIcon from "../../assets/left-arrow-carot-icon.svg?react";
import MagnifyingGlassIcon from "../../assets/magnifying-class-icon.svg?react";
import PlusIcon from "../../assets/plus-icon.svg?react";
import RightArrowIcon from "../../assets/right-arrow-carot-icon.svg?react";
import TrashIcon from "../../assets/trash-icon.svg?react";
import * as StyledDashboard from "../../Dashboard/Dashboard.styles";
import { InfoIconWithTooltip, Tooltip } from "../../Tooltip/Tooltip";
import { TooltipContentSection } from "../../Tooltip/Tooltip.styles";
import * as Styled from "../CaseDetails.styles";
import { NeedsIcons } from "../components/NeedsIcons/NeedsIcons";
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
  PLEA_KEY,
  PREVIOUSLY_INCARCERATED_OR_UNDER_SUPERVISION_KEY,
  SUBSTANCE_USER_DISORDER_DIAGNOSIS_KEY,
} from "../constants";
import { NOT_SURE_YET_OPTION } from "../Form/constants";
import {
  parseAsamCareRecommendationValue,
  parseBooleanValue,
  parseMentalHealthDiagnosesValue,
  parseNeedsToBeAddressedValue,
  parsePleaValue,
} from "../Form/utils";
import {
  OpportunitiesIdentifier,
  RecommendationType,
  SelectedRecommendation,
} from "../types";
import { OPPORTUNITY_TOOLTIP_WIDTH } from "./constants";
import OpportunityModal from "./OpportunityModal";
import {
  createOpportunityProviderDisplayName,
  getOpportunityButtonTooltipText,
} from "./utils";

type OpportunitiesProps = {
  firstName?: string;
  selectedRecommendation: SelectedRecommendation;
  communityOpportunities: OpportunitiesType;
  recommendedOpportunities: OpportunitiesIdentifier;
  caseAttributes: CaseStore["caseAttributes"];
  updateRecommendedOpportunities: (
    opportunity: OpportunitiesIdentifier[number],
  ) => void;
  analytics: {
    trackOpportunityModalOpened: (opportunityNameProviderName: string) => void;
    trackAddOpportunityToRecommendationClicked: (
      opportunityNameProviderName: string,
      origin: OpportunityViewOrigin,
    ) => void;
    trackRemoveOpportunityFromRecommendationClicked: (
      opportunityNameProviderName: string,
      origin: OpportunityViewOrigin,
    ) => void;
  };
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
      const value = parseNeedsToBeAddressedValue(needs.getValue());
      return (
        <Styled.NeedsWrapper>
          {value?.map((need) => (
            <div key={need}>
              {NeedsIcons[need]} {need}
            </div>
          ))}
        </Styled.NeedsWrapper>
      );
    },
  },
  {
    header: "",
    accessorKey: "addToRecommendationAction",
  },
];

const normalizeCommunityOpportunities = (
  communityOpportunities: OpportunitiesType,
) => {
  return communityOpportunities.map((opp) => ({
    ...opp,
    opportunityNameProviderName: createOpportunityProviderDisplayName(
      opp.opportunityName,
      opp.providerName,
    ),
  }));
};

export const Opportunities: React.FC<OpportunitiesProps> = ({
  firstName,
  selectedRecommendation,
  communityOpportunities,
  recommendedOpportunities,
  caseAttributes,
  analytics,
  updateRecommendedOpportunities,
}) => {
  const {
    trackOpportunityModalOpened,
    trackAddOpportunityToRecommendationClicked,
    trackRemoveOpportunityFromRecommendationClicked,
  } = analytics;

  const [showRemoveOnHover, setShowRemoveOnHover] = useState<{
    [column: string]: boolean;
  }>({});
  const [showOpportunityModal, setShowOpportunityModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] =
    useState<OpportunitiesType[number]>();
  const [selectedRowId, setSelectedRowId] = useState<string>();
  const [data, setData] = useState(
    normalizeCommunityOpportunities(communityOpportunities),
  );
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 7,
  });

  const table = useReactTable<OpportunitiesWithOppNameProviderName[number]>({
    data,
    columns,
    state: {
      globalFilter,
      pagination,
    },
    autoResetPageIndex: false,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
  });

  const totalRowCount = table.getRowCount();
  const hasPagination = totalRowCount > pagination.pageSize;
  const pageStart =
    table.getState().pagination.pageIndex * pagination.pageSize + 1;
  const pageEnd = Math.min(
    (table.getState().pagination.pageIndex + 1) * pagination.pageSize,
    totalRowCount,
  );
  const pagePrompt =
    pageStart === pageEnd ? pageEnd : `${pageStart} – ${pageEnd}`;

  const isProbationRecommendation =
    selectedRecommendation === RecommendationType.Probation;

  const opportunitiesByNameProviderName = keyBy(
    data,
    "opportunityNameProviderName",
  );

  const opportunityDisplayNameToOpportunityNameProviderName = mapValues(
    opportunitiesByNameProviderName,
    (opp) =>
      pick(opp, ["opportunityName", "providerName", "genericDescription"]),
  );

  // TODO(Recidiviz/recidiviz-data#30954) - Refactor structure and move outside of component. This is placeholder for now to display the UI banner.
  const eligibilityFiltersList = [
    {
      key: "Age",
      label: "Age",
      value: caseAttributes.age,
    },
    {
      key: LSIR_SCORE_KEY,
      label: "LSI-R Score",
      value: caseAttributes.lsirScore,
    },
    {
      key: NEEDS_TO_BE_ADDRESSED_KEY,
      label: "Needs",
      value: parseNeedsToBeAddressedValue(caseAttributes.needsToBeAddressed),
    },
    {
      key: SUBSTANCE_USER_DISORDER_DIAGNOSIS_KEY,
      label: "Substance use disorder diagnosis",
      value: caseAttributes.substanceUseDisorderDiagnosis,
    },
    {
      key: ASAM_CARE_RECOMMENDATION_KEY,
      label: "ASAM level of care recommendation",
      value: parseAsamCareRecommendationValue(
        caseAttributes.asamCareRecommendation,
      ),
    },
    {
      key: MENTAL_HEALTH_DIAGNOSES_KEY,
      label: "Mental health diagnoses",
      value: parseMentalHealthDiagnosesValue(
        caseAttributes.mentalHealthDiagnoses,
      ),
    },
    {
      key: IS_VETERAN_KEY,
      label: "Is veteran",
      value: parseBooleanValue(caseAttributes.isVeteran),
    },
    {
      key: PREVIOUSLY_INCARCERATED_OR_UNDER_SUPERVISION_KEY,
      label: "Has a prior history of supervision/incarceration",
      value: parseBooleanValue(
        caseAttributes.previouslyIncarceratedOrUnderSupervision,
      ),
    },
    {
      key: HAS_PREVIOUS_FELONY_KEY,
      label: "Has a prior felony conviction",
      value: parseBooleanValue(caseAttributes.hasPreviousFelonyConviction),
    },
    {
      key: HAS_PREVIOUS_VIOLENT_OFFENSE_KEY,
      label: "Has a previous violent offense",
      value: parseBooleanValue(
        caseAttributes.hasPreviousViolentOffenseConviction,
      ),
    },
    {
      key: HAS_PREVIOUS_SEX_OFFENSE_KEY,
      label: "Has a previous sex offense",
      value: parseBooleanValue(caseAttributes.hasPreviousSexOffenseConviction),
    },
    {
      key: HAS_PREVIOUS_TREATMENT_COURT_KEY,
      label: "Has previously participated in a treatment court",
      value: parseBooleanValue(caseAttributes.hasPreviousTreatmentCourt),
    },
    {
      key: HAS_DEVELOPMENTAL_DISABILITY_KEY,
      label: "Has a developmental disability",
      value: parseBooleanValue(caseAttributes.hasDevelopmentalDisability),
    },
    {
      key: HAS_OPEN_CHILD_PROTECTIVE_SERVICES_CASE_KEY,
      label: "Has an open child protective services case",
      value: parseBooleanValue(
        caseAttributes.hasOpenChildProtectiveServicesCase,
      ),
    },
    {
      key: PLEA_KEY,
      label: "Plea",
      value: parsePleaValue(caseAttributes.plea),
    },
  ];

  const filteredCurrentDetailsApplied = eligibilityFiltersList.filter(
    (detail) => {
      if (
        detail.value === null ||
        detail.value === NOT_SURE_YET_OPTION ||
        (Array.isArray(detail.value) && detail.value && !detail.value.length)
      ) {
        return false;
      }
      return true;
    },
  );

  const currentDetailsApplied = filteredCurrentDetailsApplied.map(
    (detail, idx) => {
      return (
        <Fragment key={detail.key}>
          <span style={{ fontWeight: 600 }}>{detail.label}: </span>
          {Array.isArray(detail.value)
            ? detail.value.join(", ")
            : detail.value?.toString()}
          {idx === filteredCurrentDetailsApplied.length - 1 ? "" : "; "}
        </Fragment>
      );
    },
  );

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

  const toggleOpportunity = (
    opportunityNameProviderName: string,
    origin: "table" | "modal",
    rowId?: string,
  ) => {
    const isRemovingOpportunity = recommendedOpportunities.find(
      (opp) =>
        opportunityDisplayNameToOpportunityNameProviderName[
          opportunityNameProviderName
        ].opportunityName === opp.opportunityName,
    );

    updateRecommendedOpportunities(
      opportunityDisplayNameToOpportunityNameProviderName[
        opportunityNameProviderName
      ],
    );

    toast(
      `An opportunity has been ${isRemovingOpportunity ? `removed from` : `added to`} your
    Recommendation`,
    );

    if (isRemovingOpportunity) {
      trackRemoveOpportunityFromRecommendationClicked(
        opportunityNameProviderName,
        origin,
      );

      if (rowId) {
        setShowRemoveOnHover((prev) => ({
          ...prev,
          [rowId]: false,
        }));
      }

      return;
    }

    trackAddOpportunityToRecommendationClicked(
      opportunityNameProviderName,
      origin,
    );
  };

  const showModal = (
    isOpportunityNameProviderNameColumn: boolean,
    value: string,
    rowId: string,
  ) => {
    if (!isOpportunityNameProviderNameColumn) return;
    trackOpportunityModalOpened(value);
    setShowOpportunityModal(true);
    setSelectedOpportunity(opportunitiesByNameProviderName[value]);
    setSelectedRowId(rowId);
  };

  const hideModal = () => setShowOpportunityModal(false);

  useEffect(() => {
    setData(normalizeCommunityOpportunities(communityOpportunities));
  }, [communityOpportunities]);

  return (
    <Styled.Opportunities>
      <Styled.Title>
        Opportunities for {firstName}
        <InfoIconWithTooltip
          headerText="Opportunities"
          content={
            <>
              <TooltipContentSection>
                This list includes opportunities for treatment, programming, and
                other resources that may be helpful and relevant to your client
                based on their individual needs. Add additional case details to
                further refine the results.
              </TooltipContentSection>
              <TooltipContentSection>
                When recommending probation, any opportunities you add will be
                used to generate a recommendation summary for the judge.
              </TooltipContentSection>
            </>
          }
        />
      </Styled.Title>
      <Styled.Description>
        <span>
          The following opportunities are available to {firstName} based on the
          details of their case and personal information.
        </span>
        <span>
          Explore and add any opportunities that would set {firstName} up for
          success on probation.
        </span>
      </Styled.Description>
      <Styled.OpportunitiesTableWrapper>
        <Styled.CaseDetailsApplied>
          <Styled.CaseDetailsAppliedTitle>
            Filtered by case details:
          </Styled.CaseDetailsAppliedTitle>
          <Styled.CaseDetailsAppliedList>
            {currentDetailsApplied}
          </Styled.CaseDetailsAppliedList>
        </Styled.CaseDetailsApplied>
        <Styled.Search>
          <MagnifyingGlassIcon />
          <Styled.SearchInput
            type="text"
            placeholder="Search"
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
          {globalFilter && (
            <ResetSearchIcon onClick={() => setGlobalFilter("")} />
          )}
        </Styled.Search>

        <Styled.TableWrapper>
          {/* Table */}
          <Styled.Table>
            <Styled.TableHeader>
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
            </Styled.TableHeader>
            <Styled.TableBody>
              {table.getRowModel().rows.map((row) => (
                <Styled.TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => {
                    const isAddedOpportunity = Boolean(
                      recommendedOpportunities.find(
                        (opp) =>
                          opp.opportunityName ===
                            opportunityDisplayNameToOpportunityNameProviderName[
                              cell.row.original.opportunityNameProviderName
                            ].opportunityName &&
                          opp.providerName ===
                            opportunityDisplayNameToOpportunityNameProviderName[
                              cell.row.original.opportunityNameProviderName
                            ].providerName,
                      ),
                    );

                    return (
                      <StyledDashboard.Cell
                        key={cell.id}
                        onClick={() => {
                          showModal(
                            cell.column.id === "opportunityNameProviderName",
                            String(cell.getValue()),
                            row.id,
                          );
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}

                        {/* Add To Recommendation Button */}
                        {cell.column.id === "addToRecommendationAction" && (
                          <Tooltip
                            disabled={isProbationRecommendation}
                            width={OPPORTUNITY_TOOLTIP_WIDTH}
                            content={getOpportunityButtonTooltipText(
                              isAddedOpportunity,
                              selectedRecommendation,
                            )}
                          >
                            <Styled.AddRecommendationButton
                              disabled={!isProbationRecommendation}
                              onClick={() =>
                                toggleOpportunity(
                                  cell.row.original.opportunityNameProviderName,
                                  "table",
                                  row.id,
                                )
                              }
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
                          </Tooltip>
                        )}
                      </StyledDashboard.Cell>
                    );
                  })}
                </Styled.TableRow>
              ))}

              {/* No opportunities to display */}
              {table.getFilteredRowModel().rows.length === 0 && (
                <tr>
                  <td colSpan={3}>
                    <Styled.NoOpportunitiesWrapper>
                      <Styled.NoOpportunitiesTextContainer>
                        <span>
                          No Opportunities {data.length > 0 && `Found`}{" "}
                        </span>
                        {data.length === 0 && (
                          <>
                            There are no opportunities that fit{" "}
                            {formatPossessiveName(firstName)} needs and case
                            details at this time.
                          </>
                        )}
                      </Styled.NoOpportunitiesTextContainer>
                    </Styled.NoOpportunitiesWrapper>
                  </td>
                </tr>
              )}
            </Styled.TableBody>
          </Styled.Table>
        </Styled.TableWrapper>

        {/* Pagination */}
        {hasPagination && (
          <Styled.Pagination>
            <Styled.Pages>
              {pagePrompt} <span>of</span> {totalRowCount}
            </Styled.Pages>
            <Styled.PaginationButton
              onClick={() => table.getCanPreviousPage() && table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <LeftArrowIcon />
            </Styled.PaginationButton>
            <Styled.PaginationButton
              onClick={() => table.getCanNextPage() && table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <RightArrowIcon />
            </Styled.PaginationButton>
          </Styled.Pagination>
        )}
      </Styled.OpportunitiesTableWrapper>

      {/* Opportunity Modal */}
      <OpportunityModal
        isOpen={showOpportunityModal}
        hideModal={hideModal}
        selectedOpportunity={selectedOpportunity}
        isAddedOpportunity={Boolean(
          selectedOpportunity &&
            recommendedOpportunities.find((opp) => {
              const key = createOpportunityProviderDisplayName(
                selectedOpportunity.opportunityName,
                selectedOpportunity.providerName,
              );

              return (
                opp.opportunityName ===
                  opportunityDisplayNameToOpportunityNameProviderName[key]
                    ?.opportunityName &&
                opp.providerName ===
                  opportunityDisplayNameToOpportunityNameProviderName[key]
                    ?.providerName
              );
            }),
        )}
        toggleOpportunity={() =>
          selectedOpportunity &&
          toggleOpportunity(
            createOpportunityProviderDisplayName(
              selectedOpportunity.opportunityName,
              selectedOpportunity.providerName,
            ),
            "modal",
            selectedRowId,
          )
        }
        selectedRecommendation={selectedRecommendation}
      />
    </Styled.Opportunities>
  );
};
