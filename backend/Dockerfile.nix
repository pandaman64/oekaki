{ sources ? import ../nix/sources.nix }:
let
  backend = import ./backend.nix { inherit sources; };
  pkgs = import sources.nixpkgs {};
in
  with pkgs;
  dockerTools.buildImage {
    name = "oekaki-backend";
    tag = "latest";

    contents = backend;

    config.Cmd = [ "/bin/backend" ];
  }
