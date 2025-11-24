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
            type: "enable_backups"
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        return {
            status: "error",
            message: `Unable to enable backups; API returned ${response.status} ${response.statusText}: ${errorText}`,
        };
    }

    if (!response.ok) {
        const errorText = await response.text();
        return {
            status: "error",
            message: `Unable to enable backups; API returned ${response.status}
  ${response.statusText}: ${errorText}`,
        };
    }

    // Parse the action response
    const actionResponse = await response.json();
    const actionId = actionResponse.action?.id;

    // Poll for action completion (max 60 seconds)
    if (actionId) {
        for (let i = 0; i < 10; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000));

            const statusResponse = await
            fetch(`https://api.digitalocean.com/v2/actions/${actionId}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (statusResponse.ok) {
                const statusJson = await statusResponse.json();
                const actionStatus = statusJson.action?.status;

                if (actionStatus === "completed") {
                    // Action finished successfully, refresh droplet
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
                    break;
                } else if (actionStatus === "errored") {
                    return {
                        status: "error",
                        message: "Action failed to complete",
                        payload: component.properties.resource.payload,
                    };
                }
                // Status is "in-progress", continue polling
            }
        }
    }

    // Fallback if polling timed out or no action ID
    return {
        status: "ok",
        payload: component.properties.resource.payload,
    };
}