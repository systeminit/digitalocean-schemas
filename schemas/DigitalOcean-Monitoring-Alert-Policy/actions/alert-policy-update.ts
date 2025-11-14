async function main(component: Input): Promise<Output> {
  const resourceId = component.properties.si.resourceId;
  if (!resourceId) {
    return {
      status: "error",
      message: "Resource ID not found",
    };
  }

  const codeString = component.properties.code?.["doCreate"]?.code;
  if (!codeString) {
    return {
      status: "error",
      message: `Could not find doCreate code for resource`,
    };
  }

  const token = requestStorage.getEnv("DO_API_TOKEN");
  if (!token) {
    return {
      status: "error",
      message: "DO_API_TOKEN not found (hint: you may need a secret)",
    };
  }

  const response = await fetch(`https://api.digitalocean.com/v2/monitoring/alerts/${resourceId}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: codeString,
  });

  if (response.status === 404) {
    return {
      status: "error",
      message: `Monitoring Alert Policy with ID ${resourceId} not found`,
    };
  }

  if (!response.ok) {
    const errorText = await response.text();
    return {
      status: "error",
      message: `Unable to update alert; API returned ${response.status} ${response.statusText}: ${errorText}`,
    };
  }

  const responseJson = await response.json();

  if (responseJson.policy) {
    return {
      resourceId: resourceId,
      status: "ok",
      payload: responseJson.policy,
    };
  } else {
    return {
      status: "error",
      message: "Failed to extract policy data from response",
    };
  }
}
