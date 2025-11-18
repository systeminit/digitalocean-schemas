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

    // Fetch all apps using pages.
    try {
        let page = 1;
        let perPage = 200;
        let hasNextPage = true;
        while (hasNextPage) {
            console.log(`fetching app page ${page} (max ${perPage} per page)`);
            const listResponse = await doApiFetch(`/apps?per_page=${perPage}&page=${page}`);

            if (Array.isArray(listResponse?.apps) && listResponse.apps.length > 0) {
                console.log(`found ${listResponse.apps.length} apps on page ${page}`);
                resourceList = _.union(resourceList, listResponse.apps);
            }

            hasNextPage = Boolean(listResponse?.links?.pages?.next);
            if (hasNextPage) page++;
        }
    } catch (error) {
        return {
            status: "error",
            message: `App list error: ${error.message}`
        };
    }

    console.log(`total apps collected: ${resourceList.length}`);

    // Convert the raw API response per app into SI components.
    let importCount = 0;
    for (const app of resourceList) {
        const resourceId = app.id.toString();
        const domainFields = {
            project_id: app.owner_uuid,
            spec: {
                name: app.spec?.name,
                region: app.region?.slug || app.spec?.region,
            }
        };
        console.log(`importing app with resource ID ${resourceId}`, app, domainFields);

        const properties = {
            si: {
              resourceId,
              name: app.spec?.name || app.id,
            },
            domain: domainFields,
            resource: app,
        };

        const newAttributes: Output["ops"]["create"][string]["attributes"] = {};
        for (const [skey, svalue] of Object.entries(thisComponent.sources || {})) {
            newAttributes[skey] = {
                $source: svalue,
            };
        }

        console.log(`final attributes for app ${resourceId}`, newAttributes);

        create[resourceId] = {
            kind: "DigitalOcean App Platform",
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
