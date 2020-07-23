{ sources ? import ../nix/sources.nix }:
let
  nixpkgs-mozilla = import sources.nixpkgs-mozilla;
  pkgs = import sources.nixpkgs {
    overlays =
      [
        nixpkgs-mozilla
        (self: super:
            {
              rustPlatform = super.makeRustPlatform {
                rustc = self.latest.rustChannels.beta.rust;
                cargo = self.latest.rustChannels.beta.rust;
              };
            }
        )
      ];
  };
  filterFn = path: type:
  let
    baseName = baseNameOf path;
  in
    baseName == "Cargo.toml" || baseName == "Cargo.lock" || (builtins.match "(.*/src.*)|(.*migration.*)" path) != null;
in
  with pkgs;
  rustPlatform.buildRustPackage rec {
    pname = "backend";
    version = "0.1.0";

    src = builtins.filterSource filterFn ./.;

    buildInputs = [
      pkgconfig
      openssl
      postgresql
    ];

    cargoSha256 = "1qkv6i5q060vhdr2sl4x852rvn54l90kx9bpnqbdh90j18qj1mik";
    verifyCargoDeps = true;
  }
