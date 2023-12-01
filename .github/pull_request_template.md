## Description of the change

Description here

## Type of change

> All pull requests must have at least one of the following labels applied (otherwise the PR will fail):

| Label                       	| Description                                                                                               	|
|-----------------------------	|-----------------------------------------------------------------------------------------------------------	|
| Type: Bug                   	| non-breaking change that fixes an issue                                                                   	|
| Type: Feature               	| non-breaking change that adds functionality                                                               	|
| Type: Breaking Change       	| fix or feature that would cause existing functionality to not work as expected                            	|
| Type: Non-breaking refactor 	| change addresses some tech debt item or prepares for a later change, but does not change functionality    	|
| Type: Configuration Change  	| adjusts configuration to achieve some end related to functionality, development, performance, or security 	|
| Type: Dependency Upgrade      | upgrades a project dependency - these changes are not included in release notes                             |

## Related issues

Closes #XXXX

Resolve Sentry issue:
Fixes RECIDIVIZ-PULSE-DASHBOARD-[XXX]

## Checklists

### Development

These boxes should be checked by the submitter prior to merging:

- [ ] Manual testing against realistic data has been performed locally
- [ ] E2E have been run for Lantern changes ([Steps in the Readme](https://github.com/Recidiviz/pulse-dashboards#running-e2e-tests))

### Code review

These boxes should be checked by reviewers prior to merging:

- [ ] This pull request has a descriptive title and information useful to a reviewer
- [ ] Potential security implications or infrastructural changes have been considered, if relevant
