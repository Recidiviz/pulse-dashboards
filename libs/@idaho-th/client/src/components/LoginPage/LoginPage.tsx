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

import { TRPCClientError } from "@trpc/client";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

import { isRecidivizStaffEmail, SIGN_IN_FLOW } from "~@idaho-th/shared";

import { useIdahoTHStore } from "../../datastores/IdahoTHStoreContext";
import { useDebouncedValue } from "../../hooks/useDebounce";
import { BodyM1, BodyS1, Caption1, Heading3, palette } from "../../styles";
import { trpc } from "../../trpc/client";
import { SelectableChip } from "../common/inputs";
import { Spinner } from "../common/LoadingSpinner";
import {
  ButtonRow,
  Card,
  EmailInput,
  FieldGroup,
  FieldLabel,
  FormError,
  FormSection,
  Header,
  HintText,
  InputWrapper,
  Logo,
  Page,
  RequiredMark,
  RoleChoiceRow,
  RoleChoiceWrapper,
  SubmitButton,
  TitleWrapper,
} from "./LoginPage.styles";

const RECIDIVIZ_LOGO_URL =
  "https://recidiviz-dashboard.firebaseapp.com/recidiviz_logo_512x512.png";

const PROVIDER_NOT_PROVISIONED_MESSAGE =
  "This email is not registered for access. Please use the email on file with your organization, or email feedback@recidiviz.org for help.";

const STAFF_OR_PROVIDER_HINT =
  "Staff use an @idoc.idaho.gov email. Providers use your organization email.";

const ROLE_CHOICE_REQUIRED_MESSAGE =
  "Select whether you're signing in as a case manager or a provider.";

const INVALID_EMAIL_MESSAGE = "Enter a valid email address.";

const emailSchema = z.string().email();

type RecidivizRoleChoice =
  | typeof SIGN_IN_FLOW.STAFF_SSO
  | typeof SIGN_IN_FLOW.PROVIDER;

