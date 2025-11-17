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
      message: "resource ID not provided; please specify a functions namespace ID to import",
    };
  }

  const response = await fetch(`https://api.digitalocean.com/v2/functions/namespaces/${resourceId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (response.status === 404) {
    return {
      status: "error",
      message: `Functions namespace with ID ${resourceId} not found`,
    };
  }

  if (!response.ok) {
    const errorText = await response.text();
    return {
      status: "error",
      message: `Unable to fetch functions namespace; API returned ${response.status} ${response.statusText}: ${errorText}`,
    };
  }

  const responseJson = await response.json();
  const namespace = responseJson.namespace;
  if (!namespace) {
    return {
      status: "error",
      message: "Failed to extract namespace data from response",
    };
  }

  // Map API fields to domain properties
  const fieldMappings = {
    label: 'label',
    region: 'region',
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

  const domainFields = mapApiFieldToDomain(namespace, fieldMappings);

  console.log("functions namespace imported and attributes prepared for component creation");

  const ops = {
    update: {
      self: {
        properties: {
          domain: domainFields,
          resource: namespace,
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
