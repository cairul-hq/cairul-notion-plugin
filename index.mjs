import {
  bearer,
  connection,
  matchesState,
  resourceCheck,
  segment,
  stateOption,
  target,
  text,
  verdict,
} from '@cairul/plugin-kit';

export default function notion(options) {
  const api = connection(options, {
    prefix: 'NOTION',
    baseUrl: 'https://api.notion.com/v1',
    tokenEnv: 'NOTION_TOKEN',
    required: true,
    authModes: { bearer },
    headers: { 'notion-version': '2025-09-03' },
  });
  const page = (shape, evaluate) =>
    resourceCheck({
      api,
      identifier: 'page',
      parseURL: (url) => target(undefined, url, ['notion.so', 'www.notion.so', api.host], /([a-f0-9]{32})(?:\/|$)/i),
      path: (id) => `pages/${segment(id)}`,
      shape: { property: text, ...shape },
      evaluate: (data, config) => {
        const properties = data.properties ?? {};
        const property = Object.hasOwn(properties, config.property)
          ? properties[config.property]
          : Object.values(properties).find(({ id }) => id === config.property);
        return evaluate(property, config);
      },
    });
  return {
    checkKinds: {
      'notion.page-status': page({ state: stateOption }, (property, { state }) =>
        matchesState(property?.status?.name ?? property?.select?.name, state, 'Page')
      ),
      'notion.property-present': page({}, (property) => {
        const value = property?.[property.type];
        return verdict(
          value != null && value !== '' && (!Array.isArray(value) || value.length > 0),
          'Waiting for page property.'
        );
      }),
    },
  };
}
