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

import { spacing } from "@recidiviz/design-system";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { rem } from "polished";
import * as React from "react";
import { useState } from "react";
import styled from "styled-components/macro";

import stateSeal from "~shared-assets/images/state-seals/US_TN_BW.png";

import DOCXFormInput from "../../DOCXFormInput";
import { DIMENSIONS_PX } from "../../PDFFormGenerator";
import FormPrompts from "../../US_ND/EarlyTermination/FormPrompts";
import FormTextarea from "../../US_ND/EarlyTermination/FormTextarea";
import { useResizeForm } from "../../utils";
import {
  AdministrativeBox,
  FormHeaderCheckboxSection,
  FormHeaderContainer,
  FormHeaderSection,
  FormHeaderTitleSection,
  FormInputRow,
  FormPageFooterContainer,
  FormSection,
  FormSectionHeader,
  SignatureLine,
  SignatureLineLabel,
  SignatureManualEntry,
  StateSealImage,
  StyledTable,
} from "./styles";

const FORM_FONT_FAMILY = `"Arial", sans-serif`;
const FORM_LINE_HEIGHT = 1.3;
const TOTAL_PAGES = 2;

export const FormPage = styled.div`
  font-family: ${FORM_FONT_FAMILY};
  line-height: ${FORM_LINE_HEIGHT};
  letter-spacing: 0;
  font-size: ${rem(11)};
  color: black;
  background-color: white;
  box-sizing: content-box;

  min-height: ${rem(DIMENSIONS_PX.HEIGHT - DIMENSIONS_PX.MARGIN)};
  padding: ${rem(18)};

  ol li {
    margin-bottom: ${rem(spacing.xs)};
  }

  :not(first-child) {
    margin-top: ${rem(18)};
  }
`;

const FormPageFooter = ({ pageNumber }: { pageNumber: number }) => {
  return (
    <FormPageFooterContainer>
      <span>
        Page {pageNumber} of {TOTAL_PAGES}
      </span>

      <div>
        <span>CR-4044</span>
        <span>Duplicate as Needed</span>
        <span>RDA 1286</span>
      </div>
    </FormPageFooterContainer>
  );
};

interface FormManualEntryProps {
  size: number;
}
export const FormManualEntry: React.FC<FormManualEntryProps> = ({
  size,
}: FormManualEntryProps) => {
  return <>{"_".repeat(size)}</>;
};

const FormTransformContainer = styled.section`
  transform-origin: 0 0;
  width: ${rem(DIMENSIONS_PX.WIDTH - DIMENSIONS_PX.MARGIN)};
  max-width: ${rem(DIMENSIONS_PX.WIDTH - DIMENSIONS_PX.MARGIN)};
`;

type SupervisionSummaryData = {
  summaryDetailTitle: string;
  summaryDetailContent?: string;
  formDataName: string;
  summaryDetailPlaceholder?: string;
};

