import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { jwtDecode } from 'jwt-decode'
import { ApiClientConfig, AuthTokens, RequestOptions } from './types'

interface Storage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
  data?: Record<string, string> // Make data optional for browser storage compatibility
}

class ApiClient {
  private instance: AxiosInstance
  public config: ApiClientConfig // need to solve this make it protected or private kind of
  private storage: Storage
  private cache: Record<string, { data: any; expiry: number }> = {}

  constructor(config: ApiClientConfig) {
    const defaultConfig: Partial<ApiClientConfig> = {
      authEndpoints: {
        login: '/auth/token/',
        refresh: '/auth/token/refresh/',
        register: '/auth/register/',
      },
      tokenStorage: 'localStorage',
      tokenStorageKey: 'auth_tokens',
      defaultHeaders: { 'Content-Type': 'application/json' },
      defaultTimeout: 10000,
      enableCache: true,
      cacheDuration: 5 * 60 * 1000, // 5 minutes
      enableRetry: true,
      retryCount: 3,
      retryDelay: 1000,
      autoRefreshToken: true,
    }

    this.config = { ...defaultConfig, ...config }

    // Initialize storage based on config
    if (
      this.config.tokenStorage === 'localStorage' &&
      typeof window !== 'undefined'
    ) {
      this.storage = window.localStorage
    } else if (
      this.config.tokenStorage === 'sessionStorage' &&
      typeof window !== 'undefined'
    ) {
      this.storage = window.sessionStorage
    } else {
      this.storage = {
        data: {} as Record<string, string>,
        getItem: function (key: string) {
          return this.data![key] || null
        },
        setItem: function (key: string, value: string) {
          this.data![key] = value
        },
        removeItem: function (key: string) {
          delete this.data![key]
        },
      }
    }

    this.instance = axios.create({
      baseURL: this.config.baseURL,
      headers: this.config.defaultHeaders,
      timeout: this.config.defaultTimeout,
    })

    // Request interceptor to add auth token
    this.instance.interceptors.request.use(
      config => {
        const tokens = this.getTokens()
        if (tokens?.access) {
          config.headers.Authorization = `Bearer ${tokens.access}`
        }
        return config
      },
      error => Promise.reject(error)
    )

    // Response interceptor to handle token refresh
    this.instance.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true
          try {
            const refreshed = await this.refreshToken()
            if (refreshed) {
              const tokens = this.getTokens()
              originalRequest.headers.Authorization = `Bearer ${tokens?.access}`
              return this.instance(originalRequest)
            }
          } catch (refreshError) {
            this.clearTokens()
            if (this.config.onAuthError) this.config.onAuthError()
          }
        }
        return Promise.reject(error)
      }
    )
  }

  // Token management
  public storeTokens(tokens: AuthTokens): void {
    this.storage.setItem(this.config.tokenStorageKey!, JSON.stringify(tokens))
  }

  public getTokens(): AuthTokens | null {
    const tokensString = this.storage.getItem(this.config.tokenStorageKey!)
    return tokensString ? JSON.parse(tokensString) : null
  }

  public clearTokens(): void {
    this.storage.removeItem(this.config.tokenStorageKey!)
  }

  public async refreshToken(): Promise<boolean> {
    const tokens = this.getTokens()
    if (!tokens?.refresh) return false
    try {
      const response = await axios.post(
        `${this.config.baseURL}${this.config.authEndpoints!.refresh}`,
        { refresh: tokens.refresh }
      )
      this.storeTokens({ ...tokens, access: response.data.access })
      return true
    } catch (error) {
      this.clearTokens()
      return false
    }
  }

  // Check if access token is valid
  public isAccessTokenValid(): boolean {
    const tokens = this.getTokens()
    if (!tokens?.access) return false
    try {
      const decoded: any = jwtDecode(tokens.access)
      const currentTime = Date.now() / 1000
      return decoded.exp >= currentTime
    } catch (e) {
      return false
    }
  }

  // Retry helper
  private async withRetry<T>(
    requestFn: () => Promise<T>,
    retryCount: number,
    retryDelay: number
  ): Promise<T> {
    try {
      return await requestFn()
    } catch (error) {
      if (retryCount <= 0) throw error
      await new Promise(resolve => setTimeout(resolve, retryDelay))
      return this.withRetry(requestFn, retryCount - 1, retryDelay * 2)
    }
  }

  // Generic request method
  public async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.instance(config)
      return response.data
    } catch (error) {
      throw error
    }
  }

  // GET request with caching and retries
  public async get<T>(url: string, options?: RequestOptions): Promise<T> {
    const {
      cache,
      cacheDuration,
      retry,
      retryCount,
      retryDelay,
      ...axiosConfig
    } = options || {}
    const useCache = cache !== undefined ? cache : this.config.enableCache
    const cacheTime =
      cacheDuration || this.config.cacheDuration || 5 * 60 * 1000
    const shouldRetry = retry !== undefined ? retry : this.config.enableRetry
    const maxRetries = retryCount || this.config.retryCount || 3
    const delay = retryDelay || this.config.retryDelay || 1000
    const cacheKey = `${url}${JSON.stringify(axiosConfig.params || {})}`

    if (
      useCache &&
      this.cache[cacheKey] &&
      this.cache[cacheKey].expiry > Date.now()
    ) {
      return this.cache[cacheKey].data
    }

    const requestFn = () =>
      this.request<T>({ ...axiosConfig, method: 'get', url })
    const result = shouldRetry
      ? await this.withRetry(requestFn, maxRetries, delay)
      : await requestFn()

    if (useCache) {
      this.cache[cacheKey] = { data: result, expiry: Date.now() + cacheTime }
    }
    return result
  }

  // POST request with retries
  public async post<T>(
    url: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    const { retry, retryCount, retryDelay, ...axiosConfig } = options || {}
    const shouldRetry = retry !== undefined ? retry : this.config.enableRetry
    const maxRetries = retryCount || this.config.retryCount || 3
    const delay = retryDelay || this.config.retryDelay || 1000
    const requestFn = () =>
      this.request<T>({ ...axiosConfig, method: 'post', url, data })
    return shouldRetry
      ? await this.withRetry(requestFn, maxRetries, delay)
      : await requestFn()
  }

  // PUT request with retries
  public async put<T>(
    url: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    const { retry, retryCount, retryDelay, ...axiosConfig } = options || {}
    const shouldRetry = retry !== undefined ? retry : this.config.enableRetry
    const maxRetries = retryCount || this.config.retryCount || 3
    const delay = retryDelay || this.config.retryDelay || 1000
    const requestFn = () =>
      this.request<T>({ ...axiosConfig, method: 'put', url, data })
    return shouldRetry
      ? await this.withRetry(requestFn, maxRetries, delay)
      : await requestFn()
  }

  // PATCH request with retries
  public async patch<T>(
    url: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    const { retry, retryCount, retryDelay, ...axiosConfig } = options || {}
    const shouldRetry = retry !== undefined ? retry : this.config.enableRetry
    const maxRetries = retryCount || this.config.retryCount || 3
    const delay = retryDelay || this.config.retryDelay || 1000
    const requestFn = () =>
      this.request<T>({ ...axiosConfig, method: 'patch', url, data })
    return shouldRetry
      ? await this.withRetry(requestFn, maxRetries, delay)
      : await requestFn()
  }

  // DELETE request with retries
  public async delete<T>(url: string, options?: RequestOptions): Promise<T> {
    const { retry, retryCount, retryDelay, ...axiosConfig } = options || {}
    const shouldRetry = retry !== undefined ? retry : this.config.enableRetry
    const maxRetries = retryCount || this.config.retryCount || 3
    const delay = retryDelay || this.config.retryDelay || 1000
    const requestFn = () =>
      this.request<T>({ ...axiosConfig, method: 'delete', url })
    return shouldRetry
      ? await this.withRetry(requestFn, maxRetries, delay)
      : await requestFn()
  }
}

export default ApiClient
