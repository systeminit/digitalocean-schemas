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

    // Fetch all load balancers using pages.
    try {
        let page = 1;
        let perPage = 200;
        let hasNextPage = true;
        while (hasNextPage) {
            console.log(`fetching load balancer page ${page} (max ${perPage} per page)`);
            const listResponse = await doApiFetch(`/load_balancers?per_page=${perPage}&page=${page}`);

            if (Array.isArray(listResponse?.load_balancers) && listResponse.load_balancers.length > 0) {
                console.log(`found ${listResponse.load_balancers.length} load balancers on page ${page}`);
                resourceList = _.union(resourceList, listResponse.load_balancers);
            }

            hasNextPage = Boolean(listResponse?.links?.pages?.next);
            if (hasNextPage) page++;
        }
    } catch (error) {
        return {
            status: "error",
            message: `Load balancer list error: ${error.message}`
        };
    }

    console.log(`total load balancers collected: ${resourceList.length}`);

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
        size: 'size',
        algorithm: 'algorithm',
        vpc_uuid: 'vpc_uuid',
        droplet_ids: 'droplet_ids',
        tag: 'tag',
    };

    // Convert the raw API response per load balancer into SI components.
    let importCount = 0;
    for (const loadBalancer of resourceList) {
        const resourceId = loadBalancer.id;
        console.log(`importing load balancer with resource ID ${resourceId}`);

        // Map API fields to domain properties
        const domainFields = mapApiFieldToDomain(loadBalancer, fieldMappings);

        const properties = {
            si: {
              resourceId,
              name: loadBalancer.name || loadBalancer.id,
            },
            domain: domainFields,
            resource: loadBalancer,
        };

        const newAttributes: Output["ops"]["create"][string]["attributes"] = {};
        for (const [skey, svalue] of Object.entries(thisComponent.sources || {})) {
            newAttributes[skey] = {
                $source: svalue,
            };
        }

        console.log(`final attributes for load balancer ${resourceId}`, newAttributes);

        create[resourceId] = {
            kind: "DigitalOcean Load Balancer",
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
