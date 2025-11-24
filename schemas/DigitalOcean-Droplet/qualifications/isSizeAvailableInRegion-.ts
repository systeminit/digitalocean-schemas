async function main(component: Input): Promise < Output > {
    const desiredSize = component.domain?.size;
    const desiredRegion = component.domain?.region;

    if (!desiredSize) {
        return {
            result: "warning",
            message: "No size specified",
        };
    }

    if (!desiredRegion) {
        return {
            result: "warning",
            message: "No region specified",
        };
    }

    const token = requestStorage.getEnv("DO_API_TOKEN");
    if (!token) {
        return {
            result: "failure",
            message: "DO_API_TOKEN not found (hint: you may need a secret)",
        };
    }

    // Fetch all regions
    const response = await fetch("https://api.digitalocean.com/v2/regions", {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        return {
            result: "warning",
            message: `Unable to validate size availability: API returned ${response.status}`,
        };
    }

    const data = await response.json();
    const region = data.regions.find((r: any) => r.slug === desiredRegion);

    if (!region) {
        return {
            result: "failure",
            message: `Region '${desiredRegion}' not found`,
        };
    }

    if (!region.available) {
        return {
            result: "failure",
            message: `Region '${desiredRegion}' is not available`,
        };
    }

    // Check if the size is available in this region
    if (!region.sizes.includes(desiredSize)) {
        return {
            result: "failure",
            message: `Size '${desiredSize}' is not available in region '${desiredRegion}'.`,
        };
    }

    return {
        result: "success",
        message: `Size '${desiredSize}' is available in region '${desiredRegion}'`,
    };
}