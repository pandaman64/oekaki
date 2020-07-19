{ sources ? import ./nix/sources.nix }:
let
  pkgs = import sources.nixpkgs { };
in
  pkgs.mkShell {
    buildInputs = with pkgs; [
      nodejs
      diesel-cli
      rustup
      docker-compose
      rust-analyzer
    ];
  }
  
