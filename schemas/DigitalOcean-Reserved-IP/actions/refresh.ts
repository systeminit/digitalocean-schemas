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

  const isIpv6 = component.properties.domain.ip_version === "ipv6";

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
      message: `Reserved IP with ID ${resourceId} not found`,
    };
  }

  if (!response.ok) {
    const errorText = await response.text();
    return {
      status: "error",
      message: `Unable to read reserved_ip; API returned ${response.status} ${response.statusText}: ${errorText}`,
    };
  }

  const responseJson = await response.json();
  console.log(responseJson);

  const payload = isIpv6 ? responseJson.reserved_ipv6 : responseJson.reserved_ip;

  if (payload) {
    return {
      status: "ok",
      payload: payload,
    };
  } else {
    return {
      status: "error",
      message: "Failed to extract reserved_ip data from response",
    };
  }
}
