async function main(component: Input): Promise<Output> {
  const payload = _.cloneDeep(component.domain);
  const cleaned = extLib.removeEmpty(payload);

  // Return direct DigitalOcean API payload (no wrapper needed)
  return {
    format: "json",
    code: JSON.stringify(cleaned, null, 2),
  };
}
