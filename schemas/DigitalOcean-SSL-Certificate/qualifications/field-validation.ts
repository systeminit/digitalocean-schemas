async function main(component: Input): Promise<Output> {
    const type = component.domain?.type;
    const dnsNames = component.domain?.dns_names;
    const privateKey = component.domain?.private_key;
    const leafCertificate = component.domain?.leaf_certificate;
    const certificateChain = component.domain?.certificate_chain;

    // Type must be set
    if (!type) {
        return {
            result: "failure",
            message: 'Certificate type must be specified (either "lets_encrypt" or "custom")'
        };
    }

    // Validate Let's Encrypt certificate
    if (type === "lets_encrypt") {
        // dns_names is required
        if (!dnsNames || !Array.isArray(dnsNames) || dnsNames.length === 0) {
            return {
                result: "failure",
                message: 'For Let\'s Encrypt certificates, dns_names array is required and must contain at least one domain'
            };
        }

        // Custom certificate fields should not be provided
        if (privateKey || leafCertificate || certificateChain) {
            return {
                result: "failure",
                message: 'For Let\'s Encrypt certificates, do not provide private_key, leaf_certificate, or certificate_chain. These are managed automatically.'
            };
        }

        return {
            result: "success",
            message: 'Let\'s Encrypt certificate configuration is valid'
        };
    }

    // Validate Custom certificate
    if (type === "custom") {
        // private_key is required
        if (!privateKey) {
            return {
                result: "failure",
                message: 'For custom certificates, private_key is required'
            };
        }

        // leaf_certificate is required
        if (!leafCertificate) {
            return {
                result: "failure",
                message: 'For custom certificates, leaf_certificate is required'
            };
        }

        // dns_names should not be provided for custom certificates
        if (dnsNames && Array.isArray(dnsNames) && dnsNames.length > 0) {
            return {
                result: "failure",
                message: 'For custom certificates, dns_names should not be provided. The domains will be extracted from the certificate.'
            };
        }

        // certificate_chain is optional, so we don't check for it
        return {
            result: "success",
            message: 'Custom certificate configuration is valid'
        };
    }

    // Invalid type
    return {
        result: "failure",
        message: `Invalid certificate type: "${type}". Must be either "lets_encrypt" or "custom"`
    };
}
