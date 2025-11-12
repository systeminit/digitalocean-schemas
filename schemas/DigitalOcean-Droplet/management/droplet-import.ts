async function main({
  thisComponent
}: Input): Promise<Output> {
  const token = requestStorage.getEnv("DO_API_TOKEN");
  if (!token) throw new Error("DO_API_TOKEN not found (hint: you may need a secret)");

  const component = thisComponent.properties;
  let resourceId = _.get(component, ["si", "resourceId"]);
  if (!resourceId) {
    return {
      status: "error",
      message: "resource ID not provided; please specify a droplet ID to import",
    };
  }

  const response = await fetch(`https://api.digitalocean.com/v2/droplets/${resourceId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (response.status === 404) {
    return {
      status: "error",
      message: `Droplet with ID ${resourceId} not found`,
    };
  }

  if (!response.ok) {
    const errorText = await response.text();
    return {
      status: "error",
      message: `Unable to fetch droplet; API returned ${response.status} ${response.statusText}: ${errorText}`,
    };
  }

  const responseJson = await response.json();
  const droplet = responseJson.droplet;
  if (!droplet) {
    return {
      status: "error",
      message: "Failed to extract droplet data from response",
    };
  }

  // Map API fields to domain properties
  const fieldMappings = {
    name: 'name',
    region: 'region.slug',
    size: 'size.slug',
    image: 'image.slug',
    ssh_keys: 'ssh_keys',
    backups: 'backup_ids',
    ipv6: 'networks.v6',
    monitoring: 'features',
    tags: 'tags',
    volumes: 'volume_ids',
    vpc_uuid: 'vpc_uuid',
    with_droplet_agent: 'features'
  };

  function getNestedValue(obj, path) {
    if (typeof path === 'string') {
      return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    return obj?.[path];
  }

  function mapApiFieldToDomain(apiData, fieldMappings) {
    const domainData = {};

    for (const [domainField, apiPath] of Object.entries(fieldMappings)) {
      const value = getNestedValue(apiData, apiPath);
      if (value !== undefined && value !== null) {
        domainData[domainField] = value;
      }
    }

    return domainData;
  }

  const domainFields = mapApiFieldToDomain(droplet, fieldMappings);

  // Post-process specific fields that need transformation
  if (droplet.image?.slug) {
    domainFields.image = droplet.image.slug;
  } else if (droplet.image?.distribution && droplet.image?.name) {
    // Fallback for images without slug
    domainFields.image = `${droplet.image.distribution.toLowerCase()}-${droplet.image.name.replace(/\s+/g, '-').toLowerCase()}`;
  }

  // Transform backup_ids array to boolean
  if (Array.isArray(droplet.backup_ids)) {
    domainFields.backups = droplet.backup_ids.length > 0;
  }

  // Transform features array to monitoring and droplet_agent booleans
  if (Array.isArray(droplet.features)) {
    domainFields.monitoring = droplet.features.includes('monitoring');
    domainFields.with_droplet_agent = droplet.features.includes('droplet_agent');
  }

  // Transform IPv6 networks to boolean
  if (droplet.networks?.v6) {
    domainFields.ipv6 = Array.isArray(droplet.networks.v6) && droplet.networks.v6.length > 0;
  }

  console.log("droplet imported and attributes prepared for component creation");

  const ops = {
    update: {
      self: {
        properties: {
          domain: domainFields,
          resource: droplet,
        }
      }
    },
  };

  return {
    status: "ok",
    message: "Imported Resource",
    ops,
  };
}
