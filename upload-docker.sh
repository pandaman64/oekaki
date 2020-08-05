#!/usr/bin/env bash

set -eo pipefail

# build backend
bash ./backend/generate.sh # generate Cargo.nix
backend_path=$(nix-build backend/Dockerfile.nix)
docker load -i $backend_path
docker push pandaman64/oekaki-backend:latest

# build client
client_path=$(nix-build client/Dockerfile.nix)
docker load -i $client_path
docker push pandaman64/oekaki-client:latest

