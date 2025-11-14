function main() {
    // DigitalOcean API Token secret
    const DOCredentialSecretProp = new SecretPropBuilder()
        .setName("DigitalOcean Credential")
        .setSecretKind("DigitalOcean Credential")
        .build();

    // IP Version property - required to specify if creating IPv4 or IPv6 reserved IP
    const ipVersionProp = new PropBuilder()
        .setName("ip_version")
        .setKind("string")
        .setHidden(false)
        .setWidget(new PropWidgetDefinitionBuilder()
            .setKind("comboBox")
            .addOption("IPv4", "ipv4")
            .addOption("IPv6", "ipv6")
            .setCreateOnly()
            .build())
        .setValidationFormat(Joi.string().required().valid("ipv4", "ipv6"))
        .setDocumentation("The IP version to create - IPv4 or IPv6 reserved IP.")
        .build();

    // Droplet ID property - required when type is "assign" (IPv4 only)
    const dropletIdProp = new PropBuilder()
        .setName("droplet_id")
        .setKind("float")
        .setHidden(false)
        .setWidget(new PropWidgetDefinitionBuilder()
            .setKind("text")
            .setCreateOnly()
            .build())
        .setDocumentation("The ID of the Droplet that the reserved IP will be assigned to. Required when type is 'assign' for IPv4 reserved IPs.")
        .build();

    // Region property - required when type is "reserve" for IPv4, or always for IPv6
    const regionProp = new PropBuilder()
        .setName("region")
        .setKind("string")
        .setHidden(false)
        .setWidget(new PropWidgetDefinitionBuilder()
            .setKind("comboBox")
            .addOption("New York 1", "nyc1")
            .addOption("New York 3", "nyc3")
            .addOption("Amsterdam 3", "ams3")
            .addOption("San Francisco 3", "sfo3")
            .addOption("Singapore 1", "sgp1")
            .addOption("London 1", "lon1")
            .addOption("Frankfurt 1", "fra1")
            .addOption("Toronto 1", "tor1")
            .addOption("Bangalore 1", "blr1")
            .setCreateOnly()
            .build())
        .setDocumentation("The slug identifier for the region the reserved IP will be reserved to. Required when type is 'reserve' for IPv4, or always for IPv6 reserved IPs.")
        .build();

    // Project ID property - optional for IPv4 when reserving to region, not used for IPv6
    const projectIdProp = new PropBuilder()
        .setName("project_id")
        .setKind("string")
        .setHidden(false)
        .setWidget(new PropWidgetDefinitionBuilder()
            .setKind("text")
            .setCreateOnly()
            .build())
        .setDocumentation("The UUID of the project to which the reserved IP will be assigned. Optional for IPv4 when reserving to region. If not specified, the reserved IP will be assigned to your default project.")
        .build();

    const ipProp = new PropBuilder()
      .setName("ip")
      .setKind("string")
      .setHidden(false)
      .setWidget(new PropWidgetDefinitionBuilder()
        .setKind("text")
        .build())
      .setDocumentation("The value of the reserved IP.")
      .build();
    // TODO add other resource props

    // Create the asset
    const asset = new AssetBuilder()
        .addProp(dropletIdProp)
        .addProp(ipVersionProp)
        .addProp(dropletIdProp)
        .addProp(regionProp)
        .addProp(projectIdProp)
        .addResourceProp(ipProp)
        .addSecretProp(DOCredentialSecretProp)
        .build();

    return asset;
}