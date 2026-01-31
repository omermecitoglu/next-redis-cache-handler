export type CacheStructure = {
  value: {
    kind: "FETCH" | "APP_PAGE" | "APP_ROUTE",
    data: {
      body: string,
      status: number,
      headers: Record<string, string>,
    },
  },
  lastModified: number,
  tags?: string[],
};
