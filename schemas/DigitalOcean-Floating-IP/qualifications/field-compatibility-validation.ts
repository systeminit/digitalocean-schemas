async function main(component: Input): Promise<Output> {
    const type = component.domain?.type;
    const dropletId = component.domain?.droplet_id;
    const region = component.domain?.region;
    const projectId = component.domain?.project_id;

    // Type is required
    if (!type) {
        return {
            result: "failure",
            message: "Type is required. Please select either 'assign' (to assign to a droplet) or 'reserve' (to reserve to a region)."
        };
    }

    if (type === "assign") {
        // When assigning to a droplet, droplet_id is required and region must NOT be set
        const hasDropletId = dropletId !== undefined && dropletId !== null;
        const hasRegion = region !== undefined && region !== null && region !== "";

        if (!hasDropletId) {
            return {
                result: "failure",
                message: "When type is 'assign', droplet_id is required to specify which droplet to assign the floating IP to."
            };
        }

        if (hasRegion) {
            return {
                result: "failure",
                message: "When type is 'assign', region should not be specified. Remove the region field or change type to 'reserve'."
            };
        }

        // project_id cannot be used with droplet assignment
        const hasProjectId = projectId !== undefined && projectId !== null && projectId !== "";
        if (hasProjectId) {
            return {
                result: "failure",
                message: "project_id can only be specified when reserving to a region (type='reserve'), not when assigning to a droplet."
            };
        }

        return {
            result: "success",
            message: `Floating IP will be assigned to droplet ${dropletId}.`
        };

    } else if (type === "reserve") {
        // When reserving to a region, region is required and droplet_id must NOT be set
        const hasRegion = region !== undefined && region !== null && region !== "";
        const hasDropletId = dropletId !== undefined && dropletId !== null;

        if (!hasRegion) {
            return {
                result: "failure",
                message: "When type is 'reserve', region is required to specify which region to reserve the floating IP to."
            };
        }

        if (hasDropletId) {
            return {
                result: "failure",
                message: "When type is 'reserve', droplet_id should not be specified. Remove the droplet_id field or change type to 'assign'."
            };
        }

        const hasProjectId = projectId !== undefined && projectId !== null && projectId !== "";
        if (hasProjectId) {
            return {
                result: "success",
                message: `Floating IP will be reserved to region '${region}' and assigned to project ${projectId}.`
            };
        }

        return {
            result: "success",
            message: `Floating IP will be reserved to region '${region}'.`
        };

    } else {
        return {
            result: "failure",
            message: `Invalid type: ${type}. Must be either 'assign' or 'reserve'.`
        };
    }
}
