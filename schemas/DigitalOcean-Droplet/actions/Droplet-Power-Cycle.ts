async function main(component: Input): Promise < Output > {
    const resourceId = component.properties.si.resourceId;
    if (!resourceId) {
        return {
            status: "error",
            message: "Resource ID not found",
        };
    }

    const token = requestStorage.getEnv("DO_API_TOKEN");
    if (!token) {
        return {
            status: "error",
            message: "DO_API_TOKEN not found (hint: you may need a secret)",
        };
    }

    const response = await fetch(`https://api.digitalocean.com/v2/droplets/${resourceId}/actions`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            type: "power_cycle"
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        return {
            status: "error",
            message: `Unable to power cycle droplet; API returned ${response.status} ${response.statusText}: ${errorText}`,
        };
    }

    // Refresh the droplet to get updated state
    const refreshResponse = await
    fetch(`https://api.digitalocean.com/v2/droplets/${resourceId}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });

    if (refreshResponse.ok) {
        const refreshJson = await refreshResponse.json();
        if (refreshJson.droplet) {
            return {
                status: "ok",
                payload: refreshJson.droplet,
            };
        }
    }

    return {
        status: "ok",
        payload: component.properties.resource.payload,
    };
}