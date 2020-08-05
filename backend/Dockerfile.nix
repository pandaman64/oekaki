{ sources ? import ../nix/sources.nix }:
let
  backend = import ./backend.nix { inherit sources; };
  pkgs = import sources.nixpkgs {};
in
  pkgs.dockerTools.buildImage {
    name = "pandaman64/oekaki-backend";
    tag = "latest";

    contents = backend;

    config.Cmd = [ "/bin/backend" ];
  }
