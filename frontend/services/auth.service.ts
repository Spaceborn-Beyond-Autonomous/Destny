import { apiClient } from '@/lib/api-client';
import type { AuthResponse, LoginCredentials, SignupCredentials, User } from '@/types/freelance';

class AuthService {
  private userKey = 'user_data';

  private emitAuthChange(): void {
    window.dispatchEvent(new Event('auth:changed'));
  }

  private cacheUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.emitAuthChange();
  }

  private getFriendlyError(error: any): Error {
    if (error?.code === 'ERR_NETWORK' || !error?.response) {
      return new Error('Cannot reach the Destny backend. Start the backend server and try again.');
    }

    return error;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Backend sets httpOnly cookies; localStorage only mirrors basic user state for UI.
      const response = await apiClient.post<AuthResponse>('/api/v1/users/loginUser', credentials);
      const me = response.user || await this.getCurrentUser(true);
      this.cacheUser(me);
      return { ...response, user: me };
    } catch (error) {
      throw this.getFriendlyError(error);
    }
  }


  async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/api/v1/users/register', credentials);
      const me = response.user || await this.getCurrentUser(true);
      this.cacheUser(me);
      return { ...response, user: me };
    } catch (error) {
      throw this.getFriendlyError(error);
    }
  }


  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/v1/users/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearSession();
    }
  }

  // Note: backend refresh endpoint might differ across builds; keep method for compatibility.
  async refreshToken(): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/v1/users/refresh-token', {} as any);
    const me = await this.getCurrentUser(true);
    return { ...response, user: me };
  }


  async getCurrentUser(forceRefresh = false): Promise<User> {
    try {
      const user = localStorage.getItem(this.userKey);
      if (user && !forceRefresh) {
        return JSON.parse(user);
      }
      
      const response = await apiClient.get<User>('/api/v1/users/current-user');
      this.cacheUser(response);
      return response;
    } catch (error) {
      console.error('Failed to get current user:', error);
      this.clearSession();
      throw this.getFriendlyError(error);
    }
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.put<User>('/api/v1/users/current-user', data);
    this.cacheUser(response);
    return response;
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/api/v1/users/change-password', { oldPassword, newPassword });
  }

  public clearSession(): void {
    localStorage.removeItem(this.userKey);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    this.emitAuthChange();
  }

  isAuthenticated(): boolean {
    // We rely on cached session data and cookie auth.
    return !!this.getUser();
  }


  getUser(): User | null {
    const user = localStorage.getItem(this.userKey);
    if (!user) return null;

    try {
      return JSON.parse(user);
    } catch {
      this.clearSession();
      return null;
    }
  }
}

export const authService = new AuthService();
