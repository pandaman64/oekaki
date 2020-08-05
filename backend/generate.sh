#!/usr/bin/env bash

set -eo pipefail

cd -P -- "$(dirname -- "$0")"
nix-shell --run 'crate2nix generate -n ../nix/nixkpgs.nix && patch Cargo.nix Cargo.nix.patch' ../shell.nix
