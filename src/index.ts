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

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || "6379"),
});

export default class CacheHandler {
  options: unknown;
  memory: Map<string, unknown>;

  constructor(options: unknown) {
    this.options = options;
    this.memory = new Map();
  }

  async get(key: string) {
    if (this.memory.get(key)) {
      return this.memory.get(key);
    }
    const cache = await redis.get(`key:${key}`);
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
      await redis.set(`key:${key}`, JSON.stringify(cacheBody));
      if ("tags" in ctx) {
        for (const tag of ctx.tags) {
          await redis.sadd(`tag:${tag}`, key);
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
      const keys = await redis.smembers(`tag:${tag}`);
      for (const key of keys) {
        await redis.del(`key:${key}`);
      }
      await redis.del(`tag:${tag}`);
    }
  }

  // If you want to have temporary in memory cache for a single request that is reset
  // before the next request you can leverage this method
  // public resetRequestCache() {}
}
