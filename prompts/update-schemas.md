# DigitalOcean Asset Schema Update Prompt

## Context
You are updating the SI assets for DigitalOcean that exist on the schemas folder on this directory.
You'll do this by comparing the digitalocean-api-spec.yaml file with the digitalocean-public.v2.new.yaml file, which contains the latest API spec.

Steps:
1. Compare digitalocean-api-spec.yaml with digitalocean-public.v2.new.yaml
Don't read the whole file at once. Run diff on the two files, then use that to read the changed sections specifically.
Ignore Availability changes. Ignore Documentation changes that don't affect the arguments. Ignore status code changes
2. Generate a list of new endpoints, removed endpoints and updated endpoints. For updated endpoints, also include the changes.
