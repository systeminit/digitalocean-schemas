async function main(component: Input): Promise < Output > {
    const payload = _.cloneDeep(component.domain);

    // Convert droplet_ids from strings to integers
    if (payload.droplet_ids && Array.isArray(payload.droplet_ids)) {
        payload.droplet_ids = payload.droplet_ids.map(id =>
            typeof id === 'string' ? parseInt(id, 10) : id
        );
    }

    const cleaned = extLib.removeEmpty(payload);

    return {
        format: "json",
        code: JSON.stringify(cleaned, null, 2),
    };
}