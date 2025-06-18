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

   If you have classic Yarn (currently v1.22.22) and are struggling to get brew to upgrade, you may need to install corepack and yarn [as described here]([url](https://yarnpkg.com/getting-started/install#updating-yarn))).

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

## Testing

If you install the [Vitest VS Code extension](https://marketplace.visualstudio.com/items?itemName=ZixuanChen.vitest-explorer), you can run tests from the editor. It should work out of the box with our current setup!

NOTE: If your test need certain environment variables to be set, you can add them to the `vitest.config.ts` file in the project you are testing. See `apps/sentencing/vite.config.mts` for an example.

### Nx Development

#### Running `nx affected` in CI checks

 It can be helpful to run Nx tasks in CI, e.g. to validate that files in a certain directory follow a given format. `nx affected` is a useful command to run tasks on projects with changes ([docs](https://nx.dev/nx-api/nx/documents/affected)).

 In order to do this successfully, set up your target in the right `project.json` and add a job to the `build.yml` file that has the following steps in order:

 1. Checkout the repo

 ```
- uses: actions/checkout@v4
   with:
      # By default, the 'pull_request' action checks out the merge commit, which doesn't
      # necessarily have the latest changes for the branch. This will run the action on the
      # latest commit in the branch.
      # It is possible this workflow is triggered manually, so use the GITHUB_SHA in that case
      ref: ${{ github.event.pull_request.head.sha || github.sha }}
      # 'nx affected' requires the full git history to determine affected projects
      fetch-depth: 0
```

2. Set up Node and Yarn

```
- name: Enable corepack for yarn
   run: corepack enable
- name: Use Node
   uses: actions/setup-node@v4
   with:
      node-version-file: ".nvmrc"
      cache: "yarn"
- name: "Setup Yarn"
   run: |
      yarn install --immutable
```

3. Set the base and head SHAs for `nx affected`

```
- name: Set shas for Nx
   uses: nrwl/nx-set-shas@v4
```

4. Run the `nx affected` command with the desired target

```
- name: <Readable name of job>
   run: yarn nx affected -t <target-name>
```

### Linting

We use ESLint to lint our codebase. There are many ESLint plugins available to lint files other than `.js` files and can often be found with the prefix `eslint-plugin-<file_type>`, e.g. `eslint-plugin-yml` ([docs](https://www.npmjs.com/package/eslint-plugin-yml)). It might be helpful to add linting to both pre-commit and CI checks to help
with the development flow.

#### To add a new plugin

1. Install the plugin with the command below. The `-D` flag is used to install this in the dev dependencies section of the top-level `package.json`

   ```
   yarn add -D <plugin-name>
   ```

2. Add the plugin name without the `eslint-plugin` prefix, e.g. `yml`, to the list of `plugins` in the top-level `.eslintrc.json`
3. To configure the rules from the plugin, follow the package's usage instructions. This often means adding a new object to the `overrides` list in the `.eslintrc.json` file.

   ```
   {
      "files": ["*.yaml", "*.yml"],
      "extends": ["plugin:yml/standard"]
   }
   ```

   - If you want to lint this type of file across the entire codebase, add this to the top-level `.eslintrc.json`. However, if you want to lint files from a certain project, you can add this override to the `.eslintrc.json` for the given project. See `/libs/atmos/.eslintrc.json` to see the
   ESLint config for linting YAML only in this project

We use Husky to run our pre-commit checks, which are configured at `.husky/_/pre-commit`. The pre-commit check we have is `lint-staged` and is configured at `lint-staged.config.js`.

#### To ensure the project and file type is linted in pre-commit checks, you must

1. Make sure the project has a `lint-files` target whose command is `"eslint --max-warnings 0"`. If you used the library generator below, this will automatically be included in the `project.json`.
2. Add the new file extension to the module exports with the `lintCommand` as the value.
   - The affected/staged files are passed in automatically when linting

#### Then to make sure the files are linted in the `lint_all` CI check

1. Add a `lint` target to the relevant `project.json`. Unlike the `lint-files` target above, this is not automatically included in the `project.json` because projects rely on the [default inferred task](https://nx.dev/nx-api/eslint/documents/overview#how-nxeslint-infers-tasks) at `nx.json`.
   - In most cases, ESLint should pick up file extensions with rules in `overrides`, so the default `eslint .` will work. However, if you want to specify a specific directory to look in, you can use a glob pattern to specify the path ([docs](https://eslint.org/docs/latest/use/command-line-interface#--ext))
2. If you are making changes for a new project, ensure that the CI check includes the project once you've added the `project.json` to the PR.

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
