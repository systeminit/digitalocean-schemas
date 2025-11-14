async function main(component: Input): Promise<Output> {
  const resourceId = component.properties.si.resourceId;
  if (!resourceId) {
    return {
      status: "error",
      message: "Resource ID not found",
    };
  }

  const token = requestStorage.getEnv("DO_API_TOKEN");
  if (!token) {
    return {
      status: "error",
      message: "DO_API_TOKEN not found (hint: you may need a secret)",
    };
  }

  const response = await fetch(`https://api.digitalocean.com/v2/account/keys/${resourceId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
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
      message: `Unable to read ssh_key; API returned ${response.status} ${response.statusText}: ${errorText}`,
    };
  }

  const responseJson = await response.json();

  if (responseJson.ssh_key) {
    return {
      status: "ok",
      payload: responseJson.ssh_key,
    };
  } else {
    return {
      status: "error",
      message: "Failed to extract ssh_key data from response",
    };
  }
}
