async function main(component: Input): Promise < Output > {
    const ipVersion = component.domain?.ip_version;
    const dropletId = component.domain?.droplet_id;
    const region = component.domain?.region;
    const projectId = component.domain?.project_id;

    // IP version is required
    if (!ipVersion) {
        return {
            result: "failure",
            message: "IP version is required. Please select either IPv4 or IPv6."
        };
    }

    if (ipVersion === "ipv4") {
        // IPv4 requires either droplet_id OR region (but not both)
        const hasDropletId = dropletId !== undefined && dropletId !== null;
        const hasRegion = region !== undefined && region !== null && region !== "";
      
        if (!hasDropletId && !hasRegion) {
            return {
                result: "failure",
                message: "IPv4 reserved IPs require either a droplet_id (to assign to a droplet) or a region (to reserve to a region)."
            };
        }

        if (hasDropletId && hasRegion) {
            return {
                result: "failure",
                message: "IPv4 reserved IPs cannot have both droplet_id and region. Use droplet_id to assign to a droplet OR region to reserve to a region."
            };
        }

        // project_id can only be used with region (not with droplet_id)
        const hasProjectId = projectId !== undefined && projectId !== null && projectId !== "";
        if (hasProjectId && hasDropletId) {
            return {
                result: "failure",
                message: "project_id can only be specified when reserving to a region, not when assigning to a droplet."
            };
        }
    } else if (ipVersion === "ipv6") {
        // IPv6 requires region and cannot have droplet_id or project_id
        const hasRegion = region !== undefined && region !== null && region !== "";

        if (!hasRegion) {
            return {
                result: "failure",
                message: "IPv6 reserved IPs require a region."
            };
        }

        const hasDropletId = dropletId !== undefined && dropletId !== null;
        if (hasDropletId) {
            return {
                result: "failure",
                message: "IPv6 reserved IPs cannot be assigned to a droplet. Remove the droplet_id field."
            };
        }

        const hasProjectId = projectId !== undefined && projectId !== null && projectId !== "";
        if (hasProjectId) {
            return {
                result: "failure",
                message: "IPv6 reserved IPs do not support project_id. Remove the project_id field."
            };
        }
    } else {
        return {
            result: "failure",
            message: `Invalid IP version: ${ipVersion}. Must be either 'ipv4' or 'ipv6'.`
        };
    }

    return {
        result: "success",
        message: "Fields are valid for the selected IP version."
    };
}