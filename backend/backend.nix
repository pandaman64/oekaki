{ sources ? import ../nix/sources.nix }:
let
  pkgs = import sources.nixpkgs {};
  cargoNix = pkgs.callPackage ./Cargo.nix {};
in
  cargoNix.rootCrate.build
