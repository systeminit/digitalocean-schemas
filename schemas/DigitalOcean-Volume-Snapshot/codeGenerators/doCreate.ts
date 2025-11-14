async function main(component: Input): Promise<Output> {
  const payload = _.cloneDeep(component.domain);
  const cleaned = extLib.removeEmpty(payload);

  return {
    format: "json",
    code: JSON.stringify(cleaned, null, 2),
  };
}
