# Sentencing Server Import

This is the application responsible for importing sentencing data from various states into the Recidiviz database. It is expected to be deployed as a [Cloud Run Job](https://cloud.google.com/run).

## Testing zod schemas

If you'd like to test the zod import schemas against a downloaded JSONLines file of expected data, you can run `nx test-zod @sentencing/import {path-to-jsonlines-file} {name-of-schema}`. This will run the zod schema against each line of the file and log any errors.

The valid schema names are the keys of the `zodSchemaMap` object found in `test-zod/index.ts`
