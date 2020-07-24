#!/usr/bin/env bash

set -eo pipefail

# build backend
nix-build backend/Dockerfile.nix
docker load -i result
docker push pandaman64/oekaki-backend:latest

# build client
docker build -t pandaman64/oekaki-client:latest client
docker push pandaman64/oekaki-client:latest

