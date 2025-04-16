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

import { useForm, useStore } from "@tanstack/react-form";
import { differenceBy } from "lodash";
import { reaction } from "mobx";
import { useEffect } from "react";
import { Toast } from "react-bootstrap";
import toast from "react-hot-toast";

import { isDemoMode, isOfflineMode, isTestEnv } from "~client-env-utils";
import {
  rosterChangeRequestResponseFixture,
  rosterChangeRequestSchema,
  SupervisionOfficer,
} from "~datatypes";

import { SupervisionSupervisorRosterModalPresenter } from "../../../InsightsStore/presenters/SupervisionSupervisorRosterModalPresenter";
import {
  InsightsRosterChangeRequestFormOptions,
  RosterChangeRequestParams as SubmitRosterChangeRequestParams,
  SelectOptionWithLocation,
} from "../types";

const isDemoOrOfflineOrTest = isDemoMode() || isOfflineMode() || isTestEnv();
/**
 * Simulates submitting a roster change request in demo mode.
 * Alternates between success and failure responses to test UI behavior.
 */
async function handleDemoSubmit(
  isSuccessSubmitFlowDemo: boolean,
  ...args: SubmitRosterChangeRequestParams
) {
  if (!isDemoOrOfflineOrTest)
    throw new Error(
      `${handleDemoSubmit.name} should only be called in demo or offline mode or a test environment.`,
    );

  // Simulate a network delay of 2 seconds.
  await new Promise((resolve) => setTimeout(resolve, 2000));
  if (!isSuccessSubmitFlowDemo)
    throw new Error("Unable to process your request. Please try again.");
  else
    toast(
      <Toast>
        <Toast.Header>Submitted Request Data</Toast.Header>
        <Toast.Body>
          <pre>
            <code>${JSON.stringify(args, null, 2)}</code>
          </pre>
        </Toast.Body>
      </Toast>,
    );

  return rosterChangeRequestResponseFixture;
}

/**
 * Custom hook to initialize and manage the roster change request form.
 *
 * This API encapsulates all the necessary functionalities related to the form.
 * It allows you to manage form state, handle submissions, and interact with form fields.
 * It uses TanStack Forms ({@link https://tanstack.com/form/latest}) under the hood.
 *
 * @param presenter - An instance of SupervisionSupervisorRosterModalPresenter. The presenter must be hydrated
 *                    (i.e. its hydrationState.status is "hydrated" and necessary data is available) before using this hook.
 * @returns A tuple containing:
 *   1. The form instance created via useForm.
 *   2. A data object with computed properties and helpers related to the roster change request, including:
 *    - supervisorInfo, staffLabel, officers, officersOnSupervisorTeam,
 *    - officersForSelectedRequestChangeType,
 *    - selectableOfficersAsSelectOptions,
 *    - selectedOfficersAsSelectOptions,
 *    - transformOptionsIntoOfficers helper.
 * @throws if the presenter is not hydrated or required data is missing.
 */
