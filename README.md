# DigitalOcean Schema Generator

This project generates System Initiative (SI) schemas for DigitalOcean resources following the `si-conduit` format.

## Setup

- Install [direnv](https://direnv.net/)
- Add the `si` cli to your path
- Create an API token to your SI workspace
- Create a `.env` file with `export SI_API_TOKEN='$TOKEN_VALUE'` and run `direnv allow` so that direnv loads the environment variable

## Usage
- Run `si remote schema push` to push schemas to your workspace.
- Run `si remote schema pull` to pull schemas from your workspace.

## Project Structure

This repository follows the si cli standardized project structure:

```
.
├── .siroot                       # Marker file identifying the project root
├── schemas/                           # All schema definitions
│   └── <schema-name>/                 # Each resource has its own directory
│       ├── .format-version            # Format version identifier
│       ├── schema.ts                  # Main schema definition (PropBuilder)
│       ├── schema.metadata.json       # Asset metadata
│       ├── actions/                   # CRUD operations
│       │   ├── create.ts
│       │   ├── create.metadata.json
│       │   ├── destroy.ts
│       │   ├── destroy.metadata.json
│       │   ├── refresh.ts
│       │   ├── refresh.metadata.json
│       │   ├── update.ts
│       │   └── update.metadata.json
│       ├── codeGenerators/            # Code generation functions
│       ├── management/                # Resource discovery/import
│       └── qualifications/            # Validation functions
├── prompts/                           # Code generation prompts
└── digitalocean-api-spec.yaml         # DigitalOcean API specification

```

## Resources

- [digitalocean-api-spec.yaml](digitalocean-api-spec.yaml) - The publicly available DigitalOcean API specification
- [generate-schema-prompt.md](prompts/generate-schema-prompt.md) - Comprehensive prompt for generating asset schemas
- [generate-actions-prompt.md](prompts/generate-actions-prompt.md) - Prompt for generating CRUD action implementations
- [generate-import-discover-prompt.md](prompts/generate-import-discover-prompt.md) - Generate Import and Discover functions.