/**
 * Security utilities for MedicoAgenda
 * Implements client-side security measures and data protection
 */

// Input sanitization
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  // Remove HTML tags and potentially dangerous characters
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>?/gm, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

// Validate email format
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

// Validate Brazilian CRM format
export const validateCRM = (crm: string): boolean => {
  const crmRegex = /^\d{4,6}\/[A-Z]{2}$/;
  return crmRegex.test(crm);
};

// Password strength validation
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length < 8) {
    feedback.push('Senha deve ter pelo menos 8 caracteres');
  } else {
    score += 1;
  }

  if (!/[a-z]/.test(password)) {
    feedback.push('Adicione pelo menos uma letra minúscula');
  } else {
    score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    feedback.push('Adicione pelo menos uma letra maiúscula');
  } else {
    score += 1;
  }

  if (!/\d/.test(password)) {
    feedback.push('Adicione pelo menos um número');
  } else {
    score += 1;
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    feedback.push('Adicione pelo menos um caractere especial');
  } else {
    score += 1;
  }

  return {
    isValid: score >= 4,
    score,
    feedback
  };
};

// Rate limiting for client-side requests
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  canMakeRequest(key: string, maxRequests: number, timeWindow: number): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the time window
    const validRequests = requests.filter(time => now - time < timeWindow);
    
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }
  
  getRemainingRequests(key: string, maxRequests: number): number {
    const requests = this.requests.get(key) || [];
    return Math.max(0, maxRequests - requests.length);
  }
}

export const rateLimiter = new RateLimiter();

// Secure data storage with encryption
class SecureStorage {
  private encrypt(data: string): string {
    // Simple Base64 encoding for demo - in production, use proper encryption
    return btoa(encodeURIComponent(data));
  }
  
  private decrypt(encryptedData: string): string {
    try {
      return decodeURIComponent(atob(encryptedData));
    } catch (error) {
      console.error('Failed to decrypt data:', error);
      return '';
    }
  }
  
  setSecureItem(key: string, value: any): void {
    try {
      const stringValue = JSON.stringify(value);
      const encrypted = this.encrypt(stringValue);
      localStorage.setItem(`secure_${key}`, encrypted);
    } catch (error) {
      console.error('Failed to store secure item:', error);
    }
  }
  
  getSecureItem<T>(key: string): T | null {
    try {
      const encrypted = localStorage.getItem(`secure_${key}`);
      if (!encrypted) return null;
      
      const decrypted = this.decrypt(encrypted);
      return JSON.parse(decrypted) as T;
    } catch (error) {
      console.error('Failed to retrieve secure item:', error);
      return null;
    }
  }
  
  removeSecureItem(key: string): void {
    localStorage.removeItem(`secure_${key}`);
  }
}

export const secureStorage = new SecureStorage();

// Data privacy compliance utilities
export const dataPrivacy = {
  // Anonymize user data
  anonymizeUserData: (userData: any): any => {
    return {
      ...userData,
      name: 'Usuário Anonimizado',
      email: `anonimo${Date.now()}@exemplo.com`,
      phone: null,
      // Keep only necessary non-identifying data
      specialty: userData.specialty,
      createdAt: userData.createdAt
    };
  },
  
  // Check if data contains sensitive information
  containsSensitiveData: (data: string): boolean => {
    const sensitivePatterns = [
      /\d{3}\.\d{3}\.\d{3}-\d{2}/, // CPF
      /\d{11}/, // Raw CPF
      /\d{4,6}\/[A-Z]{2}/, // CRM
      /\(\d{2}\)\s?\d{4,5}-?\d{4}/, // Phone numbers
    ];
    
    return sensitivePatterns.some(pattern => pattern.test(data));
  },
  
  // Mask sensitive data for display
  maskSensitiveData: (data: string, type: 'cpf' | 'phone' | 'crm'): string => {
    switch (type) {
      case 'cpf':
        return data.replace(/(\d{3})\.\d{3}\.(\d{3})-(\d{2})/, '$1.***.$2-$3');
      case 'phone':
        return data.replace(/(\(\d{2}\))\s?(\d{4,5})-?(\d{4})/, '$1 ****-$3');
      case 'crm':
        return data.replace(/(\d{4,6})\/([A-Z]{2})/, '****/$2');
      default:
        return data;
    }
  }
};

// Security headers for requests
export const getSecurityHeaders = (): Record<string, string> => {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  };
};

// CSRF protection
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Audit logging for security events
interface SecurityEvent {
  type: 'login' | 'logout' | 'failed_login' | 'data_access' | 'data_export';
  timestamp: number;
  userAgent: string;
  ip?: string;
  details?: any;
}

class SecurityLogger {
  private events: SecurityEvent[] = [];
  private maxEvents = 1000;
  
  logEvent(type: SecurityEvent['type'], details?: any): void {
    const event: SecurityEvent = {
      type,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      details
    };
    
    this.events.push(event);
    
    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
    
    // Store in secure storage
    secureStorage.setSecureItem('security_events', this.events);
    
    console.log(`Security Event: ${type}`, event);
  }
  
  getEvents(type?: SecurityEvent['type']): SecurityEvent[] {
    const events = secureStorage.getSecureItem<SecurityEvent[]>('security_events') || [];
    return type ? events.filter(event => event.type === type) : events;
  }
  
  clearEvents(): void {
    this.events = [];
    secureStorage.removeSecureItem('security_events');
  }
}

export const securityLogger = new SecurityLogger();

// Input validation schemas
export const validationSchemas = {
  event: {
    title: {
      required: true,
      minLength: 1,
      maxLength: 200,
      sanitize: true
    },
    description: {
      required: false,
      maxLength: 1000,
      sanitize: true
    },
    location: {
      required: false,
      maxLength: 200,
      sanitize: true
    },
    value: {
      required: false,
      min: 0,
      max: 999999.99
    }
  },
  
  user: {
    name: {
      required: true,
      minLength: 2,
      maxLength: 100,
      sanitize: true
    },
    email: {
      required: true,
      validator: validateEmail
    },
    crm: {
      required: true,
      validator: validateCRM
    }
  }
};

// Generic validator function
export const validateField = (
  value: any,
  rules: any
): { isValid: boolean; error?: string } => {
  if (rules.required && (!value || value.toString().trim() === '')) {
    return { isValid: false, error: 'Campo obrigatório' };
  }
  
  if (!value) return { isValid: true };
  
  const stringValue = value.toString();
  
  if (rules.minLength && stringValue.length < rules.minLength) {
    return { 
      isValid: false, 
      error: `Mínimo de ${rules.minLength} caracteres` 
    };
  }
  
  if (rules.maxLength && stringValue.length > rules.maxLength) {
    return { 
      isValid: false, 
      error: `Máximo de ${rules.maxLength} caracteres` 
    };
  }
  
  if (rules.min && Number(value) < rules.min) {
    return { 
      isValid: false, 
      error: `Valor mínimo: ${rules.min}` 
    };
  }
  
  if (rules.max && Number(value) > rules.max) {
    return { 
      isValid: false, 
      error: `Valor máximo: ${rules.max}` 
    };
  }
  
  if (rules.validator && !rules.validator(value)) {
    return { 
      isValid: false, 
      error: 'Formato inválido' 
    };
  }
  
  return { isValid: true };
};
