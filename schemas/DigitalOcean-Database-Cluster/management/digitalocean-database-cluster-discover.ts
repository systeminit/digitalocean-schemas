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

    // Fetch all database clusters (no pagination).
    try {
        console.log(`fetching database clusters`);
        const listResponse = await doApiFetch(`/databases`);

        if (Array.isArray(listResponse?.databases) && listResponse.databases.length > 0) {
            console.log(`found ${listResponse.databases.length} databases`);
            resourceList = listResponse.databases;
        }
    } catch (error) {
        return {
            status: "error",
            message: `Database cluster list error: ${error.message}`
        };
    }

    console.log(`total database clusters collected: ${resourceList.length}`);

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
        engine: 'engine',
        version: 'version',
        region: 'region',
        size: 'size',
        num_nodes: 'num_nodes',
    };

    // Convert the raw API response per database into SI components.
    let importCount = 0;
    for (const database of resourceList) {
        const resourceId = database.id;
        console.log(`importing database cluster with resource ID ${resourceId}`);

        // Map API fields to domain properties
        const domainFields = mapApiFieldToDomain(database, fieldMappings);

        const properties = {
            si: {
              resourceId,
              name: database.name || database.id,
            },
            domain: domainFields,
            resource: database,
        };

        const newAttributes: Output["ops"]["create"][string]["attributes"] = {};
        for (const [skey, svalue] of Object.entries(thisComponent.sources || {})) {
            newAttributes[skey] = {
                $source: svalue,
            };
        }

        console.log(`final attributes for database cluster ${resourceId}`, newAttributes);

        create[resourceId] = {
            kind: "DigitalOcean Database Cluster",
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
