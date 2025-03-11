import { AxiosRequestConfig } from 'axios'

export interface AuthTokens {
  access: string
  refresh: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
  password2?: string
  first_name?: string
  last_name?: string
}

export interface User {
  id: number
  username: string
  email: string
  first_name?: string
  last_name?: string
}

export interface ApiClientConfig {
  baseURL: string
  authEndpoints?: {
    login: string
    refresh: string
    register?: string
    logout?: string
  }
  tokenStorage?: 'localStorage' | 'sessionStorage' | 'memory'
  tokenStorageKey?: string
  defaultHeaders?: Record<string, string>
  defaultTimeout?: number
  enableCache?: boolean
  cacheDuration?: number
  enableRetry?: boolean
  retryCount?: number
  retryDelay?: number
  autoRefreshToken?: boolean
  onAuthError?: () => void
}

export interface RequestOptions extends AxiosRequestConfig {
  cache?: boolean
  cacheDuration?: number
  retry?: boolean
  retryCount?: number
  retryDelay?: number
}
