provider "google" {
  project = "YOUR_PROJECT_ID"
  region  = "us-central1"
}

resource "google_container_cluster" "gke_cluster" {
  name     = "notes-gke-cluster"
  location = "us-central1"
  node_config {
    machine_type = "e2-medium"
  }
}

resource "google_container_registry" "gcr" {
  location = "us"
}