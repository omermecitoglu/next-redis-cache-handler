export type CacheStructure = {
  value: {
    kind: "FETCH" | "APP_PAGE" | "APP_ROUTE",
  },
  lastModified: number,
  tags?: string[],
};