export const LoginPage: React.FC = observer(function LoginPage() {
  const userStore = useIdahoTHStore().rootStore.userStore;
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestedFlow, setRequestedFlow] = useState<
    RecidivizRoleChoice | undefined
  >(undefined);

  const trimmedEmail = email.trim();
  const isRecidivizDomain = isRecidivizStaffEmail(trimmedEmail);

  const debouncedEmail = useDebouncedValue(trimmedEmail, 300);
  const roleChoiceEligibility = trpc.auth.checkRecidivizRoleChoice.useQuery(
    { email: debouncedEmail },
    {
      enabled: isRecidivizStaffEmail(debouncedEmail),
      meta: { suppressGlobalError: true },
    },
  );
  const isEmailValid = emailSchema.safeParse(trimmedEmail).success;
  const showRoleChoice =
    isRecidivizDomain && roleChoiceEligibility.data?.showRoleChoice === true;
  const isCheckingRoleChoice =
    isRecidivizDomain &&
    (trimmedEmail !== debouncedEmail ||
      roleChoiceEligibility.isFetching ||
      roleChoiceEligibility.data === undefined);

  const checkSignInEmail = trpc.auth.checkSignInEmail.useMutation();

  useEffect(() => {
    void userStore.authorize(
      (targetUrl: string) => {
        const url = new URL(targetUrl);
        navigate(url.pathname, { replace: true });
      },
      { redirectIfUnauthenticated: false },
    );
  }, [navigate, userStore]);

  useEffect(() => {
    if (!userStore.userIsLoading && userStore.isAuthorized) {
      navigate("/", { replace: true });
    }
  }, [navigate, userStore.isAuthorized, userStore.userIsLoading]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    if (!isEmailValid) {
      setSubmitError(INVALID_EMAIL_MESSAGE);
      return;
    }

    if (isCheckingRoleChoice) {
      return;
    }

    if (showRoleChoice && !requestedFlow) {
      setSubmitError(ROLE_CHOICE_REQUIRED_MESSAGE);
      return;
    }

    setIsSubmitting(true);
    try {
      // Every email is resolved server-side: the staff allowlist is a Secret
      // Manager value and must not be inferable from the client bundle.
      const result = await checkSignInEmail.mutateAsync({
        email: trimmedEmail,
        ...(showRoleChoice && requestedFlow ? { requestedFlow } : {}),
      });
      if (!result.ok) {
        setSubmitError(PROVIDER_NOT_PROVISIONED_MESSAGE);
        setIsSubmitting(false);
        return;
      }

      await userStore.loginWithEmail(trimmedEmail, result.flow);
    } catch (error) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "TOO_MANY_REQUESTS"
      ) {
        setSubmitError(
          error.message ||
            "Too many sign-in attempts. Please wait a minute and try again.",
        );
      } else if (
        error instanceof TRPCClientError &&
        error.data?.code === "BAD_REQUEST"
      ) {
        setSubmitError(INVALID_EMAIL_MESSAGE);
      } else {
        setSubmitError(
          error instanceof Error ? error.message : "Unable to start sign in.",
        );
      }
      setIsSubmitting(false);
    }
  };

  if (userStore.userIsLoading) {
    return (
      <div style={{ height: "100vh", display: "grid", placeItems: "center" }}>
        <Spinner />
      </div>
    );
  }

  return (
    <Page>
      <Card>
        <Header id="screen-header" tabIndex={-1}>
          <Logo
            id="prompt-logo-center"
            src={RECIDIVIZ_LOGO_URL}
            alt="Recidiviz"
          />
          <TitleWrapper>
            <Heading3 $color={palette.foreground.primary}>Welcome</Heading3>
          </TitleWrapper>
          <BodyM1 $color={palette.foreground.secondary}>
            Log in to Recidiviz Housing Dashboard
          </BodyM1>
        </Header>

        <FormSection>
          <div>
            <div>
              <form onSubmit={handleSubmit} noValidate>
                {submitError || userStore.authError ? (
                  <FormError role="alert">
                    <BodyS1 $color={palette.foreground.attention}>
                      {submitError || userStore.authError?.message}
                    </BodyS1>
                  </FormError>
                ) : null}

                <div>
                  <div>
                    <InputWrapper>
                      <FieldGroup>
                        <FieldLabel
                          as="label"
                          id="username-label"
                          htmlFor="username"
                        >
                          Please enter a valid email
                          <RequiredMark aria-hidden="true"> *</RequiredMark>
                        </FieldLabel>
                        <EmailInput
                          as="input"
                          id="username"
                          name="username"
                          type="text"
                          inputMode="email"
                          autoComplete="email"
                          autoCapitalize="none"
                          spellCheck={false}
                          aria-labelledby="username-label"
                          value={email}
                          disabled={isSubmitting}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setRequestedFlow(undefined);
                          }}
                        />
                      </FieldGroup>
                    </InputWrapper>
                  </div>
                </div>

                {showRoleChoice ? (
                  <RoleChoiceWrapper>
                    <FieldGroup>
                      <FieldLabel as="span" id="role-choice-label">
                        Sign in as
                        <RequiredMark aria-hidden="true"> *</RequiredMark>
                      </FieldLabel>
                      <RoleChoiceRow
                        role="radiogroup"
                        aria-labelledby="role-choice-label"
                      >
                        <SelectableChip
                          name="recidiviz-role"
                          value={SIGN_IN_FLOW.STAFF_SSO}
                          label="Case Manager"
                          checked={requestedFlow === SIGN_IN_FLOW.STAFF_SSO}
                          disabled={isSubmitting}
                          onSelect={() =>
                            setRequestedFlow(SIGN_IN_FLOW.STAFF_SSO)
                          }
                        />
                        <SelectableChip
                          name="recidiviz-role"
                          value={SIGN_IN_FLOW.PROVIDER}
                          label="Provider"
                          checked={requestedFlow === SIGN_IN_FLOW.PROVIDER}
                          disabled={isSubmitting}
                          onSelect={() =>
                            setRequestedFlow(SIGN_IN_FLOW.PROVIDER)
                          }
                        />
                      </RoleChoiceRow>
                    </FieldGroup>
                  </RoleChoiceWrapper>
                ) : null}

                <ButtonRow>
                  <SubmitButton
                    as="button"
                    type="submit"
                    name="action"
                    value="default"
                    disabled={
                      isSubmitting || isCheckingRoleChoice || !isEmailValid
                    }
                  >
                    {isSubmitting ? "Redirecting…" : "Continue"}
                  </SubmitButton>
                </ButtonRow>
                <HintText>
                  <Caption1 $color={palette.foreground.secondary}>
                    {STAFF_OR_PROVIDER_HINT}
                  </Caption1>
                </HintText>
              </form>
            </div>
          </div>
        </FormSection>
      </Card>
    </Page>
  );
});
