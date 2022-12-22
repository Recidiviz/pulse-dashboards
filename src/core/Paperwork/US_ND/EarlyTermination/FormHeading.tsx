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
import * as React from "react";
import styled from "styled-components/macro";

import DOCXFormInput from "../../DOCXFormInput";
import {
  FormHeadingContainer,
  FormHeadingLineItemSuffix,
  FormHeadingMotionSection,
  FormHeadingSection,
} from "./styles";

interface FormHeadingLineItemProps {
  className?: string;
  children?: React.ReactChild | React.ReactChild[];
  separator?: string;
  suffix?: string | boolean;
  style?: any;
}

const LineItem = ({
  className,
  children,
  separator = "",
  suffix = "",
  style = {},
}: FormHeadingLineItemProps) => {
  return (
    <div className={className} style={style}>
      <span>{children}</span>
      <span>{separator}</span>
      <FormHeadingLineItemSuffix>{suffix}</FormHeadingLineItemSuffix>
    </div>
  );
};

const LineItemLeft = styled(LineItem).attrs({
  separator: ")",
})``;

const FormHeading: React.FC = () => {
  return (
    <FormHeadingContainer>
      <FormHeadingSection>
        <LineItemLeft>STATE OF NORTH DAKOTA</LineItemLeft>
        <LineItemLeft suffix="ss. ">
          COUNTY OF{" "}
          <DOCXFormInput
            name="convictionCounty"
            style={{ maxWidth: "100px" }}
            placeholder="County name"
          />
        </LineItemLeft>
        <LineItem>&nbsp;</LineItem>
        <LineItemLeft>
          <DOCXFormInput name="plaintiff" style={{ maxWidth: "160px" }} />,
        </LineItemLeft>
        <LineItemLeft>
          <span style={{ textIndent: 120 }}>Plaintiff</span>
        </LineItemLeft>
        <LineItemLeft />
        <LineItemLeft suffix="ss.">
          <span style={{ textIndent: 50 }}>vs.</span>
        </LineItemLeft>
        <LineItemLeft />
        <LineItemLeft>
          <DOCXFormInput name="clientName" style={{ maxWidth: "160px" }} />,
        </LineItemLeft>
        <LineItemLeft>
          <span style={{ textIndent: 120 }}>Defendant </span>
        </LineItemLeft>
      </FormHeadingSection>
      <FormHeadingSection style={{ flex: 1 }}>
        <LineItem style={{ textAlign: "right" }}>IN DISTRICT COURT</LineItem>
        <LineItem style={{ textAlign: "right" }}>
          <DOCXFormInput
            name="judicialDistrictCode"
            style={{ maxWidth: "200px" }}
          />{" "}
          JUDICIAL DISTRICT
        </LineItem>
        <LineItem>&nbsp;</LineItem>
        <LineItem>
          Criminal No.{" "}
          <DOCXFormInput
            name="criminalNumber"
            placeholder="Criminal Number"
            style={{ maxWidth: "272px" }}
          />
        </LineItem>
        <LineItem>
          SA No.{" "}
          <DOCXFormInput
            name="statesAttorneyNumber"
            placeholder="States Attorney Number"
            style={{ maxWidth: "298px" }}
          />
        </LineItem>
        <LineItem>&nbsp;</LineItem>
        <FormHeadingMotionSection>
          <LineItem>MOTION TO</LineItem>
          <LineItem>TERMINATE PROBATION</LineItem>
          <LineItem>SFN 9281</LineItem>
        </FormHeadingMotionSection>
      </FormHeadingSection>
    </FormHeadingContainer>
  );
};

export default FormHeading;
