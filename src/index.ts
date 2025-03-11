import Redis from "ioredis";
import type { CacheContext } from "./types/context";
import type { CacheStructure } from "./types/structure";

const cacheMap = new Map<string, CacheStructure>();
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || "6379"),
  connectionName: process.title,
});
redis.on("connect", () => console.log("Connected to Redis"));
redis.on("ready", () => console.log("Redis is ready"));
redis.on("error", error => {
  if (error.message.includes("ECONNREFUSED")) {
    const [_, _errorName, address] = error.message.split(" ");
    console.log(`Redis can't connect (${address})`);
  }
});
redis.on("end", () => console.log("Redis connection closed"));
redis.on("reconnecting", (time: number) => console.log(`Reconnecting in ${time}ms`));

export default class CacheHandler {
  options: unknown;

  constructor(options: unknown) {
    this.options = options;
  }

  async get(key: string) {
    try {
      if (cacheMap.get(key)) {
        return cacheMap.get(key);
      }
      const cache = await redis.get(`key:${key}`);
      if (cache) {
        return JSON.parse(cache) as CacheStructure;
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  async set(key: string, cache: CacheStructure["value"], ctx: CacheContext) {
    const cacheBody: CacheStructure = {
      value: cache,
      lastModified: Date.now(),
    };
    if ("tags" in ctx) {
      cacheBody.tags = ctx.tags;
    }
    if (cache.kind === "FETCH") {
      try {
        await redis.set(`key:${key}`, JSON.stringify(cacheBody));
        if ("tags" in ctx) {
          for (const tag of ctx.tags) {
            await redis.sadd(`tag:${tag}`, key);
          }
        }
      } catch {
        // do nothing
      }
    } else {
      cacheMap.set(key, cacheBody);
    }
  }

  async revalidateTag(tags: string[] | string) {
    try {
      tags = [tags].flat();
      for (const tag of tags) {
        const keys = await redis.smembers(`tag:${tag}`);
        for (const key of keys) {
          await redis.del(`key:${key}`);
        }
        await redis.del(`tag:${tag}`);
      }
    } catch {
      // do nothing
    }
  }

  // If you want to have temporary in memory cache for a single request that is reset
  // before the next request you can leverage this method
  // public resetRequestCache() {}
}
