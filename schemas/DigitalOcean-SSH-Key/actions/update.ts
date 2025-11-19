async function main(component: Input): Promise < Output > {
  const resourceId = component.properties.si.resourceId;
  if (!resourceId) {
    return {
      status: "error",
      message: "Resource ID not found",
    };
  }

  const name = component.properties.domain.name;
  if (!name || name.length === 0) {
    return {
      status: "error",
      message: `Could not find name for resource`,
    };
  }

  const token = requestStorage.getEnv("DO_API_TOKEN");
  if (!token) {
    return {
      status: "error",
      message: "DO_API_TOKEN not found (hint: you may need a secret)",
    };
  }

  const body = JSON.stringify({ name });

  const response = await fetch(`https://api.digitalocean.com/v2/account/keys/${resourceId}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body,
  });

  if (response.status === 404) {
    return {
      status: "error",
      message: `SSH Key with ID ${resourceId} not found`,
    };
  }

  if (!response.ok) {
    const errorText = await response.text();
    return {
      status: "error",
      message: `Unable to update SSH key; API returned ${response.status} ${response.statusText}: ${errorText}`,
    };
  }

  const responseJson = await response.json();

  if (responseJson.ssh_key) {
    return {
      resourceId: resourceId,
      status: "ok",
      payload: responseJson.ssh_key,
    };
  } else {
    return {
      status: "error",
      message: "Failed to extract firewall data from response",
    };
  }
}
