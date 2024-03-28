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

1. Additional recommendations:
   1. Install [Nx](https://nx.dev/getting-started/intro) globally (convenient for running package scripts):
      `yarn global add nx@latest`
   1. Install a linting package for your preferred code editor that hooks into [ESLint](https://eslint.org/docs/latest/), such as [the ESLint extension for VS Code](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint).
   1. Install a formatting package for your preferred code editor that hooks into [Prettier](https://prettier.io/docs/en/), such as [the Prettier - Code Formatter extension for VS Code](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode).
   1. Install the [Nx Console](https://nx.dev/features/integrate-with-editors) for your code editor if you prefer a GUI for exploring and using Nx.
   1. To make `git blame` more informative, tell it to ignore reformatting commits by running `git config blame.ignorerevsfile .git-blame-ignore-revs`.
