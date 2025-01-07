import Redis from "ioredis";

type CacheStructure = {
  value: unknown,
  lastModified: number,
  tags: string[],
};

type CacheContext = {
  fetchCache: boolean,
  revalidate: boolean,
  fetchUrl: string,
  fetchIdx: number,
  tags: string[],
};

export default class CacheHandler {
  options: unknown;
  redis: Redis;

  constructor(options: unknown) {
    this.options = options;
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || "6379"),
    });
  }

  async get(key: string) {
    const cache = await this.redis.get(`key:${key}`);
    return cache && JSON.parse(cache);
  }

  async set(key: string, cache: unknown, ctx: CacheContext) {
    await this.redis.set(`key:${key}`, JSON.stringify({
      value: cache,
      lastModified: Date.now(),
      tags: ctx.tags,
    } as CacheStructure));
    for (const tag of ctx.tags) {
      await this.redis.sadd(`tag:${tag}`, key);
    }
  }

  async revalidateTag(tags: string[] | string) {
    tags = [tags].flat();
    for (const tag of tags) {
      const keys = await this.redis.smembers(`tag:${tag}`);
      for (const key of keys) {
        await this.redis.del(`key:${key}`);
      }
      await this.redis.del(`tag:${tag}`);
    }
  }

  // If you want to have temporary in memory cache for a single request that is reset
  // before the next request you can leverage this method
  // public resetRequestCache() {}
}
