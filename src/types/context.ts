export type CacheContext = {
  revalidate: boolean,
} & ({
  fetchCache: boolean,
  fetchUrl: string,
  fetchIdx: number,
  tags: string[],
} | {
  isRoutePPREnabled: boolean,
  isFallback: boolean,
});