export const useRosterChangeRequestForm = (
  presenter: SupervisionSupervisorRosterModalPresenter,
) => {
  const {
    allOfficers,
    supervisorInfo,
    trackSubmitted,
    submitRosterChangeRequestIntercomTicket,
    officersOnSupervisorTeam,
    labels: { supervisionOfficerLabel: staffLabel },
  } = presenter;

  if (
    presenter.hydrationState.status !== "hydrated" ||
    officersOnSupervisorTeam === undefined ||
    supervisorInfo === undefined ||
    allOfficers === undefined
  )
    throw new Error(
      "Provided presenter must be hydrated before useRosterChangeRequest form is initialized.",
    );

  /*
   * ==============================
   * Form Initialization
   * ==============================
   */

  const form = useForm({
    defaultValues: {
      affectedOfficers: [],
      requestChangeType: "ADD",
      requestNote: "",
    } as InsightsRosterChangeRequestFormOptions,
    validators: {
      // Ensure that the input from the user aligns with the request schema
      onChange: ({ value }) => {
        return rosterChangeRequestSchema
          .pick({
            affectedOfficersExternalIds: true,
            requestNote: true,
          })
          .safeParse({
            affectedOfficersExternalIds: value.affectedOfficers.map(
              (o) => o.externalId,
            ),
            requestNote: value.requestNote,
          }).error?.formErrors.fieldErrors;
      },
    },
    onSubmitMeta: {
      supervisorPseudoId: supervisorInfo?.pseudonymizedId,
      trackSubmitted,
      isDemo: isDemoOrOfflineOrTest,
      handleSubmit: submitRosterChangeRequestIntercomTicket,
    },
    onSubmit: async ({
      formApi,
      meta: { supervisorPseudoId, trackSubmitted, isDemo, handleSubmit },
      value: { requestChangeType, affectedOfficers, requestNote },
    }) => {
      const requestName = `${requestChangeType === "ADD" ? "Add to" : "Remove from"} Team Request`;
      const affectedOfficersExternalIds = affectedOfficers.map(
        (o) => o.externalId,
      );
      const payload = {
        requestChangeType,
        requestNote,
        affectedOfficersExternalIds,
      };
      const trackSubmittedParamsBase = {
        supervisorPseudonymizedId: supervisorPseudoId,
        affectedOfficersExternalIds,
        requestChangeType,
      };
      const isSuccessSubmitFlowDemo =
        formApi.store.state.submissionAttempts % 2 === 0;
      // Clear any previous toast notifications.
      toast.remove();
      const TOAST_DURATION = 4000;
      await (
        isDemo
          ? handleDemoSubmit(
              isSuccessSubmitFlowDemo,
              supervisorPseudoId,
              payload,
            )
          : handleSubmit(supervisorPseudoId, payload)
      )
        .then((response) => {
          trackSubmitted({
            ...trackSubmittedParamsBase,
            intercomTicketId: response.id,
          });
          formApi.reset();
          toast.success(`${requestName} was successfully submitted.`, {
            position: "bottom-left",
            duration: TOAST_DURATION,
          });
          presenter.view = "ROSTER";
          return response;
        })
        .catch((e) => {
          trackSubmitted({
            ...trackSubmittedParamsBase,
            error: e.message,
          });
          toast.error(e.message, {
            duration: TOAST_DURATION,
            position: "bottom-left",
          });
          throw e;
        });
    },
  });

  /*
   * ==============================
   * Observed Form Values - Monitor specific form values using useStore to trigger UI updates or reactions.
   * ==============================
   */

  const selectedRequestChangeType = useStore(
    form.store,
    (o) => o.values.requestChangeType,
  );
  const selectedAffectedOfficers = useStore(
    form.store,
    (o) => o.values.affectedOfficers,
  );

  // ==============================
  // Computed
  // ==============================

  const officersForSelectedRequestChangeType =
    selectedRequestChangeType === "ADD"
      ? differenceBy(allOfficers, officersOnSupervisorTeam, (o) => o.externalId)
      : officersOnSupervisorTeam;

  /*
   * ==============================
   * Helpers
   * ==============================
   */

  const transformOfficerIntoOption = (
    o: SupervisionOfficer,
  ): SelectOptionWithLocation => ({
    label: o.displayName,
    value: o.externalId,
    location: o.district,
  });

  const transformOptionsIntoOfficers = (
    options: SelectOptionWithLocation[],
  ) => {
    return options.reduce<SupervisionOfficer[]>((acc, option) => {
      const officer = allOfficers?.find((o) => o.externalId === option.value);
      return officer ? (acc.push(officer), acc) : acc;
    }, []);
  };

  /*
   * ==============================
   * Reactions
   * ------------------------------
   * NOTE: Keep state reactions at the bottom of this hook, which is basically an extension
   * of the MobX presenter that must be rendered and hydrated prior to this hook being rendered.
   * See: https://mobx.js.org/react-integration.html#tip-grab-values-from-objects-as-late-as-possible.
   * ==============================
   */

  useEffect(
    () =>
      // synchronize the form state with the UI view.
      reaction(
        () => ({
          view: presenter.view,
          isSelectedAffectedOfficersEmpty:
            selectedAffectedOfficers.length === 0,
        }),
        (curr, prev) => {
          if (prev?.view === "FORM" && curr.view === "ROSTER")
            form.setFieldValue("affectedOfficers", []);
          else if (
            !curr.isSelectedAffectedOfficersEmpty &&
            curr.view !== "FORM"
          )
            presenter.view = "FORM";
        },
        { fireImmediately: true, name: "Form_ViewReaction" },
      ),
    [selectedAffectedOfficers, presenter, form],
  );

  /*
   * ==============================
   * RETURN
   * ==============================
   */

  const data = {
    supervisorInfo,
    staffLabel,
    allOfficers,
    officersOnSupervisorTeam,
    officersForSelectedRequestChangeType,
    selectableOfficersAsSelectOptions: officersForSelectedRequestChangeType.map(
      transformOfficerIntoOption,
    ),
    selectedOfficersAsSelectOptions: selectedAffectedOfficers.map(
      transformOfficerIntoOption,
    ),
    transformOptionsIntoOfficers,
  };

  return [form, data] as const;
};
