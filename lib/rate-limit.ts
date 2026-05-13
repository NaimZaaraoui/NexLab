import { RateLimiterMemory } from 'rate-limiter-flexible';

const authLimiter = new RateLimiterMemory({
  points: 5, // 5 attempts
  duration: 60 * 15, // per 15 minutes by IP
});

export async function checkRateLimit(ip: string): Promise<boolean> {
  try {
    await authLimiter.consume(ip);
    return true; // OK
  } catch (rejRes) {
    return false; // Blocked
  }
}
