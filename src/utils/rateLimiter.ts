/**
 * Client-side rate limiting implementation
 * Based on the technical documentation rate limiting requirements
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  blockDurationMs?: number;
}

interface RateLimitEntry {
  requests: number[];
  blockedUntil?: number;
}

class RateLimiter {
  private storage: Map<string, RateLimitEntry> = new Map();
  private configs: Map<string, RateLimitConfig> = new Map();

  constructor() {
    // Default rate limit configurations based on technical documentation
    this.setConfig('default', { maxRequests: 100, windowMs: 60 * 60 * 1000 }); // 100/hour
    this.setConfig('auth', { maxRequests: 10, windowMs: 60 * 1000, blockDurationMs: 5 * 60 * 1000 }); // 10/minute, 5min block
    this.setConfig('export', { maxRequests: 5, windowMs: 60 * 60 * 1000 }); // 5/hour
    this.setConfig('import', { maxRequests: 10, windowMs: 60 * 60 * 1000 }); // 10/hour
    this.setConfig('dashboard', { maxRequests: 60, windowMs: 60 * 60 * 1000 }); // 60/hour
    this.setConfig('api', { maxRequests: 100, windowMs: 60 * 60 * 1000 }); // 100/hour for general API calls
  }

  setConfig(key: string, config: RateLimitConfig): void {
    this.configs.set(key, config);
  }

  checkLimit(identifier: string, type: string = 'default'): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  } {
    const config = this.configs.get(type) || this.configs.get('default')!;
    const now = Date.now();
    const key = `${type}:${identifier}`;
    
    let entry = this.storage.get(key);
    if (!entry) {
      entry = { requests: [] };
      this.storage.set(key, entry);
    }

    // Check if currently blocked
    if (entry.blockedUntil && now < entry.blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.blockedUntil,
        retryAfter: entry.blockedUntil - now
      };
    }

    // Clean old requests outside the window
    const windowStart = now - config.windowMs;
    entry.requests = entry.requests.filter(time => time > windowStart);

    const remaining = config.maxRequests - entry.requests.length;
    
    if (remaining <= 0) {
      // Rate limit exceeded
      if (config.blockDurationMs) {
        entry.blockedUntil = now + config.blockDurationMs;
      }
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: windowStart + config.windowMs,
        retryAfter: config.blockDurationMs || (windowStart + config.windowMs - now)
      };
    }

    // Request allowed
    entry.requests.push(now);
    
    return {
      allowed: true,
      remaining: remaining - 1,
      resetTime: windowStart + config.windowMs
    };
  }

  // Helper method for API requests
  canMakeAPIRequest(endpoint: string, userId?: string): boolean {
    const identifier = userId || 'anonymous';
    const endpointType = this.getEndpointType(endpoint);
    
    const result = this.checkLimit(identifier, endpointType);
    
    if (!result.allowed) {
      console.warn(`Rate limit exceeded for ${endpointType}:${identifier}. Retry after ${result.retryAfter}ms`);
    }
    
    return result.allowed;
  }

  // Get rate limit info without consuming a request
  getInfo(identifier: string, type: string = 'default'): {
    remaining: number;
    resetTime: number;
    total: number;
  } {
    const config = this.configs.get(type) || this.configs.get('default')!;
    const now = Date.now();
    const key = `${type}:${identifier}`;
    
    const entry = this.storage.get(key);
    if (!entry) {
      return {
        remaining: config.maxRequests,
        resetTime: now + config.windowMs,
        total: config.maxRequests
      };
    }

    // Clean old requests
    const windowStart = now - config.windowMs;
    const validRequests = entry.requests.filter(time => time > windowStart);
    
    return {
      remaining: config.maxRequests - validRequests.length,
      resetTime: windowStart + config.windowMs,
      total: config.maxRequests
    };
  }

  // Clear rate limit for a specific identifier and type
  clearLimit(identifier: string, type: string = 'default'): void {
    const key = `${type}:${identifier}`;
    this.storage.delete(key);
  }

  // Clear all rate limits
  clearAll(): void {
    this.storage.clear();
  }

  // Get endpoint type based on URL pattern
  private getEndpointType(endpoint: string): string {
    if (endpoint.includes('/auth/')) return 'auth';
    if (endpoint.includes('/ics/export')) return 'export';
    if (endpoint.includes('/ics/import') || endpoint.includes('/ics/')) return 'import';
    if (endpoint.includes('/dashboard')) return 'dashboard';
    return 'api';
  }

  // Get current usage statistics
  getUsageStats(): Record<string, { 
    totalRequests: number; 
    activeUsers: number; 
    blockedUsers: number;
  }> {
    const stats: Record<string, { 
      totalRequests: number; 
      activeUsers: number; 
      blockedUsers: number;
    }> = {};
    
    const now = Date.now();
    
    for (const [key, entry] of this.storage.entries()) {
      const [type] = key.split(':');
      
      if (!stats[type]) {
        stats[type] = { totalRequests: 0, activeUsers: 0, blockedUsers: 0 };
      }
      
      stats[type].totalRequests += entry.requests.length;
      stats[type].activeUsers += 1;
      
      if (entry.blockedUntil && now < entry.blockedUntil) {
        stats[type].blockedUsers += 1;
      }
    }
    
    return stats;
  }

  // Cleanup old entries periodically
  cleanup(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.storage.entries()) {
      const [type] = key.split(':');
      const config = this.configs.get(type) || this.configs.get('default')!;
      
      // Remove entries that are completely expired
      const windowStart = now - config.windowMs;
      entry.requests = entry.requests.filter(time => time > windowStart);
      
      // Remove blocked entries that have expired
      if (entry.blockedUntil && now >= entry.blockedUntil) {
        entry.blockedUntil = undefined;
      }
      
      // Remove empty entries
      if (entry.requests.length === 0 && !entry.blockedUntil) {
        this.storage.delete(key);
      }
    }
  }
}

// Create singleton instance
export const rateLimiter = new RateLimiter();

// Setup periodic cleanup (every 5 minutes)
setInterval(() => {
  rateLimiter.cleanup();
}, 5 * 60 * 1000);

// Export utility function for easy use in API calls
export const withRateLimit = async <T>(
  identifier: string,
  type: string,
  operation: () => Promise<T>
): Promise<T> => {
  const result = rateLimiter.checkLimit(identifier, type);
  
  if (!result.allowed) {
    const error = new Error('Rate limit exceeded');
    (error as any).retryAfter = result.retryAfter;
    (error as any).resetTime = result.resetTime;
    throw error;
  }
  
  return await operation();
};

// React hook for rate limiting
export const useRateLimit = (identifier: string, type: string = 'default') => {
  const [info, setInfo] = React.useState(() => 
    rateLimiter.getInfo(identifier, type)
  );
  
  React.useEffect(() => {
    const updateInfo = () => {
      setInfo(rateLimiter.getInfo(identifier, type));
    };
    
    const interval = setInterval(updateInfo, 1000);
    return () => clearInterval(interval);
  }, [identifier, type]);
  
  const checkLimit = React.useCallback(() => {
    const result = rateLimiter.checkLimit(identifier, type);
    setInfo({
      remaining: result.remaining,
      resetTime: result.resetTime,
      total: rateLimiter.getInfo(identifier, type).total
    });
    return result;
  }, [identifier, type]);
  
  return {
    ...info,
    checkLimit,
    canMakeRequest: info.remaining > 0
  };
};

// Add React import for the hook
import React from 'react';