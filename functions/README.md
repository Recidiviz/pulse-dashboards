# Overview

This folder contains Firebase Cloud Functions for the Recidiviz project, a data platform aimed at criminal justice reform. The functions are written in TypeScript and are structured to handle various tasks as noted below. To see possible use cases, click [here](https://firebase.google.com/docs/functions/use-cases).

## About Creating New Functions

### Firebase Functions Documentation

To create a new firebase function for a new environment (1️⃣) or in an already initialized environment(2️⃣), please read the following documentation:

- [Write function in TypeScript](https://firebase.google.com/docs/functions/typescript) 1️⃣2️⃣
- [Configuring Environments](https://firebase.google.com/docs/functions/config-env?gen=1st) 1️⃣
- [Organizing Firebase Functions (aka where to put a new function)](https://firebase.google.com/docs/functions/organize-functions?gen=1st) 1️⃣
- [Write and View Logs](https://firebase.google.com/docs/functions/writing-and-viewing-logs?gen=1st) 1️⃣2️⃣

### Creating New Functions For a **New Environment**

#### Quick Start

*This assumes that your machine already has firebase-tools set up. If not, navigate to the root of the directory to read the README.md file on how to set that up.*

Run the intialization command, `firebase init function`, in the **ROOT FOLDER OF THE REPOSITORY**, and follow the prompts as follows:

1. Select `initalize` to **NOT** overwrite the previous functions.
2. Name the new environment configuration using a key in `.firebaserc` file.
3. Select `n` when prompted to initalize packages with npm.

## Setup

1. Ensure you have [Node.js](https://nodejs.org/) in the SAME version as the root directory. In this subdirectory, execute `nvm use [version number]`.
2. Structure the project the same as an existing firebase functions project (including this README, the `src` directory, and `package.json`, `eslint.js`, `src/index.ts`)
3. Follow the instructions below to create a new function.

### Creating New Functions For an **Already Initialized Environment**

#### Getting Started

1. Navigate to the folder for that environment. To find it, look at the "functions" property in `firebase.json`; "source" is the folder location in relation to the json file and "codebase" is the key in `.firebaserc` (the environment you're creating a function for).
2. Navigate to the `src/index.ts` add the function following the example below:

    ⚠️ NOTE: Prefix the function name when exporting from `index.ts` with `test` to prevent logs from being shown in the on call console as this new function is being tested.

    `index.ts`

    ```typescript
    exports.someFunction = ...

    exports.someOtherFunction = ...

    exports.testSomeNewFunction = ...
    ```

#### Development

1. Add logs throughout the function, so they are reported in the console. (Look at the documentation relevant to the use case for this function to see the logging conventions.)
2. Execute the command `yarn lint` to view the lint errors and warnings or `yarn lint --fix` to fix the lint errors and warnings.

#### Testing and Deploying

1. To test that the function works, run the command `yarn build`. If that succeeds proceed with `yarn deploy`. Click the link returned in ther terminal after a successful upload of the function.
2. Click on "Functions" to see the list of functions. The new function should be in the list.
3. Click on the three dots in the row of the function.
    1. Click on "View Logs" to see the logs generated by the function.
    2. There MAY OR MAY NOT be an option to view the function in a different GCP application. If so, attempt a force run of the new function.

4. To officially deploy the function with enabled logs, remove the *test* prefix.

#### Documentation

Use this template to document the new function in the README:

> This function is scheduled to run every Friday at 11:59 PM PDT. It exports specified Firestore collections to a Google Cloud Storage bucket.
> 
> - Trigger: *How is this triggered?*
> - Environment Variables:
>   - `SOME_ENV_VAR`: *The relevant environment variables.*
> - To Deploy: *Deploy settings for the new function.*
> - To Run: *How to run on GCP.*

## Yarn Commands

- `yarn lint`: Lint the project using ESLint, which is different from the root project.
- `yarn lint --fix`: Fixes the linting issues.
- `yarn build`: Build the Javascript files from the Typescript files.
- `yarn build:watch`: Build the Javascript files and watch for changes.
- `yarn serve`: Build the project and start the Firebase emulators.
- `yarn shell`: Build the project and start the Firebase shell.
- `yarn start`: Alias for `yarn shell`.
- `yarn deploy`: Deploy the functions to Firebase. Some functions may have specific deployment settings. Check below.
- `yarn logs`: Fetch the logs from Firebase.

## Functions

### `scheduledFirestoreExport`

This function is scheduled to run every Friday at 11:59 PM PDT. It exports specified Firestore collections to a Google Cloud Storage bucket.

- Trigger: Pub/Sub Schedule (`every friday 23:59`).
- Environment Variables:
  - `GCLOUD_PROJECT`: The project ID.
- To Deploy: Execute `nvm use FIREBASE_ENVIRONMENT` then `yarn deploy`
- To Run: Can force run in the Google Cloud Scheduler.

## ESLint Configuration

ESLint is configured for this project to enforce coding standards. The configuration can be found in `eslint.js`.

## License

This project is licensed under the GNU General Public License v3.0. For more details, see the [LICENSE](../LICENSE) file.