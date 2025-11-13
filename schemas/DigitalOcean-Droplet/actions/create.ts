async function main(component: Input): Promise<Output> {
  if (component.properties.resource) {
    return {
      status: "error",
      message: "Resource already exists",
      payload: component.properties.resource,
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

  console.log("calling fetch");
  const response = await fetch("https://api.digitalocean.com/v2/droplets", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: codeString,
  });
  console.log("called fetch");

  if (!response.ok) {
    const errorText = await response.text();
    return {
      status: "error",
      message: `Unable to create droplet; API returned ${response.status} ${response.statusText}: ${errorText}`,
    };
  }

  console.log("droplet created successfully");
  const responseJson = await response.json();
  console.log("getting id");
  const dropletId = responseJson.droplet?.id;

  console.log("getting id");
  if (dropletId) {
    return {
      resourceId: dropletId.toString(),
      status: "ok",
      payload: responseJson.droplet,
    };
  } else {
    return {
      message: "Failed to extract droplet id from response",
      status: "error",
    };
  }
}

