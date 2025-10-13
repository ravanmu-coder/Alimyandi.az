// API Configuration for Admin Panel
// These can be modified in the UI for testing

export interface ApiConfig {
  baseApiUrl: string
  authToken: string
  imageBaseUrl?: string
}

// Default configuration
export const defaultApiConfig: ApiConfig = {
  baseApiUrl: 'https://localhost:7249',
  authToken: '',
  imageBaseUrl: 'https://localhost:7249'
}

// Configuration storage
class ConfigManager {
  private config: ApiConfig

  constructor() {
    this.config = this.loadConfig()
  }

  private loadConfig(): ApiConfig {
    const saved = localStorage.getItem('adminApiConfig')
    if (saved) {
      try {
        return { ...defaultApiConfig, ...JSON.parse(saved) }
      } catch {
        return defaultApiConfig
      }
    }
    return defaultApiConfig
  }

  getConfig(): ApiConfig {
    return { ...this.config }
  }

  updateConfig(newConfig: Partial<ApiConfig>): void {
    this.config = { ...this.config, ...newConfig }
    localStorage.setItem('adminApiConfig', JSON.stringify(this.config))
  }

  getBaseUrl(): string {
    return this.config.baseApiUrl
  }

  getAuthToken(): string {
    return this.config.authToken
  }

  getImageBaseUrl(): string {
    return this.config.imageBaseUrl || this.config.baseApiUrl
  }
}

export const configManager = new ConfigManager()