const supervisionSummaryData: SupervisionSummaryData[] = [
  {
    summaryDetailTitle: "Employment",
    formDataName: "employment",
    summaryDetailPlaceholder:
      "Summarize the offender's employment. Include number of jobs held during supervision, longest period at with a single employer, number of terminations, and current employment status. If the offender is currently employed, indicate the length of time with the current employer.",
  },
  {
    summaryDetailTitle: "Residence",
    formDataName: "residence",
    summaryDetailPlaceholder:
      "Summarize the offender's residential history. Include number of different residences the offender has had during supervision and the longest period at a single location.",
  },
  {
    summaryDetailTitle: "Compliance",
    formDataName: "compliance",
    summaryDetailPlaceholder:
      "Summarize the offender's compliance with the rules of supervision and the special conditions of the sentencing court or Board of Parole. Include the offender's reporting history and issues of non-compliance and/or violations. Provide a brief explanation of the number and nature of sanctions imposed, violation warrants issued, and revocations.",
  },
  {
    summaryDetailTitle: "Case Plan Goals",
    formDataName: "casePlanGoals",
    summaryDetailPlaceholder:
      "Summarize the offender's two most recent Case Plans. Include goals completed, frequency of reviews, and the offender's final risk assessment score.",
  },
  {
    summaryDetailTitle: "Programs",
    formDataName: "programs",
    summaryDetailPlaceholder:
      "Summarize the programs the offender participated in during supervision. Include the name of the program and dates of completion.",
  },
  {
    summaryDetailTitle: "Arrests",
    formDataName: "arrests",
    summaryDetailPlaceholder:
      "Summarize any arrests for the offender during supervision. Include the arrest charges and dates. Indicate any past/current indictments for the offender in this section.",
  },
  {
    summaryDetailTitle: "NCIC Check",
    formDataName: "ncicCheck",
    summaryDetailPlaceholder:
      "Indicate the date of the most recent NCIC check and results.",
  },
  {
    summaryDetailTitle: "Substance Use",
    formDataName: "substanceUse",
    summaryDetailPlaceholder:
      "Provide a summary of the offender's substance use history to include drug screen frequency and results, treatment history, and valid prescriptions. Indicate the date of last drug screen and results.",
  },
  {
    summaryDetailTitle: "Conditions",
    formDataName: "conditions",
    summaryDetailPlaceholder:
      "List the special conditions ordered by the court (including court costs and restitution) and/or the BOP. Indicate how each condition was met and the dates of completion.",
  },
  {
    summaryDetailTitle: "Other",
    formDataName: "other",
    summaryDetailPlaceholder:
      "Provide any other relevant information about the offender's case.",
  },
];

const columnHelper = createColumnHelper<SupervisionSummaryData>();

const defaultColumns = [
  columnHelper.accessor("summaryDetailTitle", {
    cell: ({ row }) => row.original.summaryDetailTitle,
  }),
  columnHelper.accessor("formDataName", {
    cell: ({ row }) => (
      <div>
        {row.original.summaryDetailPlaceholder}
        <FormTextarea
          style={{
            fontFamily: FORM_FONT_FAMILY,
            fontSize: 10,
          }}
          name={row.original.formDataName}
        />
      </div>
    ),
  }),
];

export const FormSkeleton: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const formRef = React.useRef() as React.MutableRefObject<HTMLDivElement>;

  const {
    layout: { margin },
    resize,
  } = useResizeForm(formRef, `${FormTransformContainer}`);

  return (
    <div
      ref={formRef}
      onClickCapture={() => resize()}
      onKeyDownCapture={() => resize()}
      onChangeCapture={() => resize()}
    >
      <FormPrompts style={{ marginLeft: margin, marginRight: margin }} />
      <FormTransformContainer>{children}</FormTransformContainer>
    </div>
  );
};

const DOCXFormInputWithLabel = ({
  label,
  name,
}: {
  label: string;
  name: any;
}) => {
  return (
    <div>
      {label}:
      <DOCXFormInput
        style={{
          fontSize: 8,
        }}
        // typed as never to avoid type error
        name={name as unknown as never}
        placeholder={label}
      />
    </div>
  );
};

const SignatureArea = ({ label }: { label: string }) => {
  return (
    <SignatureManualEntry>
      <SignatureLine>
        <FormManualEntry size={20} />
        <SignatureLineLabel>{label}</SignatureLineLabel>
      </SignatureLine>
      <SignatureLine>
        <div>Enter Date</div>
        <SignatureLineLabel>Date</SignatureLineLabel>
      </SignatureLine>
    </SignatureManualEntry>
  );
};

