async function main(component: Input): Promise<Output> {
    const region = component.domain?.region || "";
    const size = component.domain?.size || "";
    const algorithm = component.domain?.algorithm || "";

    // Define regions where the deprecated 'size' field should be used
    const deprecatedSizeRegions = ["ams2", "nyc2", "sfo1"];

    // Check if size field is set for non-deprecated regions
    const hasSizeValue = size.trim() !== "";
    const isDeprecatedRegion = deprecatedSizeRegions.includes(region.toLowerCase());

    // Validate size field usage
    if (hasSizeValue && !isDeprecatedRegion) {
        return {
            result: "failure",
            message: `The 'size' field is deprecated for region '${region}'. Use 'size_unit' instead. The 'size' field should only be used in AMS2, NYC2, or SFO1 regions.`
        };
    }

    // Validate algorithm field usage (fully deprecated)
    if (algorithm.trim() !== "") {
        return {
            result: "warning",
            message: "The 'algorithm' field has been deprecated and is no longer used by DigitalOcean load balancers. This field will be ignored by the API."
        };
    }

    // Validation passed
    return {
        result: "success",
        message: "Deprecated field validation passed."
    };
}
