{ sources ? import ../nix/sources.nix }:
let
  pkgs = import sources.nixpkgs {};
  bp = pkgs.callPackage sources."nix-npm-buildpackage" {};
in
  bp.buildNpmPackage {
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
      name = "";
    };
    npmBuild = "npm run build";
  }
