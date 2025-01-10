import Redis from "ioredis";

type CacheStructure = {
  value: {
    kind: "FETCH" | "APP_PAGE" | "APP_ROUTE",
  },
  lastModified: number,
  tags?: string[],
};

type CacheContext = {
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

export default class CacheHandler {
  options: unknown;
  redis: Redis;
  memory: Map<string, unknown>;

  constructor(options: unknown) {
    this.options = options;
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || "6379"),
    });
    this.memory = new Map();
  }

  async get(key: string) {
    if (this.memory.get(key)) {
      return this.memory.get(key);
    }
    const cache = await this.redis.get(`key:${key}`);
    return cache && JSON.parse(cache);
  }

  async set(key: string, cache: CacheStructure["value"], ctx: CacheContext) {
    if (cache.kind === "FETCH") {
      const cacheBody: CacheStructure = {
        value: cache,
        lastModified: Date.now(),
      };
      if ("tags" in ctx) {
        cacheBody.tags = ctx.tags;
      }
      await this.redis.set(`key:${key}`, JSON.stringify(cacheBody));
      if ("tags" in ctx) {
        for (const tag of ctx.tags) {
          await this.redis.sadd(`tag:${tag}`, key);
        }
      }
    } else {
      this.memory.set(key, {
        value: cache,
        lastModified: Date.now(),
      });
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
