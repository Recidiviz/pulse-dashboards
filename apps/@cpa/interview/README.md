# CPA Interview App

This application is an SPA that exists only to redirect to the application
created in `libs/@cpa/jii-client`. This application simply allows users to
login from a browser (as opposed to a tablet in a facility).

The user enters their state code and DOC ID (using name, DOB, etc. was blocked on data quality). 
When the user clicks the "Login" button. The app then:
  - Calls the auth endpoint for an access token
  - Uses the access token to get a clientPseunonimizedId and StateCode
  - Conditionally renders the true application (the jii-client entrypoint)

## Running Locally

```bash
nx dev @cpa/interview
```
