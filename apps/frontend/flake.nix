{
  inputs.nixpkgs.url = "github:Nixos/nixpkgs/nixos-unstable";
  inputs.flake-utils.url = "github:numtide/flake-utils";

  outputs = {
    self,
    nixpkgs,
    flake-utils,
  }:
    flake-utils.lib.eachDefaultSystem (
      system: let
        pkgs = import nixpkgs {inherit system;};
      in {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            nodejs
            pnpm
            biome
          ];
        };
        packages = {
          default = pkgs.stdenv.mkDerivation (finalAttrs: {
            pname = "liita-conllusak-frontend";
            version = "0.1.0";
            src = ./.;
            buildInputs = with pkgs; [
              nodejs
              pnpm
              pnpm.configHook
            ];
            pnpmDeps = pkgs.pnpm.fetchDeps {
              inherit (finalAttrs) pname version src;
              hash = "sha256-qf6HyutfAZGdF/zFI1p/rk3fzuWI/iGYMLVT1d5NOz0=";
            };
            buildPhase = ''
              pnpm run build
            '';

            installPhase = ''
              cp -r dist $out
            '';
          });
        };
      }
    );
}
