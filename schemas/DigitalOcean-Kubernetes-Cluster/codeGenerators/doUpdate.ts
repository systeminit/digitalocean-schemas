async function main(component: Input): Promise < Output > {
    const payload = _.cloneDeep(component.domain);

    // Remove create-only fields that cannot be updated
    delete payload.region;
    delete payload.version;
    delete payload.vpc_uuid;
    delete payload.node_pools;

    const cleaned = extLib.removeEmpty(payload);

    return {
        format: "json",
        code: JSON.stringify(cleaned, null, 2),
    };
}