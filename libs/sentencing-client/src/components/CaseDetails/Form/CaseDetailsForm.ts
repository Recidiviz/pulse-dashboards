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

import { keyBy } from "lodash";
import { makeAutoObservable, runInAction } from "mobx";

import { Case, Client, Insight } from "../../../api/APIClient";
import { CaseDetailsPresenter } from "../../../presenters/CaseDetailsPresenter";
import { OnboardingFields } from "../CaseOnboarding/types";
import {
  ASAM_CARE_RECOMMENDATION_KEY,
  CLIENT_GENDER_KEY,
  ClientGender,
  HAS_DEVELOPMENTAL_DISABILITY_KEY,
  HAS_OPEN_CHILD_PROTECTIVE_SERVICES_CASE_KEY,
  IS_VETERAN_KEY,
  LSIR_SCORE_KEY,
  MENTAL_HEALTH_DIAGNOSES_KEY,
  NEEDS_TO_BE_ADDRESSED_KEY,
  NOT_SURE_YET_OPTION,
  OFFENSE_KEY,
  PLEA_KEY,
  PREVIOUSLY_INCARCERATED_OR_UNDER_SUPERVISION_KEY,
  REPORT_TYPE_KEY,
  SUBSTANCE_USER_DISORDER_DIAGNOSIS_KEY,
} from "../constants";
import {
  FormAttributes,
  FormField,
  FormFieldList,
  FormUpdates,
  FormValue,
} from "../types";
import { caseDetailsFormTemplate } from "./CaseDetailsFormTemplate";
import {
  isValidLsirScore,
  parseAttributeValue,
  transformUpdates,
} from "./utils";

export class CaseDetailsForm {
  content: { [key: string]: FormField };

  updates: FormUpdates;

  hasError: boolean;

  insight?: Insight;

  getInsight?: (
    offense: string,
    lsirScore: number,
  ) => Promise<Insight | undefined>;

  constructor(
    private readonly caseDetailsPresenter: CaseDetailsPresenter,
    private readonly offenses: string[],
    getInsight?: (
      offense: string,
      lsirScore: number,
    ) => Promise<Insight | undefined>,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
    this.hasError = false;
    this.content = this.createForm(caseDetailsPresenter.caseAttributes);
    this.updates = {} as FormUpdates;
    this.insight = undefined;
    this.getInsight = getInsight;

    this.fetchInsight();
  }

  get caseAttributes() {
    return this.caseDetailsPresenter.caseAttributes;
  }

  get contentList() {
    return Object.values(this.content).map((field) => {
      if (!field.nested) return field;
      return { ...field, nested: Object.values(field.nested) };
    }) as FormFieldList;
  }

  get onboardingFields() {
    const fields = this.contentList.reduce(
      (acc, field) => {
        if (
          [
            OFFENSE_KEY,
            LSIR_SCORE_KEY,
            CLIENT_GENDER_KEY,
            REPORT_TYPE_KEY,
          ].includes(field.key)
        ) {
          acc.OFFENSE_LSIR_SCORE_GENDER_REPORT_TYPE_FIELDS.push(field);
        }
        if (field.key === NEEDS_TO_BE_ADDRESSED_KEY) {
          acc.PRIMARY_NEEDS_FIELD.push(field);
        }
        if (
          [
            SUBSTANCE_USER_DISORDER_DIAGNOSIS_KEY,
            MENTAL_HEALTH_DIAGNOSES_KEY,
            IS_VETERAN_KEY,
            PREVIOUSLY_INCARCERATED_OR_UNDER_SUPERVISION_KEY,
            HAS_DEVELOPMENTAL_DISABILITY_KEY,
            HAS_OPEN_CHILD_PROTECTIVE_SERVICES_CASE_KEY,
            PLEA_KEY,
          ].includes(field.key)
        ) {
          acc.ADDITIONAL_NEEDS_FIELDS.push(field);
        }

        return acc;
      },
      {
        OFFENSE_LSIR_SCORE_GENDER_REPORT_TYPE_FIELDS: [],
        PRIMARY_NEEDS_FIELD: [],
        ADDITIONAL_NEEDS_FIELDS: [],
      } as OnboardingFields,
    );
    return fields;
  }

  get transformedUpdates(): FormAttributes {
    return transformUpdates(this.updates);
  }

  async fetchInsight() {
    const offenseName = this.content?.[OFFENSE_KEY]?.value;
    const lsirScore = this.content?.[LSIR_SCORE_KEY]?.value;
    const formattedLsirScore =
      typeof lsirScore === "string" ? lsirScore.trim() : lsirScore;

    if (
      this.getInsight &&
      offenseName &&
      formattedLsirScore &&
      !this.hasError
    ) {
      const insight = await this.getInsight(
        String(offenseName),
        Number(formattedLsirScore),
      );
      runInAction(() => {
        this.insight = insight;
      });
    } else {
      runInAction(() => {
        this.insight = undefined;
      });
    }
  }

