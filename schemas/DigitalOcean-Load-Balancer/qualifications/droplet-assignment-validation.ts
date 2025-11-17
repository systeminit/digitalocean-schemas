async function main(component: Input): Promise<Output> {
    const dropletIds = component.domain?.droplet_ids || [];
    const tag = component.domain?.tag || "";

    // Check if both droplet_ids and tag are provided
    const hasDropletIds = Array.isArray(dropletIds) && dropletIds.length > 0;
    const hasTag = tag.trim() !== "";

    if (hasDropletIds && hasTag) {
        return {
            result: "failure",
            message: "Cannot specify both 'droplet_ids' and 'tag'. These methods are mutually exclusive. Use either droplet_ids to assign specific Droplets, or tag to assign all Droplets with that tag."
        };
    }

    if (!hasDropletIds && !hasTag) {
        return {
            result: "failure",
            message: "Must specify either 'droplet_ids' or 'tag' to assign Droplets to the load balancer."
        };
    }

    // Validation passed
    if (hasDropletIds) {
        return {
            result: "success",
            message: `Load balancer will be assigned to ${dropletIds.length} Droplet(s) by ID.`
        };
    } else {
        return {
            result: "success",
            message: `Load balancer will be assigned to Droplets with tag: '${tag}'.`
        };
    }
}
