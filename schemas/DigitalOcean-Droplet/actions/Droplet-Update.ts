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

    // Get current and desired states
    const currentName = component.properties.resource?.payload?.name;
    const desiredName = component.properties.domain?.name;
    const currentSize = component.properties.resource?.payload?.size?.slug;
    const desiredSize = component.properties.domain?.size;
    const currentImage = component.properties.resource?.payload?.image?.slug ||
        component.properties.resource?.payload?.image?.id;
    const desiredImage = component.properties.domain?.image;

    // Get action parameters from extra
    const snapshotName = component.properties.domain?.extra?.snapshot;
    const restoreImageId = component.properties.domain?.extra?.restore;

    // Check if snapshot is requested
    if (snapshotName) {
        const response = await fetch(
            `https://api.digitalocean.com/v2/droplets/${resourceId}/actions`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    type: "snapshot",
                    name: snapshotName
                }),
            });

        if (!response.ok) {
            const errorText = await response.text();
            return {
                status: "error",
                message: `Unable to create snapshot; API returned ${response.status} ${response.statusText}:
  ${errorText}`,
            };
        }

        return {
            status: "ok",
            payload: component.properties.resource.payload,
        };
    }

    // Check if restore is requested
    if (restoreImageId) {
        const response = await fetch(
            `https://api.digitalocean.com/v2/droplets/${resourceId}/actions`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    type: "restore",
                    image: restoreImageId
                }),
            });

        if (!response.ok) {
            const errorText = await response.text();
            return {
                status: "error",
                message: `Unable to restore droplet; API returned ${response.status} ${response.statusText}:
  ${errorText}`,
            };
        }

        return {
            status: "ok",
            payload: component.properties.resource.payload,
        };
    }

    // Check if name has changed
    if (desiredName && currentName && desiredName !== currentName) {
        const response = await fetch(
            `https://api.digitalocean.com/v2/droplets/${resourceId}/actions`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    type: "rename",
                    name: desiredName
                }),
            });

        if (!response.ok) {
            const errorText = await response.text();
            return {
                status: "error",
                message: `Unable to rename droplet; API returned ${response.status} ${response.statusText}:
  ${errorText}`,
            };
        }

        return {
            status: "ok",
            payload: component.properties.resource.payload,
        };
    }

    // Check if image has changed (rebuild)
    if (desiredImage && currentImage && desiredImage !== currentImage) {
        const response = await fetch(
            `https://api.digitalocean.com/v2/droplets/${resourceId}/actions`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    type: "rebuild",
                    image: desiredImage
                }),
            });

        if (!response.ok) {
            const errorText = await response.text();
            return {
                status: "error",
                message: `Unable to rebuild droplet; API returned ${response.status} ${response.statusText}:
  ${errorText}`,
            };
        }

        return {
            status: "ok",
            payload: component.properties.resource.payload,
        };
    }

    // Check if size has changed
    if (desiredSize && currentSize && desiredSize !== currentSize) {
        const response = await fetch(
            `https://api.digitalocean.com/v2/droplets/${resourceId}/actions`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    type: "resize",
                    size: desiredSize,
                    disk: false
                }),
            });

        if (!response.ok) {
            const errorText = await response.text();
            return {
                status: "error",
                message: `Unable to resize droplet; API returned ${response.status} ${response.statusText}:
  ${errorText}`,
            };
        }

        return {
            status: "ok",
            payload: component.properties.resource.payload,
        };
    }

    // No changes detected
    return {
        status: "ok",
        payload: component.properties.resource.payload,
    };
}