export const FormSuspensionOfDirectSupervision: React.FC = () => {
  const [columns] = useState(defaultColumns);
  const table = useReactTable({
    data: supervisionSummaryData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const [state, setState] = React.useState(table.initialState);
  table.setOptions((prev) => ({
    ...prev,
    state,
    onStateChange: setState,
  }));
  return (
    <FormSkeleton>
      <FormPage>
        <FormHeaderContainer>
          <FormHeaderSection style={{ justifyContent: "center" }}>
            <StateSealImage src={stateSeal} alt="Tennessee State Seal" />
            <FormHeaderTitleSection>
              <h1>Tennessee Department of Correction</h1>
              <h2>DIRECT SUPERVISION SUSPENSION REQUEST</h2>
            </FormHeaderTitleSection>
          </FormHeaderSection>
          <FormHeaderSection>
            <DOCXFormInputWithLabel label="Date" name="downloadDate" />
            <FormHeaderCheckboxSection>
              <div>☐ Judicial Suspension of Direct Supervision</div>
              <div>☑ Suspension of Direct Supervision</div>
            </FormHeaderCheckboxSection>
          </FormHeaderSection>
        </FormHeaderContainer>

        <FormSection>
          <FormSectionHeader>Offender Information</FormSectionHeader>
          <FormInputRow>
            <DOCXFormInputWithLabel label="Name" name="clientName" />
            <DOCXFormInputWithLabel
              label="TN Offender Number"
              name="externalId"
            />
          </FormInputRow>
          <FormInputRow>
            <DOCXFormInputWithLabel label="Address" name="address" />
            <DOCXFormInputWithLabel
              label="Telephone Number"
              name="phoneNumber"
            />
          </FormInputRow>
          <FormInputRow>
            <DOCXFormInputWithLabel
              label="County of Conviction"
              name="allConvictionCounties"
            />
            <DOCXFormInputWithLabel
              label="Conviction Charge (most serious)"
              name="convictionCharge"
            />
          </FormInputRow>
          <FormInputRow>
            <DOCXFormInputWithLabel label="Sentence Date" name="sentenceDate" />
            <DOCXFormInputWithLabel
              label="Expiration Date"
              name="expirationDate"
            />
            <DOCXFormInputWithLabel
              label="Duration of Supervision"
              name="supervisionDuration"
            />
          </FormInputRow>
        </FormSection>
        <FormSection>
          <FormSectionHeader>Supervision Information</FormSectionHeader>
          <FormInputRow>
            <DOCXFormInputWithLabel
              label="Officer Name"
              name="assignedStaffFullName"
            />
            <DOCXFormInputWithLabel label="District" name="district" />
          </FormInputRow>
          <FormInputRow>
            <DOCXFormInputWithLabel
              label="Office Location"
              name="supervisionOfficeLocation"
            />
            <DOCXFormInputWithLabel
              label="Telephone Number"
              name="assignedStaffPhoneNumber"
            />
          </FormInputRow>
        </FormSection>
        <FormSection>
          <FormSectionHeader>
            Supervision Summary (Enter "N/A" if the field is not applicable)
          </FormSectionHeader>
          <StyledTable>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </StyledTable>
        </FormSection>
        <FormPageFooter pageNumber={1} />
      </FormPage>
      <FormPage
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-between",
          justifyContent: "flex-between",
          height: "100%",
        }}
      >
        <div>
          <FormSection>
            <FormInputRow>
              <SignatureArea label="Enter Officer Name." />
              <SignatureArea label="Enter Supervisor Name." />
            </FormInputRow>
            <FormInputRow>
              <SignatureArea label="Enter Director Name." />
              <SignatureArea label="Enter Correctional Administrator Name." />
            </FormInputRow>
            <FormInputRow>
              <SignatureArea label="Enter Probation/Parole Administrator Name" />
              <SignatureArea label="Assistant Commissioner Community Supervision" />
            </FormInputRow>
          </FormSection>
          <FormSection>
            <FormSectionHeader>For Judicial Use Only</FormSectionHeader>
            <AdministrativeBox>
              ☐ The offender meets the requirements outlined in Policy 708.05
              for Judicial Suspension of Supervision.
            </AdministrativeBox>
          </FormSection>
          <FormSection>
            <FormSectionHeader>For Administrative Use Only</FormSectionHeader>
            <AdministrativeBox>
              ☐ The offender meets the requirements outlined in Policy 708.05
              for Suspension of Direct Supervision.
            </AdministrativeBox>
          </FormSection>
        </div>
        <FormPageFooter pageNumber={2} />
      </FormPage>
    </FormSkeleton>
  );
};

export default FormSuspensionOfDirectSupervision;
