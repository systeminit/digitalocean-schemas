async function main(component: Input): Promise < Output > {
    const payload = _.cloneDeep(component.domain);

    // Remove create-only fields
    delete payload.url;
    delete payload.region;
    delete payload.tags;

    const cleaned = extLib.removeEmpty(payload);

    return {
        format: "json",
        code: JSON.stringify(cleaned, null, 2),
    };
}