  createForm(caseAttributes: Case & { clientGender?: Client["gender"] }) {
    const withPreviousUpdates = caseDetailsFormTemplate.map((field) => {
      const attributeValue = caseAttributes[field.key];
      const invalidLsirScore =
        field.key === LSIR_SCORE_KEY &&
        attributeValue &&
        !isValidLsirScore(String(attributeValue));
      const isLsirScoreOrOffenseKey =
        field.key === OFFENSE_KEY || field.key === LSIR_SCORE_KEY;

      if (attributeValue === undefined && field.key !== OFFENSE_KEY) {
        return field;
      }

      if (invalidLsirScore) {
        this.updateFormError(true);
      }

      return {
        ...field,
        options: field.key === OFFENSE_KEY ? this.offenses : field.options,
        value: parseAttributeValue(field.key, attributeValue),
        nested: field.nested?.map((nestedField) => {
          const nestedAttributeValue = caseAttributes[nestedField.key];
          if (nestedAttributeValue === undefined) {
            return nestedField;
          }
          return {
            ...nestedField,
            value: parseAttributeValue(nestedField.key, nestedAttributeValue),
          };
        }),
        /** Adds `onChange` to fetch insights when the LSI-R score or offense are changed */
        onChange: isLsirScoreOrOffenseKey
          ? () => {
              this.fetchInsight();
            }
          : undefined,
        otherContext: {
          ...field.otherContext,
          value: field.otherContext?.key
            ? parseAttributeValue(
                field.otherContext.key,
                field.otherContext.key === CLIENT_GENDER_KEY
                  ? caseAttributes.Client?.gender
                  : caseAttributes[field.otherContext.key],
              )
            : field.otherContext?.value,
        },
        isDisabled:
          (field.key === LSIR_SCORE_KEY && caseAttributes.isLsirScoreLocked) ||
          (field.key === REPORT_TYPE_KEY &&
            caseAttributes.isReportTypeLocked) ||
          (field.key === CLIENT_GENDER_KEY &&
            caseAttributes.Client?.isGenderLocked),
      };
    });

    return keyBy(
      withPreviousUpdates.map((field) => {
        if (!field.nested) return field;
        return { ...field, nested: keyBy(field.nested, "key") };
      }) as FormField[],
      "key",
    );
  }

  updateForm(
    key: keyof FormAttributes,
    value?: FormValue,
    parentKey?: string,
    isOtherContext?: boolean,
  ) {
    const otherContextKey = this.content[key]?.otherContext?.key;
    const keyOrContextKey =
      isOtherContext && otherContextKey ? otherContextKey : key;

    this.updates[keyOrContextKey] =
      key === "lsirScore" && value ? Number(value) : value;

    // Special handling for ASAM level of care recommendation: clear values if "None" or "Not Sure Yet" options are selected
    if (key === SUBSTANCE_USER_DISORDER_DIAGNOSIS_KEY) {
      const isNoneOrNull = [NOT_SURE_YET_OPTION, "None"].includes(
        String(value),
      );

      if (
        isNoneOrNull &&
        this.content?.[SUBSTANCE_USER_DISORDER_DIAGNOSIS_KEY]?.nested?.[
          ASAM_CARE_RECOMMENDATION_KEY
        ]
      ) {
        this.content[SUBSTANCE_USER_DISORDER_DIAGNOSIS_KEY].nested[
          ASAM_CARE_RECOMMENDATION_KEY
        ].value = null;
        this.updates[ASAM_CARE_RECOMMENDATION_KEY] = null;
      }

      this.content[SUBSTANCE_USER_DISORDER_DIAGNOSIS_KEY].value = value;
      return;
    }

    if (parentKey && this.content[parentKey].nested?.[key]) {
      if (
        isOtherContext &&
        this.content[parentKey].nested?.[key].otherContext
      ) {
        // @ts-expect-error This scope's if-clause guarantees the below left-hand side assignment expression is defined
        this.content[parentKey].nested[key].otherContext.value = value ?? null;
        return;
      }

      // @ts-expect-error This scope's if-clause guarantees the below left-hand side assignment expression is defined
      this.content[parentKey].nested[key].value = value ?? null;
      return;
    }

    if (isOtherContext && this.content[key].otherContext) {
      // @ts-expect-error This scope's if-clause guarantees the below left-hand side assignment expression is defined
      this.content[key].otherContext.value = value ?? null;
      return;
    }
    this.content[key].value = value ?? null;
  }

  updateFormError(hasError: boolean) {
    this.hasError = hasError;
  }

  getFormValue(key: keyof Case | ClientGender, parentKey?: string) {
    if (parentKey) {
      return this.content[parentKey].nested?.[key]?.value;
    }
    return this.content[key]?.value;
  }

  resetUpdates() {
    this.content = this.createForm(this.caseAttributes);
  }
}
