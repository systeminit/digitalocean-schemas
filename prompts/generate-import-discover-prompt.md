# Generate DigitalOcean Import and Discover Functions Prompt

You are an expert code generator that creates Import and Discover management functions for DigitalOcean resources based on their schema definitions. Your task is to generate TypeScript functions that interact with the DigitalOcean API v2 to import existing resources and discover all resources of a given type.

## Context
You will be provided with a schema definition for a DigitalOcean resource. Based on this schema, you need to generate two management functions that follow the established patterns in the codebase.
There's already a reference implementation for droplet in the schemas folder (droplet). Do not modify those functions.
You should add import and discover functions to all the other schemas in the schemas folder except for the credential schema. The functions should be in a `management` subfolder of each schema.

## Function File Naming Convention

**CRITICAL**: All function files must follow the `normalizeFsName` convention.

The `normalizeFsName` function replaces any character that isn't alphanumeric (A-Z, a-z, 0-9), period (`.`), underscore (`_`), or hyphen (`-`) with a hyphen (`-`).

### Naming Rules:
1. The `name` property in each function's `.metadata.json` file is the source of truth
2. The filename prefix is `normalizeFsName(metadata.name)`
3. Both the `.metadata.json` and `.ts` files share the same normalized prefix
4. The import function should be named `{resource}-import`
5. The discover function should be named `{resource}-discover` or `digitalocean-{resource}-discover`

### Examples:
- If `name: "droplet-import"` files: `droplet-import.metadata.json`, `droplet-import.ts`
- If `name: "droplet-discover"` files: `droplet-discover.metadata.json`, `droplet-discover.ts`
- If `name: "sshkey-import"` files: `sshkey-import.metadata.json`, `sshkey-import.ts`

**Note**: Spaces, special characters, and any non-alphanumeric characters (except `.`, `_`, `-`) are replaced with hyphens.

## Reference Implementation Pattern

### Import Operation Reference Pattern

The import function retrieves a single resource by ID and maps its API response to the component's domain properties.
Any time you see "REPLACETHIS", you will need to replace it to make the function work (e.g. "droplet").

