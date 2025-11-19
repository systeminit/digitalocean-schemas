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

    // Check if version has changed (indicating upgrade request)
    const newVersion = component.properties.domain?.version;
    const currentVersion = component.properties.resource?.payload?.version;

    if (newVersion && currentVersion && newVersion !== currentVersion) {
        // Use upgrade endpoint
        const upgradePayload = {
            version: newVersion
        };

        const response = await fetch(`https://api.digitalocean.com/v2/kubernetes/clusters/${resourceId}/upgrade`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(upgradePayload),
        });

        if (response.status === 404) {
            return {
                status: "error",
                message: `Kubernetes Cluster with ID ${resourceId} not found`,
            };
        }

        if (!response.ok) {
            const errorText = await response.text();
            return {
                status: "error",
                message: `Unable to upgrade kubernetes cluster; API returned ${response.status} ${response.statusText}:
  ${errorText}`,
            };
        }

        // Upgrade endpoint may return 202 Accepted with no body
        const responseText = await response.text();
        const responseJson = responseText ? JSON.parse(responseText) : null;

        return {
            resourceId: resourceId,
            status: "ok",
            payload: responseJson || component.properties.resource.payload,
        };
    }

    // Regular update (no version change)
    const codeString = component.properties.code?.["doUpdate"]?.code;
    if (!codeString) {
        return {
            status: "error",
            message: `Could not find doUpdate code for resource`,
        };
    }

    const response = await fetch(`https://api.digitalocean.com/v2/kubernetes/clusters/${resourceId}`, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: codeString,
    });

    if (response.status === 404) {
        return {
            status: "error",
            message: `Kubernetes Cluster with ID ${resourceId} not found`,
        };
    }

    if (!response.ok) {
        const errorText = await response.text();
        return {
            status: "error",
            message: `Unable to update kubernetes cluster; API returned ${response.status} ${response.statusText}:
  ${errorText}`,
        };
    }

    const responseJson = await response.json();

    if (responseJson.kubernetes_cluster) {
        return {
            resourceId: resourceId,
            status: "ok",
            payload: responseJson.kubernetes_cluster,
        };
    } else {
        return {
            status: "error",
            message: "Failed to extract kubernetes cluster data from response",
        };
    }
}