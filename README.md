# Oekaki

# Running production server

```
docker-compose -f production.yml up
```

# Development

You can spin up PostgreSQL via `docker-compose`.

`cargo run` and `npm run dev` will start development servers.

# How to package

You need to install Nix to develop Oekaki.

To build Docker images:
```
nix-build backend/Dockerfile.nix
nix-build client/Dockerfile.nix
```

To install these images, run `docker load`.
