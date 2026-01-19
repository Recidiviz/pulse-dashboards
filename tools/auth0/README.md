This folder contains a js script for calling Auth0 User management API from the CLI. 

To use this script, use the .sample-env file to create a .env file in the same folder. 
To get the values of the .env file, visit the applications section of the Auth0 tenant dashboard (see https://manage.auth0.com/dashboard/us/recidiviz-rnd/applications). Look for a Machine To Machine application called CLI-Scripts. 

The required variables are 
```
domain
m2m_clientId
m2m_clientSecret
```

The permissions given to the CLI-Scripts application in Auth0 are 
```
read:users
update:users
update:users_app_metadata
```

To run the script first run `npm install`, then `node update-user-app-metadata.js`. 

Inside `update-user-app-metadata.js` there is a DRY_RUN parameter set to true by default. With dry run as true, the script will list the tasks that it will do, but won't execute them. After verifying the dry run of changes, set the dry run to false to do the update in Auth0.
