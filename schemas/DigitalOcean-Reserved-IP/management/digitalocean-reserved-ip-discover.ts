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

    // Fetch all reserved IPs using pages.
    try {
        let page = 1;
        let perPage = 200;
        let hasNextPage = true;
        while (hasNextPage) {
            console.log(`fetching reserved IP page ${page} (max ${perPage} per page)`);
            const listResponse = await doApiFetch(`/reserved_ips?per_page=${perPage}&page=${page}`);

            if (Array.isArray(listResponse?.reserved_ips) && listResponse.reserved_ips.length > 0) {
                console.log(`found ${listResponse.reserved_ips.length} reserved IPs on page ${page}`);
                const ips = listResponse.reserved_ips.map(ip => ({
                  ...ip,
                  region_slug: ip.region.slug,
                  ip_version: "ipv4"
                }));
                resourceList = _.union(resourceList, ips);
            }

            hasNextPage = Boolean(listResponse?.links?.pages?.next);
            if (hasNextPage) page++;
        }

        // Now load ipv6
        page = 1;
        hasNextPage = true;
        while (hasNextPage) {
            console.log(`fetching reserved IPv6 page ${page} (max ${perPage} per page)`);
            const listResponse = await doApiFetch(`/reserved_ipv6?per_page=${perPage}&page=${page}`);

            if (Array.isArray(listResponse?.reserved_ipv6s) && listResponse.reserved_ipv6s.length > 0) {
                console.log(`found ${listResponse.reserved_ipv6s.length} reserved IPs on page ${page}`);

                const ips = listResponse.reserved_ipv6s.map((ip) => ({
                  ...ip,
                  ip_version: "ipv6"
                }));

              resourceList = _.union(resourceList, ips);
            }

            hasNextPage = Boolean(listResponse?.links?.pages?.next);
            if (hasNextPage) page++;
        }
    } catch (error) {
        return {
            status: "error",
            message: `Reserved IP list error: ${error.message}`
        };
    }

    console.log(`total reserved IPs collected: ${resourceList.length}`);

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
        region: 'region_slug',
        droplet_id: 'droplet.id',
        ip_version: 'ip_version',
    };

    // Convert the raw API response per reserved IP into SI components.
    let importCount = 0;
    for (const reservedIp of resourceList) {
        const resourceId = reservedIp.ip;
        console.log(`importing reserved IP with resource ID ${resourceId}`);

        // Map API fields to domain properties
        const domainFields = mapApiFieldToDomain(reservedIp, fieldMappings);

        const properties = {
            si: {
              resourceId,
              name: reservedIp.ip,
            },
            domain: domainFields,
            resource: reservedIp,
        };

        const newAttributes: Output["ops"]["create"][string]["attributes"] = {};
        for (const [skey, svalue] of Object.entries(thisComponent.sources || {})) {
            newAttributes[skey] = {
                $source: svalue,
            };
        }

        console.log(`final attributes for reserved IP ${resourceId}`, newAttributes);

        create[resourceId] = {
            kind: "DigitalOcean Reserved IP",
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
