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
      message: "resource ID not provided; please specify a reserved IP address to import",
    };
  }

  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  let isIpv6: boolean;

  if (ipv4Regex.test(resourceId)) {
    isIpv6 = false;
  } else if (ipv6Regex.test(resourceId)) {
    isIpv6 = true;
  } else {
    return {
      status: "error",
      message: `Invalid IP address format: ${resourceId}. Must be a valid IPv4 or IPv6 address.`,
    };
  }

  const endpoint = isIpv6 ? "reserved_ipv6" : "reserved_ips";

  const response = await fetch(`https://api.digitalocean.com/v2/${endpoint}/${resourceId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (response.status === 404) {
    return {
      status: "error",
      message: `Reserved IP with address ${resourceId} not found`,
    };
  }

  if (!response.ok) {
    const errorText = await response.text();
    return {
      status: "error",
      message: `Unable to fetch reserved IP; API returned ${response.status} ${response.statusText}: ${errorText}`,
    };
  }

  const responseJson = await response.json();

  let reservedIp;
  if (isIpv6) {
    reservedIp = responseJson.reserved_ipv6;
  } else {
    reservedIp = responseJson.reserved_ip;
    reservedIp.region_slug = reservedIp.region.slug;
  }

  if (!reservedIp) {
    return {
      status: "error",
      message: "Failed to extract reserved IP data from response",
    };
  }

  // Map API fields to domain properties
  const fieldMappings = {
    region: 'region_slug',
    droplet_id: 'droplet.id',
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

  const domainFields = mapApiFieldToDomain(reservedIp, fieldMappings);

  if (isIpv6) {
    domainFields['ip_version'] = 'ipv6';
  } else {
    domainFields['ip_version'] = 'ipv4';
  }

  console.log("reserved IP imported and attributes prepared for component creation");

  const ops = {
    update: {
      self: {
        properties: {
          domain: domainFields,
          resource: reservedIp,
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
