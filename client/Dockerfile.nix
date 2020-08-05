{ sources ? import ../nix/sources.nix }:
let
  client = import ./client.nix { inherit sources; };
  pkgs = import sources.nixpkgs {};
in
  pkgs.dockerTools.buildImage {
    name = "pandaman64/oekaki-client";
    tag = "latest";

    contents = client;

    config.Env = [ "NODE_ENV=production" ];
    config.Cmd = [ "/bin/npm" "run" "start" "--scripts-prepend-node-path" ];
  }
