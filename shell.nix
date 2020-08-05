{ sources ? import ./nix/sources.nix }:
let
  pkgs = import sources.nixpkgs { };
  crate2nix = pkgs.callPackage sources.crate2nix {};
in
  pkgs.mkShell {
    buildInputs = with pkgs; [
      nodejs
      diesel-cli
      rustup
      docker-compose
      rust-analyzer
      postgresql
      crate2nix
    ];
  }
  
