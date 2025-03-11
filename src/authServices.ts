import ApiClient from './apiClient'
import { LoginCredentials, RegisterData, User, AuthTokens } from './types'

class AuthService {
  protected apiClient: ApiClient

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient
  }

  public async login(credentials: LoginCredentials): Promise<User> {
    try {
      const response = await this.apiClient.post<AuthTokens & { user?: User }>(
        this.apiClient.config.authEndpoints!.login,
        credentials
      )
      this.apiClient.storeTokens({
        access: response.access,
        refresh: response.refresh,
      })
      return response.user || this.getCurrentUser()
    } catch (error) {
      throw error
    }
  }

  public async register(data: RegisterData): Promise<User> {
    try {
      const response = await this.apiClient.post<{
        user: User
        tokens: AuthTokens
      }>(this.apiClient.config.authEndpoints!.register!, data)
      this.apiClient.storeTokens(response.tokens)
      return response.user
    } catch (error) {
      throw error
    }
  }

  public async logout(): Promise<void> {
    const tokens = this.apiClient.getTokens()
    if (tokens?.refresh && this.apiClient.config.authEndpoints?.logout) {
      try {
        await this.apiClient.post(this.apiClient.config.authEndpoints.logout, {
          refresh: tokens.refresh,
        })
      } catch (e) {
        // Ignore errors on logout
      }
    }
    this.apiClient.clearTokens()
  }

  public isAuthenticated(): boolean {
    return this.apiClient.isAccessTokenValid()
  }

  public async getCurrentUser(): Promise<User> {
    return this.apiClient.get<User>('/auth/user/')
  }
}

export default AuthService
