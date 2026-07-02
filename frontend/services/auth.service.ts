import { apiClient } from '@/lib/api-client';
import { 
  AuthResponse, 
  LoginCredentials, 
  SignupCredentials, 
  User,
  GoogleAuthPayload,
} from '@/types/freelance';

class AuthService {
  private tokenKey = 'auth_token';
  private refreshTokenKey = 'refresh_token';
  private userKey = 'user_data';

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/v1/auth/login', credentials);
    this.setSession(response);
    return response;
  }

  async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/v1/auth/register', credentials);
    this.setSession(response);
    return response;
  }

  async googleLogin(payload: GoogleAuthPayload): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/v1/auth/google', payload);
    this.setSession(response);
    return response;
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/v1/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearSession();
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = localStorage.getItem(this.refreshTokenKey);
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<AuthResponse>('/api/v1/auth/refresh', { refreshToken });
    this.setSession(response);
    return response;
  }

  async getCurrentUser(): Promise<User> {
    try {
      const user = localStorage.getItem(this.userKey);
      if (user) {
        return JSON.parse(user);
      }
      
      const response = await apiClient.get<User>('/api/v1/users/me');
      localStorage.setItem(this.userKey, JSON.stringify(response));
      return response;
    } catch (error) {
      console.error('Failed to get current user:', error);
      throw error;
    }
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.put<User>('/api/v1/users/me', data);
    localStorage.setItem(this.userKey, JSON.stringify(response));
    return response;
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/api/v1/auth/change-password', { oldPassword, newPassword });
  }

  private setSession(authData: AuthResponse): void {
    localStorage.setItem(this.tokenKey, authData.token);
    if (authData.refreshToken) {
      localStorage.setItem(this.refreshTokenKey, authData.refreshToken);
    }
    localStorage.setItem(this.userKey, JSON.stringify(authData.user));
  }

  private clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getUser(): User | null {
    const user = localStorage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
  }
}

export const authService = new AuthService();