```typescript
async function main({
  thisComponent
}: Input): Promise<Output> {
  const token = requestStorage.getEnv("DO_API_TOKEN");
  if (!token) throw new Error("DO_API_TOKEN not found (hint: you may need a secret)");

  const component = thisComponent.properties;
  let resourceId = _.get(component, ["si", "resourceId"]);
  if (!resourceId) {
    return {
      status: "error",
      message: "resource ID not provided; please specify an ID to import",
    };
  }

  const response = await fetch(`https://api.digitalocean.com/v2/REPLACETHIS/${resourceId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (response.status === 404) {
    return {
      status: "error",
      message: `Resource with ID ${resourceId} not found`,
    };
  }

  if (!response.ok) {
    const errorText = await response.text();
    return {
      status: "error",
      message: `Unable to fetch resource ; API returned ${response.status} ${response.statusText}: ${errorText}`,
    };
  }

  const responseJson = await response.json();
  const resource = responseJson.REPLACETHIS;
  if (!resource) {
    return {
      status: "error",
      message: "Failed to extract resource data from response",
    };
  }

  // Map API fields to domain properties
  const fieldMappings = {
    name: 'name',
    region: 'region.slug',
    size: 'size.slug',
    image: 'image.slug',
    ssh_keys: 'ssh_keys',
    backups: 'backup_ids',
    ipv6: 'networks.v6',
    monitoring: 'features',
    tags: 'tags',
    volumes: 'volume_ids',
    vpc_uuid: 'vpc_uuid',
    with_droplet_agent: 'features'
  };

  function getNestedValue(obj, path) {
    if (typeof path === 'string') {
      return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    return obj?.[path];
  }

  function mapApiFieldToDomain(apiData, fieldMappings) {
    const domainData = {};

    for (const [domainField, apiPath] of Object.entries(fieldMappings)) {
      const value = getNestedValue(apiData, apiPath);
      if (value !== undefined && value !== null) {
        domainData[domainField] = value;
      }
    }

    return domainData;
  }

  const domainFields = mapApiFieldToDomain(resource, fieldMappings);

  // Post-process specific fields that need transformation
  if (resource.image?.slug) {
    domainFields.image = resource.image.slug;
  } else if (resource.image?.distribution && resource.image?.name) {
    // Fallback for images without slug
    domainFields.image = `${resource.image.distribution.toLowerCase()}-${resource.image.name.replace(/\s+/g, '-').toLowerCase()}`;
  }

  // Transform backup_ids array to boolean
  if (Array.isArray(resource.backup_ids)) {
    domainFields.backups = resource.backup_ids.length > 0;
  }

  // Transform features array to monitoring and resource_agent booleans
  if (Array.isArray(resource.features)) {
    domainFields.monitoring = resource.features.includes('monitoring');
    domainFields.with_resource_agent = resource.features.includes('resource_agent');
  }

  // Transform IPv6 networks to boolean
  if (resource.networks?.v6) {
    domainFields.ipv6 = Array.isArray(resource.networks.v6) && resource.networks.v6.length > 0;
  }

  console.log("resource imported and attributes prepared for component creation");

  const ops = {
    update: {
      self: {
        properties: {
          domain: domainFields,
          resource,
        }
      }
    },
  };

  return {
    status: "ok",
    message: "Imported Resource",
    ops,
  };
}
```

### Discover Operation Reference Pattern

The discover function retrieves all resources of a given type and creates component operations for each one.
Any time you see "REPLACETHIS", you will need to replace it to make the function work (e.g. "droplet").
If it is plural, it will be "REPLACETHISPLURAL" (e.g. "droplets").
If it needs a capital letter to start, it will be "REPLACETHISCAPITAL" (e.g. "Droplet").

```typescript
async function main({
    thisComponent
}: Input): Promise < Output > {
    const token = requestStorage.getEnv("DO_API_TOKEN");
    if (!token) throw new Error("DO_API_TOKEN not found (hint: you may need a secret)");

    const create: Output["ops"]["create"] = {};
    const actions: Record < string, any > = {};
    let resourceList: any[] = [];

    // An internal function used for fetching objects in DigitalOcean.
    async function doApiFetch(endpoint: string, options: RequestInit = {}) {
        const response = await fetch(`https://api.digitalocean.com/v2${endpoint}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                ...(options.headers ?? {}),
            },
            ...options,
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`API Error: ${response.status} ${response.statusText} (body: ${text})`);
        }

        const json = await response.json();
        console.log("response JSON:", Object.keys(json));
        return json;
    }

    // Fetch all resources using pages.
    try {
        let page = 1;
        let perPage = 200;
        let hasNextPage = true;
        while (hasNextPage) {
            console.log(`fetching page ${page} (max ${perPage} per page)`);
            const listResponse = await doApiFetch(`/REPLACETHISPLURAL?per_page=${perPage}&page=${page}`);

            if (Array.isArray(listResponse?.REPLACETHISPLURAL) && listResponse.REPLACETHISPLURAL.length > 0) {
                console.log(`found ${listResponse.REPLACETHISPLURAL.length} resources on page ${page}`);
                resourceList = _.union(resourceList, listResponse.REPLACETHISPLURAL);
            }

            hasNextPage = Boolean(listResponse?.links?.pages?.next);
            if (hasNextPage) page++;
        }
    } catch (error) {
        return {
            status: "error",
            message: `Resource list error: ${error.message}`
        };
    }

    console.log(`total resources collected: ${resourceList.length}`);

    // Generic field mapping function
    function mapApiFieldToDomain(apiData, fieldMappings) {
        const domainData = {};

        for (const [domainField, apiPath] of Object.entries(fieldMappings)) {
            const value = getNestedValue(apiData, apiPath);
            if (value !== undefined && value !== null) {
                domainData[domainField] = value;
            }
        }

        return domainData;
    }

    // Helper to get nested values from API response
    function getNestedValue(obj, path) {
        if (typeof path === 'string') {
            return path.split('.').reduce((current, key) => current?.[key], obj);
        }
        return obj?.[path];
    }

    // Field mappings from API response to domain properties
    const fieldMappings = {
        name: 'name',
        region: 'region.slug',
        size: 'size.slug',
        image: 'image.slug',
        ssh_keys: 'ssh_keys',
        backups: 'backup_ids',
        ipv6: 'networks.v6',
        monitoring: 'features',
        tags: 'tags',
        volumes: 'volume_ids',
        vpc_uuid: 'vpc_uuid',
        with_droplet_agent: 'features'
    };

    // Convert the raw API response per resource into SI components.
    let importCount = 0;
    for (const resource of resourceList) {
        const resourceId = resource.id.toString();
        console.log(`importing resource with resource ID ${resourceId}`);

        // Map API fields to domain properties
        const domainFields = mapApiFieldToDomain(resource, fieldMappings);

        // Post-process specific fields that need transformation
        if (resource.image?.slug) {
            domainFields.image = resource.image.slug;
        } else if (resource.image?.distribution && resource.image?.name) {
            // Fallback for images without slug - create a reasonable identifier
            domainFields.image = `${resource.image.distribution.toLowerCase()}-${resource.image.name.replace(/\s+/g, '-').toLowerCase()}`;
        }

        // Transform backup_ids array to boolean
        if (Array.isArray(resource.backup_ids)) {
            domainFields.backups = resource.backup_ids.length > 0;
        }

        // Transform features array to monitoring boolean
        if (Array.isArray(resource.features)) {
            domainFields.monitoring = resource.features.includes('monitoring');
            domainFields.with_resource_agent = resource.features.includes('resource_agent');
        }

        // Transform IPv6 networks to boolean
        if (resource.networks?.v6) {
            domainFields.ipv6 = Array.isArray(resource.networks.v6) && resource.networks.v6.length > 0;
        }

        const properties = {
            si: {
              resourceId,
              name: resource.name,
            },
            domain: domainFields,
            resource,
        };

        const newAttributes: Output["ops"]["create"][string]["attributes"] = {};
        for (const [skey, svalue] of Object.entries(thisComponent.sources || {})) {
            newAttributes[skey] = {
                $source: svalue,
            };
        }

        console.log(`final attributes for resource ${resourceId}`, newAttributes);

        create[resourceId] = {
            kind: "DigitalOcean REPLACETHISCAPITAL",
            properties,
            attributes: newAttributes,
        };
        actions[resourceId] = {
            remove: ["create"]
        };
        importCount++;
    }

    console.log(`import complete (total imported: ${importCount})`);

    return {
        status: "ok",
        message: `Discovered ${importCount} Components`,
        ops: {
            create,
            actions
        },
    };
}
```

## Requirements for Generated Management Functions

### 1. Import Operation
- Accept resource ID from `thisComponent.properties.si.resourceId`
- Validate that resource ID is provided
- Fetch single resource from DigitalOcean API by ID
- Handle 404 not found cases gracefully
- Map API response fields to domain properties using field mappings
- Transform complex API fields to simpler domain properties (e.g., arrays to booleans)
- Return ops with `update.self.properties` containing domain and resource data
- The import operation files should be named `{resource}-import.ts` and `{resource}-import.metadata.json`

### 2. Discover Operation
- Fetch all resources of the given type using pagination
- Handle paginated API responses using `links.pages.next`
- Use `per_page=200` for efficient batch fetching
- Map each resource's API fields to domain properties
- Transform complex fields appropriately for each resource
- Create component operations for each discovered resource
- Set `kind` to the full schema name (e.g., "DigitalOcean Droplet")
- Copy source attributes from thisComponent to each created component
- Remove "create" action from discovered resources (they already exist)
- Return ops with `create` and `actions` objects
- The discover operation files should be named `{resource}-discover.ts` and `{resource}-discover.metadata.json` (or `digitalocean-{resource}-discover`)

## Output Format

For each management operation, generate:
1. TypeScript function with proper Input/Output typing
2. Authentication handling via `requestStorage.getEnv("DO_API_TOKEN")`
3. Error handling for common failure modes
4. Field mapping logic to transform API responses to domain properties
5. Direct REST API calls to DigitalOcean API v2 using fetch()
6. Pagination support for discover operations
7. **Filename**: Use `normalizeFsName(metadata.name)` as the prefix for both `.ts` and `.metadata.json` files

## Schema-Specific Adaptations

### Field Mappings
Each resource will need its own field mappings. Common patterns:
- Simple string/number fields: Direct mapping (e.g., `name: 'name'`)
- Nested object properties: Dot notation (e.g., `region: 'region.slug'`)
- Array transformations: Convert to booleans or extract IDs (e.g., `backups: 'backup_ids'`)
- Feature flags: Check array membership (e.g., `monitoring: features.includes('monitoring')`)

### API Endpoints
Determine the correct API endpoint from the DigitalOcean schema:
- List endpoint: `GET /v2/{resource_plural}` (e.g., `/droplets`, `/volumes`, `/databases`)
- Single resource: `GET /v2/{resource_plural}/{id}` (e.g., `/droplets/123`)
- Check digitalocean-api-spec.yaml for exact endpoint paths
- Response typically has format: `{ "{resource_singular}": {...} }` or `{ "{resource_plural}": [...] }`

### Resource Response Keys
Extract the correct key from API responses:
- Single resource: Usually `response.{resource_singular}` (e.g., `response.droplet`)
- List resources: Usually `response.{resource_plural}` (e.g., `response.droplets`)
- Check the API spec to determine exact response structure

### Common Transformations
- **Slug extraction**: Many DigitalOcean objects have nested structures with `slug` properties (region.slug, size.slug, image.slug)
- **Boolean from array**: Features, backups, and capabilities often stored as arrays that should become booleans
- **ID extraction**: Arrays of IDs (volume_ids, ssh_keys) may need special handling
- **Network configuration**: IPv4/IPv6 network objects often need to be simplified

## Error Handling Standards
- Always return structured error responses with status and message
- Handle network failures, authentication errors, and resource not found cases
- Provide meaningful error messages for debugging
- Include relevant DigitalOcean API error codes and messages in error responses
- Use try-catch blocks for pagination loops in discover operations

## Metadata Structure

### Import Metadata Template
```json
{
  "name": "{resource}-import",
  "displayName": "Import from DigitalOcean",
  "description": "Import a single {resource} from DigitalOcean using its resource ID"
}
```

### Discover Metadata Template
```json
{
  "name": "digitalocean-{resource}-discover",
  "displayName": "Discover on DigitalOcean",
  "description": "Discover all {resource_plural} from DigitalOcean"
}
```

## Key Implementation Details

### Import Function Structure
1. Get API token from environment
2. Extract resource ID from component properties
3. Fetch single resource by ID
4. Define field mappings for the resource type
5. Map API response to domain properties
6. Apply any necessary post-processing transformations
7. Return ops with update.self.properties containing domain and resource data

### Discover Function Structure
1. Get API token from environment
2. Define internal `doApiFetch` helper function
3. Implement pagination loop to fetch all resources
4. Define field mappings for the resource type
5. Define transformation helper functions (mapApiFieldToDomain, getNestedValue)
6. Loop through each resource and:
   - Map API fields to domain properties
   - Apply post-processing transformations
   - Create component properties structure
   - Copy source attributes from thisComponent
   - Add to create and actions objects
7. Return ops with create and actions containing all discovered resources

### Pagination Pattern
```typescript
let page = 1;
let perPage = 200;
let hasNextPage = true;
while (hasNextPage) {
    const listResponse = await doApiFetch(`/{endpoint}?per_page=${perPage}&page=${page}`);
    // Process response...
    hasNextPage = Boolean(listResponse?.links?.pages?.next);
    if (hasNextPage) page++;
}
```

### Component Creation Pattern
```typescript
create[resourceId] = {
    kind: "DigitalOcean {Resource Name}",  // Full schema name
    properties: {
        si: {
            resourceId,
            name: resource.name,
        },
        domain: domainFields,      // Mapped user-input properties
        resource: resource,         // Full API response
    },
    attributes: newAttributes,      // Copied from thisComponent
};
actions[resourceId] = {
    remove: ["create"]              // Resource already exists
};
```

Generate clean, maintainable TypeScript code that follows the established patterns while being specifically tailored to each DigitalOcean resource schema.
