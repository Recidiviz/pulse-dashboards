# Auth0 Integration

This application uses Auth0 as its authentication and authorization service. Auth0 provides a number
of configuration options and can integrate with apps in a variety of ways.

If you are so inclined to set up an Auth0 tenant, either in the event of disaster recovery or to
support a new environment, these instructions should help.

## Initial Setup

Follow the initial setup instructions provided by Auth0 for creating a new account, or creating a
new tenant within an existing account. Specifically, follow the quickstart for React apps
[here](https://auth0.com/docs/quickstart/spa/react). Whether you are doing this only to test the
app in full auth mode or for production purposes, you should at least start by configuring all of
the various urls in that quickstart with the set of localhost urls, e.g. `http://localhost:3000` for
the callback urls and logout urls.

When going through the quickstart, you do not need to perform any of the coding-related steps.
However, it would still be wise to read these steps to understand how the system works as a whole.

### Auth0 CLI

The [Auth0 CLI](https://github.com/auth0/auth0-cli) is used to update the branding and text on the login page.

To install:

```
:> brew tap auth0/auth0-cli && brew install auth0
```

Login and set default app:

```
:> auth0 login
:> auth0 tenants use recidiviz-dev.auth0.com (or recidiviz.auth0.com for prod)
```

Open templates in VSCode:

```
:> export EDITOR="code -w"
```

### Universal Login Page

The Universal Login page's styles are mostly configured on the [Auth0 web console](https://manage.auth0.com/dashboard/us/recidiviz-dev/universal-login/customizations/colors), but there are
a few things that need to be configured using the Auth0 API and the Auth0 CLI.

All text on the login page is configured via API calls. When updating the text on a page, all of the updated text needs to be sent together as one request. You cannot update one
prompt text at a time:

```
/* Example updating the text on the sign up page */
curl -X PUT \
--url 'https://recidiviz-dev.auth0.com/api/v2/prompts/signup-id/custom-text/en' \
--header 'authorization: Bearer ACCESS_TOKEN' \
--header 'content-type: application/json' \
--data '{ "signup-id": { "footerText": "By signing up, you agree to our terms of service and privacy policy. Already have an account?", "emailPlaceholder": "Please enter a valid .gov email", "description": "Sign up for ${clientName}" } }'


/* Example updating the text on the login page */
curl -X PUT \
--url 'https://recidiviz-dev.auth0.com/api/v2/prompts/login-id/custom-text/en' \
--header 'authorization: Bearer ACCESS_TOKEN' \
--header 'content-type: application/json' \
--data '{ "login-id": { "description": "Log in to ${clientName}", "emailPlaceholder": "Please enter a valid .gov email"  } }'
```

Styling and changing the text in the footer is done through the Auth0 CLI. The Auth0 CLI will open an HTML template for you to edit directly and save. A version controlled copy of this
can be found in this directory under `/auth0/branding/login_template.html`. If you make any updates to the template, please remember to check those changes into version control.

```
:> auth0 branding templates update
```

### Connections

At present, the app uses only the _Database_ connection, which provides basic username-password
credential authentication. Other connections may be added in the future.

### Backend

Connections from the frontend (React) to the backend API (Node/Express) are also authenticated via
Auth0. You can set up the API config in Auth0 by following [this quickstart](https://auth0.com/docs/quickstart/spa/react/02-calling-an-api),
linked to from the bottom of the previous quickstart. Give it a name of "Dashboard API".

Same as above: when going through the quickstart, you do not need to perform any of the coding-related
steps. But you should still read these steps to understand how the system works as a whole.

## Rules and Hooks

Auth0 has a system of [rules](https://auth0.com/docs/rules) and [hooks](https://auth0.com/docs/hooks)
for expanding functionality. The names, order, and actual code for rules and hooks are configured in
the Auth0 dashboard itself. However, for the sake of tracking updates, we commit those same rules
and hooks in `src/auth0/`, even though the files therein _are not_ used by the app in any way.

### Usage

For each file in `src/auth0/rules/`, create a new rule. The name does not matter beyond reminding
you what is in each rule at a glance. Copy and paste the full content of the file into the rule's
code and save it. Order the rules in the same order they are in within the `/rules/` folder.

Do the same thing for `src/auth0/hooks`, but creating a new hook for each file instead of a new
rule. There are different kinds of hooks that execute at different points in the authentication
workflow. Each hook file should have a suffix indicating which type of hook it should be created as.

## Logging

Auth0 maintains good logging for all interactions with Auth0 APIs. For compliance reasons,
specifically the need to store authentication logs for longer retention periods, we copy Auth0 logs
to segment. You can set this up by creating an Auth0 [extension](https://auth0.com/docs/extensions).
If you are in a situation where you need to do this for Recidiviz, speak to someone internally about
how to configure this.
