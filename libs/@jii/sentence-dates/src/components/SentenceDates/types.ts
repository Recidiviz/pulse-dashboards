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

import { TFunction } from "i18next";
import { ComponentType } from "react";
import { PickByValue } from "utility-types";

import { I18nResources, StateSentenceDatesResources } from "~@jii/translation";

import { CardsWrapperProps } from "../defaultComponents/CardsWrapper";
import { DateAdjustmentProps } from "../defaultComponents/DateAdjustment";
import { DateCardProps } from "../defaultComponents/DateCard";
import { DateCardBodyWrapperProps } from "../defaultComponents/DateCardBodyWrapper";
import { DateCardHeadingWrapperProps } from "../defaultComponents/DateCardHeadingWrapper";
import { DateDescriptionProps } from "../defaultComponents/DateDescription";
import { DateLabelProps } from "../defaultComponents/DateLabel";
import { DateValueProps } from "../defaultComponents/DateValue";
import { DateValueSupplementalProps } from "../defaultComponents/DateValueSupplemental";
import { SectionHeadingProps } from "../defaultComponents/SectionHeading";
import { WrapperProps } from "../defaultComponents/Wrapper";

export type StateCodeWithSentenceDates = keyof PickByValue<
  I18nResources,
  StateSentenceDatesResources
>;

export type SentenceDatesComponents = {
  SectionWrapper: ComponentType<WrapperProps>;
  SectionHeading: ComponentType<SectionHeadingProps>;
  CardsWrapper: ComponentType<CardsWrapperProps>;
  DateCard: ComponentType<DateCardProps>;
  DateCardHeadingWrapper: ComponentType<DateCardHeadingWrapperProps>;
  DateDescription: ComponentType<DateDescriptionProps>;
  DateLabel: ComponentType<DateLabelProps>;
  DateValue: ComponentType<DateValueProps>;
  DateValueSupplemental: ComponentType<DateValueSupplementalProps>;
  DateCardBodyWrapper: ComponentType<DateCardBodyWrapperProps>;
  DateAdjustment: ComponentType<DateAdjustmentProps>;
};

export type TFn = TFunction<[StateCodeWithSentenceDates, "common"]>;
