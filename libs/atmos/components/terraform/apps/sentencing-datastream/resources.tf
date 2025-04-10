resource "google_datastream_connection_profile" "source" {
  display_name          = "Sentencing Source Connection Profile"
  location              = var.location
  connection_profile_id = "source"

  postgresql_profile {
    hostname = "HOSTNAME"
    port     = 5432
    username = "USERNAME"
    password = "PASSWORD"
    database = "postgres"
  }
}

resource "google_datastream_connection_profile" "source" {
  display_name          = "Sentencing Source Connection Profile"
  location              = var.location
  connection_profile_id = "source"

  postgresql_profile {
    hostname = "HOSTNAME"
    port     = 5432
    username = "USERNAME"
    password = "PASSWORD"
    database = "postgres"
  }
}
