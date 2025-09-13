/**
 * API Client for MedicoAgenda
 * Handles all communication with the backend Flask API
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  message?: string;
  timestamp: string;
}

interface DashboardData {
  metrics: {
    total_hours: number;
    total_shifts: number;
    monthly_revenue: number;
    completion_rate: number;
  };
  upcoming_events: Array<{
    id: number;
    title: string;
    start_time: string;
    end_time: string;
    event_type: string;
    status: string;
    value?: number;
    location?: string;
    hospital?: {
      id: number;
      name: string;
    };
    calendar?: {
      id: number;
      name: string;
      color: string;
    };
  }>;
  quick_summary: {
    events_today: number;
    events_this_week: number;
    next_shift_time: string;
    net_revenue: number;
  };
}

interface Event {
  id?: number;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  event_type: 'PLANTAO' | 'CONSULTA' | 'PROCEDIMENTO' | 'AULA' | 'REUNIAO' | 'ADMINISTRATIVO' | 'PESSOAL';
  status?: 'CONFIRMADO' | 'TENTATIVO' | 'AGUARDANDO' | 'CANCELADO' | 'REALIZADO' | 'NAO_REALIZADO';
  value?: number;
  hospital_id?: number;
  calendar_id: number;
  user_id?: number;
}

interface Calendar {
  id?: number;
  name: string;
  category: 'PLANTAO' | 'AMBULATORIO' | 'ACADEMICO' | 'FINANCEIRO' | 'PESSOAL' | 'ADMINISTRATIVO';
  color: string;
  description?: string;
  is_active?: boolean;
  event_count?: number;
}

class ApiClient {
  private baseURL: string;
  private authToken: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.loadAuthToken();
  }

  private loadAuthToken(): void {
    this.authToken = localStorage.getItem('auth_token');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      return await this.handleResponse<T>(response);
    } catch (error) {
      console.error(`API Request failed: ${url}`, error);
      throw error;
    }
  }

  // Authentication methods
  async login(email: string, password: string): Promise<ApiResponse<{ token: string; user: any }>> {
    const response = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.data?.token) {
      this.authToken = response.data.token;
      localStorage.setItem('auth_token', this.authToken);
    }

    return response;
  }

  async logout(): Promise<void> {
    this.authToken = null;
    localStorage.removeItem('auth_token');
  }

  // Dashboard methods
  async getDashboard(userId: number = 1): Promise<ApiResponse<DashboardData>> {
    return this.request<DashboardData>(`/dashboard?user_id=${userId}`);
  }

  // Calendar methods
  async getCalendars(userId?: number, category?: string): Promise<ApiResponse<Calendar[]>> {
    const params = new URLSearchParams();
    if (userId) params.append('user_id', userId.toString());
    if (category) params.append('category', category);
    
    const queryString = params.toString();
    return this.request<Calendar[]>(`/calendars${queryString ? `?${queryString}` : ''}`);
  }

  async createCalendar(calendar: Calendar): Promise<ApiResponse<Calendar>> {
    return this.request<Calendar>('/calendars', {
      method: 'POST',
      body: JSON.stringify(calendar),
    });
  }

  async updateCalendar(id: number, calendar: Partial<Calendar>): Promise<ApiResponse<Calendar>> {
    return this.request<Calendar>(`/calendars/${id}`, {
      method: 'PUT',
      body: JSON.stringify(calendar),
    });
  }

  async deleteCalendar(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/calendars/${id}`, {
      method: 'DELETE',
    });
  }

  // Event methods
  async getEvents(filters?: {
    startDate?: string;
    endDate?: string;
    calendarId?: number;
    eventType?: string;
    userId?: number;
  }): Promise<ApiResponse<Event[]>> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('start_date', filters.startDate);
    if (filters?.endDate) params.append('end_date', filters.endDate);
    if (filters?.calendarId) params.append('calendar_id', filters.calendarId.toString());
    if (filters?.eventType) params.append('event_type', filters.eventType);
    if (filters?.userId) params.append('user_id', filters.userId.toString());
    
    const queryString = params.toString();
    return this.request<Event[]>(`/events${queryString ? `?${queryString}` : ''}`);
  }

  async createEvent(event: Event): Promise<ApiResponse<Event>> {
    return this.request<Event>('/events', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  }

  async updateEvent(id: number, event: Partial<Event>): Promise<ApiResponse<Event>> {
    return this.request<Event>(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(event),
    });
  }

  async deleteEvent(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/events/${id}`, {
      method: 'DELETE',
    });
  }

  // ICS methods
  async exportICS(options: {
    userId: number;
    startDate: string;
    endDate: string;
    categories?: string[];
  }): Promise<ApiResponse<{ filename: string; download_url: string; event_count: number }>> {
    return this.request('/ics/export', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  async getICSTemplates(type?: string): Promise<ApiResponse<any[]>> {
    const queryString = type ? `?type=${type}` : '';
    return this.request(`/ics/templates${queryString}`);
  }

  // Financial methods
  async getFinancialSummary(userId: number, period: string = 'current_month'): Promise<ApiResponse<any>> {
    return this.request(`/financial/summary?user_id=${userId}&period=${period}`);
  }

  async createTransaction(transaction: any): Promise<ApiResponse<any>> {
    return this.request('/financial/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.request('/health');
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export types
export type {
  ApiResponse,
  DashboardData,
  Event,
  Calendar,
};

// Export utility functions
export const formatEventType = (type: string): string => {
  const types: Record<string, string> = {
    'PLANTAO': 'Plantão',
    'CONSULTA': 'Consulta',
    'PROCEDIMENTO': 'Procedimento',
    'AULA': 'Aula',
    'REUNIAO': 'Reunião',
    'ADMINISTRATIVO': 'Administrativo',
    'PESSOAL': 'Pessoal',
  };
  return types[type] || type;
};

export const formatEventStatus = (status: string): string => {
  const statuses: Record<string, string> = {
    'CONFIRMADO': 'Confirmado',
    'TENTATIVO': 'Tentativo',
    'AGUARDANDO': 'Aguardando',
    'CANCELADO': 'Cancelado',
    'REALIZADO': 'Realizado',
    'NAO_REALIZADO': 'Não Realizado',
  };
  return statuses[status] || status;
};

export const getEventTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    'PLANTAO': 'plantao',
    'CONSULTA': 'consulta',
    'PROCEDIMENTO': 'procedimento',
    'AULA': 'warning',
    'REUNIAO': 'medical',
    'ADMINISTRATIVO': 'muted',
    'PESSOAL': 'accent',
  };
  return colors[type] || 'muted';
};