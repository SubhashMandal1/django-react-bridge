# django-react-bridge

The `django-react-bridge` npm package is a lightweight and flexible API client designed to streamline communication between a React frontend and a Django backend. It simplifies HTTP requests, manages JWT-based authentication, and includes features like caching and automatic retries, making it an ideal tool for integrating React applications with Django RESTful APIs.

This documentation provides a comprehensive guide to installing, configuring, and using the `django-react-bridge` package, along with detailed examples and an API reference.

## Features

- **Simplified HTTP Requests**: Easily perform GET, POST, PUT, PATCH, and DELETE requests to your Django backend.
- **Authentication Management**: Handles JWT-based authentication with automatic token storage and refresh.
- **Caching**: Optional caching for GET requests to enhance performance.
- **Retries**: Automatic retry mechanism for failed requests with configurable options.
- **TypeScript Support**: Fully typed for improved development experience.

## Installation

To install the `django-react-bridge` package, use npm or Yarn:

### Using npm

```bash
npm install django-react-bridge
```

### Using Yarn

```bash
yarn add django-react-bridge
```

## Configuration

The `ApiClient` class is the core of the package and requires a configuration object to connect to your Django backend. Below is an example of how to set it up:

```javascript
import { ApiClient } from 'django-react-bridge'

const apiClient = new ApiClient({
  baseURL: 'https://your-django-api.com/api/', // Your Django API base URL
  authEndpoints: {
    login: '/auth/token/', // Login endpoint
    refresh: '/auth/token/refresh/', // Token refresh endpoint
    register: '/auth/register/', // Registration endpoint
    logout: '/auth/logout/', // Optional logout endpoint
  },
  tokenStorage: 'localStorage', // Storage type: 'localStorage' or 'sessionStorage'
  tokenStorageKey: 'auth_tokens', // Key for storing tokens
  defaultHeaders: { 'Content-Type': 'application/json' }, // Default request headers
  defaultTimeout: 10000, // Timeout in milliseconds
  enableCache: true, // Enable caching for GET requests
  cacheDuration: 5 * 60 * 1000, // Cache duration (5 minutes)
  enableRetry: true, // Enable retries for failed requests
  retryCount: 3, // Number of retry attempts
  retryDelay: 1000, // Initial delay between retries (ms)
  autoRefreshToken: true, // Automatically refresh tokens when expired
  onAuthError: () => {
    console.log('Authentication error occurred')
  },
})
```

## Authentication with AuthService

The `AuthService` class provides methods to manage user authentication.

### Initialize AuthService

```javascript
import { AuthService } from 'django-react-bridge'

const authService = new AuthService(apiClient)
```

### Login

```javascript
async function loginUser(credentials) {
  try {
    const user = await authService.login({ username: 'user', password: 'pass' })
    console.log('Logged in user:', user)
  } catch (error) {
    console.error('Login failed:', error)
  }
}
```

### Register

```javascript
async function registerUser(data) {
  try {
    const user = await authService.register({
      username: 'newuser',
      password: 'pass',
      email: 'user@example.com',
    })
    console.log('Registered user:', user)
  } catch (error) {
    console.error('Registration failed:', error)
  }
}
```

### Logout

```javascript
async function logoutUser() {
  try {
    await authService.logout()
    console.log('Logged out successfully')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}
```

### Check Authentication

```javascript
const isAuthenticated = authService.isAuthenticated()
console.log('Is authenticated:', isAuthenticated)
```

### Get Current User

```javascript
async function getCurrentUser() {
  try {
    const user = await authService.getCurrentUser()
    console.log('Current user:', user)
  } catch (error) {
    console.error('Failed to get current user:', error)
  }
}
```

## Making API Requests with ApiClient

### GET Request

```javascript
async function fetchData() {
  try {
    const data = await apiClient.get('/some-endpoint/', {
      params: { param1: 'value1' },
      cache: true,
      cacheDuration: 10 * 60 * 1000,
    })
    console.log('Data:', data)
  } catch (error) {
    console.error('GET request failed:', error)
  }
}
```

### POST Request

```javascript
async function postData() {
  try {
    const response = await apiClient.post('/some-endpoint/', { key: 'value' })
    console.log('Response:', response)
  } catch (error) {
    console.error('POST request failed:', error)
  }
}
```

### PUT Request

```javascript
async function putData() {
  try {
    const response = await apiClient.put('/some-endpoint/1/', {
      key: 'updatedValue',
    })
    console.log('Response:', response)
  } catch (error) {
    console.error('PUT request failed:', error)
  }
}
```

### PATCH Request

```javascript
async function patchData() {
  try {
    const response = await apiClient.patch('/some-endpoint/1/', {
      key: 'patchedValue',
    })
    console.log('Response:', response)
  } catch (error) {
    console.error('PATCH request failed:', error)
  }
}
```

### DELETE Request

```javascript
async function deleteData() {
  try {
    await apiClient.delete('/some-endpoint/1/')
    console.log('Deleted successfully')
  } catch (error) {
    console.error('DELETE request failed:', error)
  }
}
```

## Additional Notes

- **Token Storage**: Tokens are stored in `localStorage` by default. Use `sessionStorage` for session-based persistence.
- **Automatic Token Refresh**: Enabled by default (`autoRefreshToken: true`). The client refreshes the token when it expires.
- **Caching**: GET requests are cached by default if `enableCache` is `true`. Override per request with the `cache` option.
- **Retries**: Failed requests are retried with exponential backoff up to `retryCount` times if `enableRetry` is `true`.
