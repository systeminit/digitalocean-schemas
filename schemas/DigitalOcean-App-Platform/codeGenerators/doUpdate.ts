async function main(component: Input): Promise < Output > {
    const payload = _.cloneDeep(component.domain);

    // Remove create-only field
    delete payload.project_id;

    // Fix region value - convert display text to API slugs
    const regionMap: Record < string, string > = {
        "Atlanta": "atl",
        "New York": "nyc",
        "San Francisco": "sfo",
        "Toronto": "tor",
        "Amsterdam": "ams",
        "Frankfurt": "fra",
        "London": "lon",
        "Bangalore": "blr",
        "Singapore": "sgp",
        "Sydney": "syd"
    };

    if (payload.spec?.region && regionMap[payload.spec.region]) {
        payload.spec.region = regionMap[payload.spec.region];
    }

    // Fix domain type values - convert display text to API enums
    if (payload.spec?.domains && Array.isArray(payload.spec.domains)) {
        payload.spec.domains = payload.spec.domains.map((domain: any) => {
            const typeMap: Record < string, string > = {
                "Unspecified": "UNSPECIFIED",
                "Default (.ondigitalocean.app)": "DEFAULT",
                "Primary domain": "PRIMARY",
                "Alias domain": "ALIAS"
            };
            if (domain.type && typeMap[domain.type]) {
                domain.type = typeMap[domain.type];
            }
            return domain;
        });
    }

    const cleaned = extLib.removeEmpty(payload);

    return {
        format: "json",
        code: JSON.stringify(cleaned, null, 2),
    };
}