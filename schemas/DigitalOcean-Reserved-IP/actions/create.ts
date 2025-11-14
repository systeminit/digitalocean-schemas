async function main(component: Input): Promise<Output> {
  if (component.properties.resource) {
    return {
      status: "error",
      message: "Resource already exists",
      payload: component.properties.resource,
    };
  }

  const ipVersion = component.properties.domain.ip_version;
  if (component.properties.resource) {
    return {
      status: "error",
      message: "Resource already exists",
      payload: component.properties.resource,
    };
  }

  const isIpv6 = ipVersion === "ipv6";

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

  const endpoint = isIpv6 ? "reserved_ipv6" : "reserved_ips";

  const response = await fetch(`https://api.digitalocean.com/v2/${endpoint}`, {
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
      message: `Unable to create reserved_ip; API returned ${response.status} ${response.statusText}: ${errorText}`,
    };
  }

  const responseJson = await response.json();
  console.log(responseJson);

  const payload = isIpv6 ? responseJson.reserved_ipv6 : responseJson.reserved_ip;

  const resourceId = payload?.ip;

  if (resourceId) {
    return {
      resourceId: resourceId.toString(),
      status: "ok",
      payload: payload,
    };
  } else {
    return {
      message: "Failed to extract reserved_ip id from response",
      status: "error",
    };
  }
}
