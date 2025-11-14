async function main(component: Input): Promise<Output> {
  if (component.properties.resource) {
    return {
      status: "error",
      message: "Resource already exists",
      payload: component.properties.resource,
    };
  }

  const codeString = component.properties.code?.["vpc-codegen"]?.code;
  if (!codeString) {
    return {
      status: "error",
      message: `Could not find vpc-codegen code for resource`,
    };
  }

  const token = requestStorage.getEnv("DO_API_TOKEN");
  if (!token) {
    return {
      status: "error",
      message: "DO_API_TOKEN not found (hint: you may need a secret)",
    };
  }

  const response = await fetch("https://api.digitalocean.com/v2/vpcs", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: codeString,
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      status: "error",
      message: `Unable to create vpc; API returned ${response.status} ${response.statusText}: ${errorText}`,
    };
  }

  const responseJson = await response.json();
  const resourceId = responseJson.vpc?.id;

  if (resourceId) {
    return {
      resourceId: resourceId.toString(),
      status: "ok",
      payload: responseJson.vpc,
    };
  } else {
    return {
      message: "Failed to extract vpc id from response",
      status: "error",
    };
  }
}
