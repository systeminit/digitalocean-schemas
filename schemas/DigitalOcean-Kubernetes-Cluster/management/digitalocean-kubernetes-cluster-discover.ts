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

    // Fetch all Kubernetes clusters using pages.
    try {
        let page = 1;
        let perPage = 200;
        let hasNextPage = true;
        while (hasNextPage) {
            console.log(`fetching Kubernetes cluster page ${page} (max ${perPage} per page)`);
            const listResponse = await doApiFetch(`/kubernetes/clusters?per_page=${perPage}&page=${page}`);

            if (Array.isArray(listResponse?.kubernetes_clusters) && listResponse.kubernetes_clusters.length > 0) {
                console.log(`found ${listResponse.kubernetes_clusters.length} clusters on page ${page}`);
                resourceList = _.union(resourceList, listResponse.kubernetes_clusters);
            }

            hasNextPage = Boolean(listResponse?.links?.pages?.next);
            if (hasNextPage) page++;
        }
    } catch (error) {
        return {
            status: "error",
            message: `Kubernetes cluster list error: ${error.message}`
        };
    }

    console.log(`total Kubernetes clusters collected: ${resourceList.length}`);

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
        region: 'region',
        version: 'version',
        vpc_uuid: 'vpc_uuid',
        tags: 'tags',
    };

    // Convert the raw API response per cluster into SI components.
    let importCount = 0;
    for (const cluster of resourceList) {
        const resourceId = cluster.id;
        console.log(`importing Kubernetes cluster with resource ID ${resourceId}`);

        // Map API fields to domain properties
        const domainFields = mapApiFieldToDomain(cluster, fieldMappings);

        const properties = {
            si: {
              resourceId,
              name: cluster.name || cluster.id,
            },
            domain: domainFields,
            resource: cluster,
        };

        const newAttributes: Output["ops"]["create"][string]["attributes"] = {};
        for (const [skey, svalue] of Object.entries(thisComponent.sources || {})) {
            newAttributes[skey] = {
                $source: svalue,
            };
        }

        console.log(`final attributes for Kubernetes cluster ${resourceId}`, newAttributes);

        create[resourceId] = {
            kind: "DigitalOcean Kubernetes Cluster",
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
