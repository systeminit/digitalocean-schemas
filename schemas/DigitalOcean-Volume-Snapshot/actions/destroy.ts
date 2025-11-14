async function main(component: Input): Promise<Output> {
  if (!component.properties.resource) {
    return {
      status: "error",
      message: "No resource found to delete",
    };
  }

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

  const response = await fetch(`https://api.digitalocean.com/v2/volumes/snapshots/${resourceId}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      status: "error",
      message: `Unable to delete snapshot; API returned ${response.status} ${response.statusText}: ${errorText}`,
    };
  }

  return {
    status: "ok",
  };
}
