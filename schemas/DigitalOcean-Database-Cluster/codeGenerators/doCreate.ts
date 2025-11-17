async function main(component: Input): Promise < Output > {
    const payload = _.cloneDeep(component.domain);
    const cleaned = extLib.removeEmpty(payload);

    // Convert num_nodes from string to integer
    if (cleaned.num_nodes) {
        cleaned.num_nodes = parseInt(cleaned.num_nodes, 10);
    }

    return {
        format: "json",
        code: JSON.stringify(cleaned, null, 2),
    };
}