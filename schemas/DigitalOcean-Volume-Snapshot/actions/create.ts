async function main(component: Input): Promise < Output > {
    const existingPayload = component.properties.resource?.payload;
    if (existingPayload) {
        return {
            status: "error",
            message: "Resource already exists",
            payload: existingPayload,
        };
    }

    const volumeId = component.properties.domain?.volume_id;
    if (!volumeId) {
        return {
            status: "error",
            message: "Volume ID not found in domain properties",
        };
    }

    const token = requestStorage.getEnv("DO_API_TOKEN");
    if (!token) {
        return {
            status: "error",
            message: "DO_API_TOKEN not found (hint: you may need a secret)",
        };
    }

    // Build the payload with just the name (volume_id goes in URL)
    const payload = {
        name: component.properties.domain?.name,
    };

    const response = await
    fetch(`https://api.digitalocean.com/v2/volumes/${volumeId}/snapshots`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        return {
            status: "error",
            message: `Unable to create snapshot; API returned ${response.status}
  ${response.statusText}: ${errorText}`,
        };
    }

    const responseJson = await response.json();
    const resourceId = responseJson.snapshot?.id;

    if (resourceId) {
        return {
            resourceId: resourceId.toString(),
            status: "ok",
            payload: responseJson.snapshot,
        };
    } else {
        return {
            message: "Failed to extract snapshot id from response",
            status: "error",
        };
    }
}