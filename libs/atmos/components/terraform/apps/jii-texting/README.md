# `jii-texting`
* [Design Document](https://www.notion.so/recidiviz/Design-Doc-Formalizing-the-JII-Texting-Flow-1687889f4d1980d4a6e6dd383bc73935?d=1747889f4d198091bd56001c0c7dd579#1707889f4d1980b0a510d617060616aa)

## Variables

| Name                   | Type                | Help                                                                               |
|------------------------|---------------------|------------------------------------------------------------------------------------|
| `project_id`           | <code>string</code> | The project that we are deploying the app to                                       |
| `location`             | <code>bool</code>   | The GCP location (us-east1, us-central1, etc) that we are deploying the service to | 
| `server_image`         | <code>string</code> | Artifact Registry repository to use for the server and migrate jobs                |
| `server_version`       | <code>string</code> | The version tag of the image that we are deploying                                 |
| `cloudsql_instance`    | <code>string</code> | Cloud SQL instance connection string, used to mount a unix socket in Cloud Run     |
| `migrate`              | <code>bool</code>   | Optionally, execute the migrations when running the Terraform apply plan           |
| `etl_bucket_name`      | <code>string</code> | The name of the GCS bucket that contains the ETL data for JII texting              |
