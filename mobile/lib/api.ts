/**
 * API Client for Coastal AI Mobile App
 * Handles all communication with the backend (port 8000)
 */

export interface ApiError {
  status: number;
  message: string;
  detail?: string;
}

export interface CallStats {
  total_calls: number;
  escalated: number;
  appointments_booked: number;
}

export interface CallRecord {
  id: string;
  caller_number: string;
  duration_sec?: number | null;
  intent?: string | null;
  escalated: boolean;
  escalation_reason?: string | null;
  agent_response?: string | null;
  timestamp: string;
  summary?: string | null;
}

export interface AppointmentRecord {
  id: string;
  patient_name: string;
  phone: string;
  appointment_datetime: string;
  notes?: string | null;
}

class ApiClient {
  private baseUrl: string = 'http://localhost:8000';

  constructor(baseUrl?: string) {
    if (baseUrl) this.baseUrl = baseUrl;
  }

  setBaseUrl(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, { ...options, headers });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw {
          status: response.status,
          message: error.detail || response.statusText,
          detail: error,
        } as ApiError;
      }
      return await response.json();
    } catch (error) {
      if (error instanceof TypeError) {
        throw {
          status: 0,
          message: 'Network error. Is the backend running?',
          detail: error.message,
        } as ApiError;
      }
      throw error;
    }
  }

  // ─── BUSINESSES ─────────────────────────────────────────────

  async signupBusiness(payload: {
    owner_id: string;
    name: string;
    vertical: string;
    onboarding_config: Record<string, any>;
  }) {
    return this.request('/api/businesses/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getBusiness(businessId: string) {
    return this.request(`/api/businesses/${businessId}`);
  }

  async listBusinesses(ownerId: string) {
    return this.request(`/api/businesses?owner_id=${ownerId}`);
  }

  async getBusinessConfig(businessId: string) {
    return this.request(`/api/businesses/${businessId}/config`);
  }

  // ─── CALLS ──────────────────────────────────────────────────

  async listCalls(businessId: string, limit = 50, offset = 0): Promise<CallRecord[]> {
    const url = `/api/calls/${businessId}?limit=${limit}&offset=${offset}`;
    return this.request(url);
  }

  async getCall(callId: string): Promise<CallRecord> {
    return this.request(`/api/calls/detail/${callId}`);
  }

  async getCallStats(businessId: string): Promise<CallStats> {
    return this.request(`/api/calls/${businessId}/stats`);
  }

  // ─── APPOINTMENTS ───────────────────────────────────────────

  async listAppointments(businessId: string): Promise<AppointmentRecord[]> {
    return this.request(`/api/appointments/${businessId}`);
  }

  async createAppointment(
    businessId: string,
    payload: {
      patient_name: string;
      phone: string;
      appointment_datetime?: string;
      datetime?: string;
      notes?: string;
      created_from_call_id?: string;
    }
  ) {
    return this.request(`/api/appointments/${businessId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // ─── HEALTH CHECK ───────────────────────────────────────────

  async healthCheck() {
    return this.request('/health');
  }

  // ─── PUSH NOTIFICATIONS ─────────────────────────────────────

  /**
   * Register push token with backend so it can send escalation alerts
   */
  async registerPushToken(businessId: string, token: string) {
    return this.request(`/api/businesses/${businessId}/push-token`, {
      method: 'PUT',
      body: JSON.stringify({ expo_push_token: token }),
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
