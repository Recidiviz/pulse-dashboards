# @reentry/frontend-shared

This library is for components, services, etc., that most closely belong to the @reentry codebase but are shared with other apps in the monorepo, e.g. to integrate reeentry features with the Opportunities tablet app in `apps/jii`.

Code in this library should avoid any direct dependencies on frameworks beyond React itself, since not all apps in this repo use the same frameworks. For the same reason it should also avoid directly accessing any environment variables, since the approach to managing these varies across different frameworks and bundlers. Where there are unavoidable indirect dependencies they should be passed in by the surrounding application instead - as function arguments in normal JS modules or as part of the `ApplicationContext` defined in `src/contexts` for React components.

Parts of the `ApplicationContext` are narrowed subsets of broader application functionality: e.g. the `IntakeAnalytics` interface for a more general-purpose Segment client, or the `ImageComponentProps` interface for the NextJS `Image` component. You can extend these interfaces (or add others) as necessary to bring more of that broader functionality into the shared scope.


This code is rendered by both @reentry/frontend and @jii

1. Run the CPA backend
2. Run though JII
`nx offline jii`
3. Run through @reentry/frontend
`nx dev @reentry/frontend`
