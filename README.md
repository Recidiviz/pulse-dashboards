# Recidiviz Dashboards

[![Build Status](https://github.com/Recidiviz/pulse-dashboards/actions/workflows/build.yml/badge.svg)](https://github.com/Recidiviz/pulse-dashboards/actions)

End user web applications built on top of the Recidiviz data platform.

## Overview

This repo uses the [Nx integrated monorepo](https://nx.dev/getting-started/tutorials/integrated-repo-tutorial) pattern to support a number of separate modules and applications that can be used together or separately. Nx provides a lot of tooling that we will not discuss in detail here but that we may use routinely for development or CI; you are encouraged to spend some time with the Nx docs and get familiar with its [core features](https://nx.dev/features). We generally aspire to stick to (or migrate towards) the default ways of doing things in Nx; e.g., using [standard plugins](https://nx.dev/concepts/nx-plugins) for common tasks, adopting the typical [folder structure](https://nx.dev/concepts/more-concepts/folder-structure), etc.

Code in this repo is organized into [projects](https://nx.dev/concepts/mental-model#mental-model), which are the main unit of code organization in Nx. In practice a project in Nx is just a folder with a `project.json` config file in it, and import statements can freely cross project boundaries (except as restricted by [linting rules](https://nx.dev/features/enforce-module-boundaries)). Refer to the README for a given project for more detailed information about how to use it and develop on it.

Application projects (a project in Nx ) (found in `apps/**`) are the primary entry points for the applications contained in this codebase, but projects may be added to other subfolders as well as the codebase evolves.

## Development

### Getting set up

1. Grab the source:

   `git clone https://github.com/Recidiviz/pulse-dashboards.git`

1. Ensure you are using the correct version of Node (if you don't use NVM, just check the .nvmrc file and ensure you are using that version).

   `nvm use`

1. Install Yarn package manager:

   `brew install yarn`

   For alternative Yarn installation options, see [Yarn Installation](https://yarnpkg.com/en/docs/install).

1. Install dependencies:

   `yarn install`

1. Install Firebase Tools (version >=10 required) and ensure you are logged in:

   ```
   brew install firebase-cli
   ```

   Then:

   ```
   firebase login
   ```

1. Additional recommendations:
   1. Install [Nx](https://nx.dev/getting-started/intro) globally (convenient for running package scripts):
      `npm install -g nx@latest`
   2. Install a linting package for your preferred code editor that hooks into [ESLint](https://eslint.org/docs/latest/), such as [the ESLint extension for VS Code](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint).
   3. Install a formatting package for your preferred code editor that hooks into [Prettier](https://prettier.io/docs/en/), such as [the Prettier - Code Formatter extension for VS Code](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode).
   4. Install the [Nx Console](https://nx.dev/features/integrate-with-editors) for your code editor if you prefer a GUI for exploring and using Nx.
   5. To make `git blame` more informative, tell it to ignore reformatting commits by running `git config blame.ignorerevsfile .git-blame-ignore-revs`.

### Creating new libraries

#### Why make a library?

One of the core concepts of Nx is the idea of [organizing your code into libraries](https://nx.dev/concepts/more-concepts/applications-and-libraries), and putting most of your code into libraries rather than apps. While it may be a scary and overloaded word, in Nx parlance a "library" is basically just a folder with an Nx config file in it (usually `project.json`). This lets Nx include that directory in its "project graph", which it uses to model the dependencies between different projects in the repo.

Briefly stated, there are a few benefits to doing this:

- Allows us to only run tasks like `lint` and `test` when there are changes affecting that project, via `nx affected`[in CI](https://nx.dev/ci/features/affected) or even just during development via `nx test [your-project]`
- Allows us to have more fine-grained control over which features can depend on which other features, via the Nx [enforce-module-boundaries](https://nx.dev/features/enforce-module-boundaries) linting package.

#### How to make a library

**TL;DR:** run `nx generate ~repo:lib [my-library]` and follow the prompts. Update the generated files as necessary.

**Long version:** Nx has various plugins that automate the boilerplate and nuances of creating and configuring libraries, such as [`@nx/js`](https://nx.dev/nx-api/js/generators/library) and [`@nx/react`](https://nx.dev/nx-api/react/generators/library). You can use those directly when needed, but in most cases you will want to reach for our local plugin first, which extends those plugins by setting our preferred options and extending the default plugin outputs with additional configuration and features that are tailored to our applications. These are meant to be sensible defaults, you can always override or extend them as needed to suit your use case. See [`/plugins/repo`](/plugins/repo) to learn more about its implementation.

### Creating a new app for a server

The below instructions apply to creating an app that doesn't have a UI as the client, e.g. JII texting.

#### Instructions

1. Generate the app

   ```
   nx g @nx/node:app apps/{server-name} --e2eTestRunner=none --unitTestRunner=none
   ```

   1. This creates a new directory named {server_name} in apps without adding a directory for e2e tests. The second argument
   ensures nx doesn't set up our testing framework with jest automatically, since we use vitest.
2. Inspect any changes to the <code>yarn.lock</code> and <code>package.json</code> to look for any unnecessary changes made by the nx generator. You
   might also want to check if the Fastify version was updated by searching for <code>fastify@</code> in <code>yarn.lock</code>.
