async function main(component: Input): Promise < Output > {
    const payload = _.cloneDeep(component.domain);

    // Remove read-only fields
    delete payload.id;
    delete payload.owner_uuid;
    delete payload.owner_id;
    delete payload.created_at;
    delete payload.updated_at;

    // Ensure is_default is always present (API requires it)
    if (payload.is_default === undefined || payload.is_default === null) {
        payload.is_default = false;
    }

    const cleaned = extLib.removeEmpty(payload);

    return {
        format: "json",
        code: JSON.stringify(cleaned, null, 2),
    };
}