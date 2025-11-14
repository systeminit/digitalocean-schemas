async function main(component: Input): Promise<Output> {
  const payload = _.cloneDeep(component.domain);
  payload['region_slug'] = payload.region; // IPV6 takes in region as region_slug
  const cleaned = extLib.removeEmpty(payload);

  return {
    format: "json",
    code: JSON.stringify(cleaned, null, 2),
  };
}
