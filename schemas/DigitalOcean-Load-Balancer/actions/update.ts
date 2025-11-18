async function main(component: Input): Promise < Output > {
    const resourceId = component.properties.si.resourceId;
    if (!resourceId) {
        return {
            status: "error",
            message: "Resource ID not found",
        };
    }

    const codeString = component.properties.code?.["doUpdate"]?.code;
    if (!codeString) {
        return {
            status: "error",
            message: `Could not find doUpdate code for resource`,
        };
    }

    const token = requestStorage.getEnv("DO_API_TOKEN");
    if (!token) {
        return {
            status: "error",
            message: "DO_API_TOKEN not found (hint: you may need a secret)",
        };
    }

    const response = await fetch(`https://api.digitalocean.com/v2/load_balancers/${resourceId}`, {
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
            message: `Load Balancer with ID ${resourceId} not found`,
        };
    }

    if (!response.ok) {
        const errorText = await response.text();
        return {
            status: "error",
            message: `Unable to update load balancer; API returned ${response.status} ${response.statusText}: ${errorText}`,
        };
    }

    const responseJson = await response.json();

    if (responseJson.load_balancer) {
        return {
            resourceId: resourceId,
            status: "ok",
            payload: responseJson.load_balancer,
        };
    } else {
        return {
            status: "error",
            message: "Failed to extract load balancer data from response",
        };
    }
}