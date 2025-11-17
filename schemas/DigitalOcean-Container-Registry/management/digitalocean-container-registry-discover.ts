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

    // Fetch all container registries (no pagination).
    try {
        console.log(`fetching container registries`);
        const listResponse = await doApiFetch(`/registries`);

        if (Array.isArray(listResponse?.registries) && listResponse.registries.length > 0) {
            console.log(`found ${listResponse.registries.length} registries`);
            resourceList = listResponse.registries;
        }
    } catch (error) {
        return {
            status: "error",
            message: `Container registry list error: ${error.message}`
        };
    }

    console.log(`total container registries collected: ${resourceList.length}`);

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
        subscription_tier_slug: 'subscription_tier_slug',
        region: 'region',
    };

    // Convert the raw API response per registry into SI components.
    let importCount = 0;
    for (const registry of resourceList) {
        const resourceId = registry.name;
        console.log(`importing container registry with resource ID ${resourceId}`);

        // Map API fields to domain properties
        const domainFields = mapApiFieldToDomain(registry, fieldMappings);

        const properties = {
            si: {
              resourceId,
              name: registry.name,
            },
            domain: domainFields,
            resource: registry,
        };

        const newAttributes: Output["ops"]["create"][string]["attributes"] = {};
        for (const [skey, svalue] of Object.entries(thisComponent.sources || {})) {
            newAttributes[skey] = {
                $source: svalue,
            };
        }

        console.log(`final attributes for container registry ${resourceId}`, newAttributes);

        create[resourceId] = {
            kind: "DigitalOcean Container Registry",
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
