{ sources ? import ../nix/sources.nix }:
let
  pkgs = import sources.nixpkgs {};
  bp = pkgs.callPackage sources."nix-npm-buildpackage" {};
  src = pkgs.lib.cleanSourceWith {
    filter = path: type: (pkgs.lib.any (re: builtins.match re path != null) [
      # directories
      ".*(pages|public|components).*"
      # top-level config files
      ".*(package.json).*"
      ".*(package-lock.json).*"
      ".*(next-env.d.ts).*"
      ".*(next.config.js).*"
      ".*(tsconfig.json).*"
    ]);
    src = ./.;
    name = "oekaki-client";
  };
in
  bp.buildNpmPackage {
    inherit src;
    npmBuild = "npm run build";
    extraEnvVars = {
      # generate BUILD_ID from src
      # hash derivation path since Next cannot handle slashes in BUILD_ID
      NEXT_BUILD_ID = builtins.hashString "sha256" "${src}";
    };
  }
