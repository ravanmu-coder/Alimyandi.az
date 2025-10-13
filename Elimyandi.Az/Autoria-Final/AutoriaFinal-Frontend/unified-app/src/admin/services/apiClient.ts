// API Client for Əlimyandi.az Admin Panel
// Real API integration with backend

import { configManager } from '../config/apiConfig'

interface ApiResponse<T> {
  data: T | null
  error?: string
  message?: string
}

interface PagedResponse<T> {
  items: T[]
  totalItems: number
  totalPages: number
  currentPage: number
  pageSize: number
}

class ApiClient {
  private get baseURL(): string {
    return configManager.getBaseUrl()
  }

  private get token(): string {
    // First try to get token from localStorage, then from configManager
    const localToken = localStorage.getItem('authToken') || localStorage.getItem('auth_token')
    const configToken = configManager.getAuthToken()
    return localToken || configToken || ''
  }

  private get imageBaseURL(): string {
    return configManager.getImageBaseUrl()
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    const token = this.token
    console.log('Current token:', token ? `${token.substring(0, 10)}...` : 'No token')
    
    if (token) {
      headers.Authorization = `Bearer ${token}`
      console.log('Authorization header set:', `Bearer ${token.substring(0, 10)}...`)
    } else {
      console.warn('No authentication token available')
    }

    return headers
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
      mode: 'cors',
      credentials: 'include',
    }

    try {
      console.log(`Admin API request to: ${url}`)
      const response = await fetch(url, config)
      console.log(`Admin API response status: ${response.status}`)

      if (response.status === 401) {
        console.log('Authentication error - clearing token')
        this.clearToken()
        localStorage.removeItem('auth_token')
        localStorage.removeItem('authToken')
        throw new Error('Authentication failed. Please log in again.')
      }

      if (response.status === 403) {
        throw new Error('Access denied. You do not have permission to access this resource.')
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Admin API Error: ${response.status} - ${errorText}`)
        
        // Try to parse JSON error response
        try {
          const errorJson = JSON.parse(errorText)
          // Extract the detail message if available
          const errorMessage = errorJson.detail || errorJson.message || errorJson.title || errorText
          throw new Error(errorMessage)
        } catch (parseError) {
          // If parsing fails, use the raw error text
          throw new Error(errorText)
        }
      }

      const contentType = response.headers.get('Content-Type')
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json()
        console.log(`Admin API response data:`, data)
        return data
      }
      
      const textData = await response.text()
      console.log(`Admin API response text:`, textData)
      return textData as unknown as T
    } catch (error) {
      console.error(`Admin API request failed:`, error)
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error(`Network Error: Unable to connect to API server at ${this.baseURL}. Please check if the backend server is running and CORS is configured.`)
      }
      throw error
    }
  }

  setToken(token: string): void {
    console.log('Setting token:', token ? `${token.substring(0, 10)}...` : 'No token')
    configManager.updateConfig({ authToken: token })
    localStorage.setItem('authToken', token)
    localStorage.setItem('auth_token', token) // Also set the alternative key
  }

  clearToken(): void {
    console.log('Clearing token')
    configManager.updateConfig({ authToken: '' })
    localStorage.removeItem('authToken')
    localStorage.removeItem('auth_token')
  }

  // Login method to get authentication token
  async login(email: string, password: string): Promise<{ token: string; user: any }> {
    try {
      console.log('Attempting login with email:', email)
      
      const response = await fetch(`${this.baseURL}/api/Auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        mode: 'cors',
        credentials: 'include',
      })

      console.log('Login response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Login failed:', response.status, errorText)
        throw new Error(`Login failed: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      console.log('Login successful, received data:', data)

      // Extract token from response
      const token = data.token || data.accessToken || data.access_token
      if (!token) {
        console.error('No token found in login response:', data)
        throw new Error('No authentication token received')
      }

      // Store token
      this.setToken(token)
      
      return {
        token,
        user: data.user || data
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  // private async request<T>(
  //   endpoint: string,
  //   _options: RequestInit = {}
  // ): Promise<ApiResponse<T>> {
  //   try {
  //     const url = `${this.baseUrl}${endpoint}`
  //     const response = await fetch(url, {
  //       headers: {
  //         'Content-Type': 'application/json',
  //         ..._options.headers,
  //       },
  //       ..._options,
  //     })

  //     if (!response.ok) {
  //       throw new Error(`HTTP error! status: ${response.status}`)
  //     }

  //     const data = await response.json()
  //     return { data }
  //   } catch (error) {
  //     return {
  //       data: null,
  //       error: error instanceof Error ? error.message : 'Unknown error',
  //     }
  //   }
  // }


  async logout() {
    try {
      const result = await this.request<any>('/api/Auth/logout', {
        method: 'POST',
      })
      return result
    } finally {
      this.clearToken()
    }
  }

  async refreshToken() {
    return this.request<any>('/api/Auth/refresh', {
      method: 'POST',
    })
  }

  // Dashboard
  async getStatsOverview() {
    try {
      // Get stats from multiple endpoints
      const [auctions, cars, users] = await Promise.all([
        this.request<any[]>('/api/Auction'),
        this.request<any[]>('/api/Car'),
        this.request<any[]>('/api/Auth/users') // Assuming this endpoint exists
      ])

      return {
        totalRevenue: this.calculateTotalRevenue(auctions),
        activeAuctions: auctions.filter(a => a.status === 'Live').length,
        totalVehicles: cars.length,
        registeredUsers: users.length
      }
    } catch (error) {
      console.error('Error getting stats overview:', error)
      throw error
    }
  }

  // New dashboard stats endpoint
  async getDashboardStats() {
    try {
      return this.request<any>('/api/auction/dashboard-stats')
    } catch (error) {
      console.error('Error getting dashboard stats:', error)
      throw error
    }
  }

  // Scheduler debug endpoints
  async getSchedulerDebug() {
    try {
      return this.request<any>('/api/auction/scheduler-debug')
    } catch (error) {
      console.error('Error getting scheduler debug:', error)
      throw error
    }
  }

  async forceSchedulerRun() {
    try {
      return this.request<any>('/api/auction/force-scheduler-run', {
        method: 'POST'
      })
    } catch (error) {
      console.error('Error forcing scheduler run:', error)
      throw error
    }
  }

  async getRecentActivity() {
    try {
      // Get recent activity from auctions and bids
      const [auctions, bids] = await Promise.all([
        this.request<any[]>('/api/Auction'),
        this.request<any[]>('/api/Bid/recent') // Assuming this endpoint exists
      ])

      const activities: any[] = []
      
      // Add auction activities
      auctions.slice(0, 5).forEach(auction => {
        activities.push({
          id: `auction-${auction.id}`,
          type: 'auction',
          message: `New auction created: ${auction.name}`,
          timestamp: auction.createdAt || auction.startTimeUtc,
          icon: 'Gavel'
        })
      })

      // Add bid activities
      bids.slice(0, 5).forEach(bid => {
        activities.push({
          id: `bid-${bid.id}`,
          type: 'bid',
          message: `New bid placed: $${bid.amount}`,
          timestamp: bid.createdAt,
          icon: 'TrendingUp'
        })
      })

      return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10)
    } catch (error) {
      console.error('Error getting recent activity:', error)
      return []
    }
  }

  async getUpcomingAuctions() {
    try {
      const auctions = await this.request<any[]>('/api/Auction')
      const now = new Date()
      
      return auctions
        .filter(auction => {
          const startTime = new Date(auction.startTimeUtc)
          return startTime > now && auction.status !== 'Live'
        })
        .slice(0, 5)
        .map(auction => ({
          id: auction.id,
          name: auction.name,
          startTime: auction.startTimeUtc,
          vehicleCount: auction.totalCarsCount || 0,
          location: auction.location?.name || 'TBD'
        }))
    } catch (error) {
      console.error('Error getting upcoming auctions:', error)
      return []
    }
  }

  private calculateTotalRevenue(auctions: any[]): number {
    return auctions.reduce((total, auction) => {
      return total + (auction.totalRevenue || 0)
    }, 0)
  }

  // Auctions - Complete CRUD and lifecycle management
  async getAuctions(params?: {
    page?: number
    limit?: number
    status?: string
    search?: string
    region?: string
    dateFrom?: string
    dateTo?: string
  }) {
    try {
      let endpoint = '/api/auction'
      const queryParams = new URLSearchParams()
      
      if (params?.status) queryParams.append('status', params.status)
      if (params?.search) queryParams.append('search', params.search)
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom)
      if (params?.dateTo) queryParams.append('dateTo', params.dateTo)
      
      if (queryParams.toString()) {
        endpoint += `?${queryParams.toString()}`
      }
      
      return this.request<any[]>(endpoint)
    } catch (error) {
      console.error('Error getting auctions:', error)
      throw error
    }
  }

  async getAuctionById(id: string) {
    try {
      return this.request<any>(`/api/auction/${id}`)
    } catch (error) {
      console.error('Error getting auction by ID:', error)
      throw error
    }
  }

  async createAuction(data: any) {
    try {
      return this.request<any>('/api/auction', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    } catch (error) {
      console.error('Error creating auction:', error)
      throw error
    }
  }

  async updateAuction(id: string, data: any) {
    try {
      return this.request<any>(`/api/auction/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    } catch (error) {
      console.error('Error updating auction:', error)
      throw error
    }
  }

  async deleteAuction(id: string) {
    try {
      return this.request<void>(`/api/auction/${id}`, {
        method: 'DELETE',
      })
    } catch (error) {
      console.error('Error deleting auction:', error)
      throw error
    }
  }

  // Auction lifecycle controls
  async startAuction(id: string) {
    try {
      return this.request<any>(`/api/auction/${id}/start`, {
        method: 'POST',
      })
    } catch (error) {
      console.error('Error starting auction:', error)
      throw error
    }
  }

  async endAuction(id: string) {
    try {
      return this.request<any>(`/api/auction/${id}/end`, {
        method: 'POST',
      })
    } catch (error) {
      console.error('Error ending auction:', error)
      throw error
    }
  }

  async cancelAuction(id: string, reason: string) {
    try {
      return this.request<any>(`/api/auction/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      })
    } catch (error) {
      console.error('Error cancelling auction:', error)
      throw error
    }
  }

  async extendAuction(id: string, minutes: number, reason: string) {
    try {
      return this.request<any>(`/api/auction/${id}/extend`, {
        method: 'POST',
        body: JSON.stringify({ minutes, reason }),
      })
    } catch (error) {
      console.error('Error extending auction:', error)
      throw error
    }
  }

  async moveToNextCar(id: string) {
    try {
      return this.request<any>(`/api/auction/${id}/next-car`, {
        method: 'POST',
      })
    } catch (error) {
      console.error('Error moving to next car:', error)
      throw error
    }
  }

  // New auction lifecycle methods
  async makeAuctionReady(id: string) {
    try {
      return this.request<any>(`/api/auction/${id}/make-ready`, {
        method: 'POST',
      })
    } catch (error) {
      console.error('Error making auction ready:', error)
      throw error
    }
  }

  async setCurrentCar(id: string, lotNumber: string) {
    try {
      return this.request<any>(`/api/auction/${id}/set-current-car`, {
        method: 'POST',
        body: JSON.stringify({ lotNumber }),
      })
    } catch (error) {
      console.error('Error setting current car:', error)
      throw error
    }
  }

  async getAuctionTimer(id: string) {
    try {
      return this.request<any>(`/api/auction/${id}/timer`)
    } catch (error) {
      console.error('Error getting auction timer:', error)
      throw error
    }
  }

  // AuctionCar management
  async getAuctionCars(params?: {
    page?: number
    limit?: number
    auctionId?: string
    status?: string
  }) {
    try {
      let endpoint = '/api/auctioncar'
      const queryParams = new URLSearchParams()
      
      if (params?.auctionId) queryParams.append('auctionId', params.auctionId)
      if (params?.status) queryParams.append('status', params.status)
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      
      if (queryParams.toString()) {
        endpoint += `?${queryParams.toString()}`
      }
      
      return this.request<any[]>(endpoint)
    } catch (error) {
      console.error('Error getting auction cars:', error)
      throw error
    }
  }

  async getAuctionCarById(id: string) {
    try {
      return this.request<any>(`/api/auctioncar/${id}`)
    } catch (error) {
      console.error('Error getting auction car by ID:', error)
      throw error
    }
  }

  async getAuctionCarsByAuction(auctionId: string) {
    try {
      return this.request<any[]>(`/api/auctioncar/auction/${auctionId}`)
    } catch (error) {
      console.error('Error getting auction cars by auction:', error)
      throw error
    }
  }

  async getReadyCarsForAuction(auctionId: string) {
    try {
      return this.request<any[]>(`/api/auctioncar/auction/${auctionId}/ready`)
    } catch (error) {
      console.error('Error getting ready cars for auction:', error)
      throw error
    }
  }

  async getCarByLotNumber(lotNumber: string) {
    try {
      return this.request<any>(`/api/auctioncar/lot/${lotNumber}`)
    } catch (error) {
      console.error('Error getting car by lot number:', error)
      throw error
    }
  }

  async createAuctionCar(data: any) {
    try {
      console.log('Creating auction car with data:', data)
      const result = await this.request<any>('/api/auctioncar', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      console.log('Auction car created successfully:', result)
      return result
    } catch (error) {
      console.error('Error creating auction car:', error)
      throw error
    }
  }

  async addCarsToAuction(_auctionId: string, cars: any[]) {
    try {
      // Use individual POST /api/auctioncar calls since batch endpoint doesn't exist
      const promises = cars.map(carData => 
        this.request<any>(`/api/auctioncar`, {
          method: 'POST',
          body: JSON.stringify(carData),
        })
      )
      return Promise.all(promises)
    } catch (error) {
      console.error('Error adding cars to auction:', error)
      throw error
    }
  }

  async updateAuctionCar(id: string, data: any) {
    try {
      return this.request<any>(`/api/auctioncar/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    } catch (error) {
      console.error('Error updating auction car:', error)
      throw error
    }
  }

  async deleteAuctionCar(id: string) {
    try {
      return this.request<void>(`/api/auctioncar/${id}`, {
        method: 'DELETE',
      })
    } catch (error) {
      console.error('Error deleting auction car:', error)
      throw error
    }
  }

  // AuctionCar lifecycle controls
  async prepareAuctionCar(id: string) {
    try {
      return this.request<any>(`/api/auctioncar/${id}/prepare`, {
        method: 'POST',
      })
    } catch (error) {
      console.error('Error preparing auction car:', error)
      throw error
    }
  }

  async activateAuctionCar(id: string) {
    try {
      return this.request<any>(`/api/auctioncar/${id}/activate`, {
        method: 'POST',
      })
    } catch (error) {
      console.error('Error activating auction car:', error)
      throw error
    }
  }

  async endAuctionCar(id: string) {
    try {
      return this.request<any>(`/api/auctioncar/${id}/end`, {
        method: 'POST',
      })
    } catch (error) {
      console.error('Error ending auction car:', error)
      throw error
    }
  }

  async markAuctionCarUnsold(id: string, reason: string) {
    try {
      return this.request<any>(`/api/auctioncar/${id}/mark-unsold`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      })
    } catch (error) {
      console.error('Error marking auction car unsold:', error)
      throw error
    }
  }

  async updateAuctionCarPrice(id: string, newPrice: number) {
    try {
      return this.request<any>(`/api/auctioncar/${id}/price`, {
        method: 'PUT',
        body: JSON.stringify({ newPrice }),
      })
    } catch (error) {
      console.error('Error updating auction car price:', error)
      throw error
    }
  }

  async setHammerPrice(id: string, hammerPrice: number) {
    try {
      return this.request<any>(`/api/auctioncar/${id}/hammer`, {
        method: 'POST',
        body: JSON.stringify({ hammerPrice }),
      })
    } catch (error) {
      console.error('Error setting hammer price:', error)
      throw error
    }
  }

  async getAuctionCarTimer(id: string) {
    try {
      return this.request<any>(`/api/auctioncar/${id}/timer`)
    } catch (error) {
      console.error('Error getting auction car timer:', error)
      throw error
    }
  }

  async getAuctionCarPreBids(id: string) {
    try {
      return this.request<any[]>(`/api/auctioncar/${id}/pre-bids`)
    } catch (error) {
      console.error('Error getting auction car pre-bids:', error)
      throw error
    }
  }

  async getAuctionCarHighestBid(id: string) {
    try {
      return this.request<any>(`/api/auctioncar/${id}/pre-bids/highest`)
    } catch (error) {
      console.error('Error getting auction car highest bid:', error)
      throw error
    }
  }

  async getAuctionCarStats(id: string) {
    try {
      return this.request<any>(`/api/auctioncar/${id}/stats`)
    } catch (error) {
      console.error('Error getting auction car stats:', error)
      throw error
    }
  }

  async checkReserveMet(id: string) {
    try {
      return this.request<any>(`/api/auctioncar/${id}/reserve-met`)
    } catch (error) {
      console.error('Error checking reserve met:', error)
      throw error
    }
  }

  // Inventory / Cars - Use GET /api/Car with pagination and filters
  async getVehicles(params?: {
    page?: number
    pageSize?: number
    view?: 'grid' | 'table'
    search?: string
    yearFrom?: number
    yearTo?: number
    locationId?: string
    ownerId?: string
    sortBy?: string
    sortDir?: 'asc' | 'desc'
  }): Promise<PagedResponse<any>> {
    try {
      // First try to get all cars from the simple endpoint
      console.log('Fetching cars from /api/Car endpoint...')
      const rawResponse = await this.request<any>('/api/Car')
      console.log('Raw API response:', rawResponse)
      
      // Handle different response formats
      let allCars: any[] = []
      
      if (Array.isArray(rawResponse)) {
        // Direct array response
        allCars = rawResponse
      } else if (rawResponse && Array.isArray(rawResponse.data)) {
        // Wrapped in data property
        allCars = rawResponse.data
      } else if (rawResponse && Array.isArray(rawResponse.items)) {
        // Wrapped in items property
        allCars = rawResponse.items
      } else if (rawResponse && rawResponse.cars && Array.isArray(rawResponse.cars)) {
        // Wrapped in cars property
        allCars = rawResponse.cars
      } else {
        console.error('Unexpected API response format:', rawResponse)
        allCars = []
      }
      
      console.log('Processed cars array:', allCars)
      console.log('Number of cars received:', allCars.length)
      
      // Log first car for debugging
      if (allCars.length > 0) {
        console.log('First car data:', allCars[0])
        console.log('First car keys:', Object.keys(allCars[0]))
      }
      
      // If still no cars, return empty result
      if (!Array.isArray(allCars) || allCars.length === 0) {
        console.warn('No cars found in API response')
        return {
          items: [],
          totalItems: 0,
          totalPages: 0,
          currentPage: params?.page || 1,
          pageSize: params?.pageSize || 12
        }
      }
      
      // Apply client-side filtering and pagination
      let filteredCars = allCars
      
      // Apply search filter
      if (params?.search) {
        const searchLower = params.search.toLowerCase()
        filteredCars = filteredCars.filter(car => 
          car.make?.toLowerCase().includes(searchLower) ||
          car.model?.toLowerCase().includes(searchLower) ||
          car.vin?.toLowerCase().includes(searchLower)
        )
      }
      
      // Apply year filters
      if (params?.yearFrom) {
        filteredCars = filteredCars.filter(car => car.year >= params.yearFrom!)
      }
      if (params?.yearTo) {
        filteredCars = filteredCars.filter(car => car.year <= params.yearTo!)
      }
      
      // Apply location filter
      if (params?.locationId) {
        filteredCars = filteredCars.filter(car => car.locationId === params.locationId)
      }
      
      // Apply sorting
      if (params?.sortBy) {
        filteredCars.sort((a, b) => {
          const aVal = a[params.sortBy!] || ''
          const bVal = b[params.sortBy!] || ''
          const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
          return params.sortDir === 'desc' ? -comparison : comparison
        })
      }
      
      // Apply pagination
      const page = params?.page || 1
      const pageSize = params?.pageSize || 12
      const startIndex = (page - 1) * pageSize
      const endIndex = startIndex + pageSize
      const paginatedCars = filteredCars.slice(startIndex, endIndex)
      
      return {
        items: paginatedCars,
        totalItems: filteredCars.length,
        totalPages: Math.ceil(filteredCars.length / pageSize),
        currentPage: page,
        pageSize: pageSize
      }
    } catch (error) {
      console.error('Error getting vehicles:', error)
      
      // If it's an authentication error, return empty result
      if (error instanceof Error && error.message.includes('Authentication failed')) {
        console.warn('Authentication failed - returning empty vehicle list')
        return {
          items: [],
          totalItems: 0,
          totalPages: 0,
          currentPage: params?.page || 1,
          pageSize: params?.pageSize || 12
        }
      }
      
      throw error
    }
  }

  async getVehicleById(id: string) {
    try {
      return this.request<any>(`/api/Car/${id}`)
    } catch (error) {
      console.error('Error getting vehicle by ID:', error)
      throw error
    }
  }

  async getVehicleByVin(vin: string) {
    try {
      return this.request<any>(`/api/Car/vin/${vin}`)
    } catch (error) {
      console.error('Error getting vehicle by VIN:', error)
      throw error
    }
  }

  // Image URL parsing utility
  parseImageUrl(photoUrls?: string, imagePath?: string): string | null {
    // Priority 1: ImagePath from CarGetDto
    if (imagePath) {
      return this.buildImageUrl(imagePath)
    }

    // Priority 2: PhotoUrls from CarDetailDto
    if (photoUrls) {
      const urls = photoUrls.split(';')
        .map(url => url.trim())
        .filter(url => url && !url.includes('default') && !url.includes('placeholder'))
      
      if (urls.length > 0) {
        return this.buildImageUrl(urls[0])
      }
    }

    return null
  }

  // Get car images from /api/Car/{id}/photo endpoint
  async getCarImages(carId: string): Promise<string[]> {
    try {
      // Try to get images from the photo endpoint
      const response = await this.request<any[]>(`/api/Car/${carId}/photo`)
      if (Array.isArray(response)) {
        return response.map(img => this.buildImageUrl(img))
      }
      return []
    } catch (error) {
      console.error('Error getting car images:', error)
      return []
    }
  }

  private buildImageUrl(url: string): string {
    if (url.startsWith('http')) {
      return url
    }
    
    const baseUrl = this.imageBaseURL.endsWith('/') 
      ? this.imageBaseURL.slice(0, -1) 
      : this.imageBaseURL
    
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url
    
    return `${baseUrl}/${cleanUrl}`
  }

  // Helper method to process image URLs from API response
  processImageUrls(car: any): string[] {
    const urls: string[] = []
    
    console.log('Processing image URLs for car:', car.id, car.make, car.model)
    
    // Check various possible image URL fields
    if (car.imageUrls && Array.isArray(car.imageUrls)) {
      console.log('Found imageUrls:', car.imageUrls)
      urls.push(...car.imageUrls.map((url: string) => this.buildImageUrl(url)))
    }
    
    if (car.photoUrls && Array.isArray(car.photoUrls)) {
      console.log('Found photoUrls:', car.photoUrls)
      urls.push(...car.photoUrls.map((url: string) => this.buildImageUrl(url)))
    }
    
    if (car.images && Array.isArray(car.images)) {
      console.log('Found images:', car.images)
      urls.push(...car.images.map((img: any) => this.buildImageUrl(img.url || img)))
    }
    
    if (car.imagePath) {
      console.log('Found imagePath:', car.imagePath)
      urls.push(this.buildImageUrl(car.imagePath))
    }
    
    if (car.primaryImage) {
      console.log('Found primaryImage:', car.primaryImage)
      urls.push(this.buildImageUrl(car.primaryImage))
    }
    
    // Also check for string-based photoUrls (semicolon separated)
    if (car.photoUrls && typeof car.photoUrls === 'string') {
      console.log('Found photoUrls string:', car.photoUrls)
      const urlArray = car.photoUrls.split(';').map((url: string) => url.trim()).filter((url: string) => url)
      urls.push(...urlArray.map((url: string) => this.buildImageUrl(url)))
    }
    
    // Remove duplicates and empty strings
    const uniqueUrls = [...new Set(urls.filter(url => url && url.trim() !== ''))]
    console.log('Final processed URLs:', uniqueUrls)
    
    return uniqueUrls
  }

  async getAvailableCarsForAuction() {
    try {
      return this.request<any[]>('/api/admin/cars/available-for-auction')
    } catch (error) {
      console.error('Error getting available cars for auction:', error)
      throw error
    }
  }

  async getCarByVin(vin: string) {
    try {
      return this.request<any>(`/api/car/vin/${vin}`)
    } catch (error) {
      console.error('Error getting car by VIN:', error)
      throw error
    }
  }

  async uploadCarPhoto(id: string, photoFile: File) {
    try {
      const formData = new FormData()
      formData.append('photo', photoFile)
      
      return this.request<any>(`/api/admin/cars/${id}/photo`, {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type, let browser set it with boundary
        }
      })
    } catch (error) {
      console.error('Error uploading car photo:', error)
      throw error
    }
  }

  async createVehicle(data: any) {
    try {
      return this.request<any>('/api/Car', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    } catch (error) {
      console.error('Error creating vehicle:', error)
      throw error
    }
  }

  async updateVehicle(id: string, data: any) {
    try {
      return this.request<any>(`/api/Car/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    } catch (error) {
      console.error('Error updating vehicle:', error)
      throw error
    }
  }

  async deleteVehicle(id: string) {
    try {
      return this.request<void>(`/api/Car/${id}`, {
        method: 'DELETE',
      })
    } catch (error) {
      console.error('Error deleting vehicle:', error)
      throw error
    }
  }

  // Users - Admin User Management API Endpoints
  async getUsers(params?: {
    page?: number
    limit?: number
    role?: string
    status?: string
    search?: string
    sortBy?: string
    sortDirection?: 'asc' | 'desc'
  }): Promise<PagedResponse<any>> {
    try {
      let endpoint = '/api/Admin/users'
      const queryParams = new URLSearchParams()
      
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      if (params?.role) queryParams.append('role', params.role)
      if (params?.status) queryParams.append('status', params.status)
      if (params?.search) queryParams.append('search', params.search)
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
      if (params?.sortDirection) queryParams.append('sortDirection', params.sortDirection)
      
      if (queryParams.toString()) {
        endpoint += `?${queryParams.toString()}`
      }
      
      const response = await this.request<any>(endpoint)
      
      // Handle different response formats
      if (response && typeof response === 'object') {
        if (response.data && response.pagination) {
          // AdminPagedResponseDto format
          return {
            items: response.data,
            totalItems: response.pagination.totalItems,
            totalPages: response.pagination.totalPages,
            currentPage: params?.page || 1,
            pageSize: params?.limit || 20
          }
        } else if (response.items && response.totalItems) {
          // Direct PagedResponse format
          return response
        } else if (Array.isArray(response)) {
          // Simple array response
          return {
            items: response,
            totalItems: response.length,
            totalPages: 1,
            currentPage: 1,
            pageSize: response.length
          }
        }
      }
      
      // Fallback for unexpected response format
      console.warn('Unexpected users API response format:', response)
      return {
        items: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: params?.page || 1,
        pageSize: params?.limit || 20
      }
    } catch (error) {
      console.error('Error getting users:', error)
      // Return empty result instead of throwing error
      return {
        items: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: params?.page || 1,
        pageSize: params?.limit || 20
      }
    }
  }

  async getUserStatistics(): Promise<any> {
    try {
      return this.request<any>('/api/Admin/statistics/users')
    } catch (error) {
      console.error('Error getting user statistics:', error)
      // Return default stats if endpoint doesn't exist
      return {
        totalUsers: 0,
        activeUsers: 0,
        newUsersToday: 0,
        bannedUsers: 0,
        pendingUsers: 0
      }
    }
  }

  async updateUserStatus(userId: string, status: 'active' | 'inactive' | 'banned', reason?: string): Promise<any> {
    try {
      return this.request<any>(`/api/Admin/users/${userId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ 
          isActive: status === 'active',
          status: status,
          reason: reason || ''
        })
      })
    } catch (error) {
      console.error('Error updating user status:', error)
      throw error
    }
  }

  async assignRoleToUser(userId: string, role: string): Promise<any> {
    try {
      return this.request<any>(`/api/Admin/users/${userId}/roles`, {
        method: 'POST',
        body: JSON.stringify({ role })
      })
    } catch (error) {
      console.error('Error assigning role to user:', error)
      throw error
    }
  }

  async removeRoleFromUser(userId: string, role: string): Promise<any> {
    try {
      return this.request<any>(`/api/Admin/users/${userId}/roles/${role}`, {
        method: 'DELETE'
      })
    } catch (error) {
      console.error('Error removing role from user:', error)
      throw error
    }
  }

  async bulkUserAction(action: string, userIds: string[], reason?: string): Promise<any> {
    try {
      return this.request<any>('/api/Admin/users/bulk', {
        method: 'POST',
        body: JSON.stringify({ 
          action, 
          userIds,
          reason: reason || ''
        })
      })
    } catch (error) {
      console.error('Error performing bulk user action:', error)
      throw error
    }
  }

  async getUserById(id: string) {
    try {
      return this.request<any>(`/api/Auth/profile/${id}`)
    } catch (error) {
      console.error('Error getting user by ID:', error)
      throw error
    }
  }

  async createUser(data: any) {
    try {
      return this.request<any>('/api/Auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  }

  async updateUser(id: string, data: any) {
    try {
      return this.request<any>(`/api/Auth/profile/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  }

  async deleteUser(id: string) {
    try {
      return this.request<void>(`/api/Auth/users/${id}`, {
        method: 'DELETE',
      })
    } catch (error) {
      console.error('Error deleting user:', error)
      throw error
    }
  }

  // Roles
  async getRoles() {
    try {
      return this.request<string[]>('/api/Auth/roles')
    } catch (error) {
      console.error('Error getting roles:', error)
      return ['user', 'admin'] // Default roles
    }
  }

  async createRole(data: any) {
    try {
      return this.request<any>('/api/Auth/roles', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    } catch (error) {
      console.error('Error creating role:', error)
      throw error
    }
  }

  async updateRole(id: string, data: any) {
    try {
      return this.request<any>(`/api/Auth/roles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    } catch (error) {
      console.error('Error updating role:', error)
      throw error
    }
  }

  async deleteRole(id: string) {
    try {
      return this.request<void>(`/api/Auth/roles/${id}`, {
        method: 'DELETE',
      })
    } catch (error) {
      console.error('Error deleting role:', error)
      throw error
    }
  }

  // Audit Logs - These endpoints may not exist
  async getAuditLogs(params?: {
    page?: number
    limit?: number
    action?: string
    userId?: string
    dateFrom?: string
    dateTo?: string
  }) {
    try {
      console.warn('Audit logs endpoint not available in current API')
      return []
    } catch (error) {
      console.error('Error getting audit logs:', error)
      return []
    }
  }

  async getAuditLogById(id: string) {
    try {
      console.warn('Audit log details endpoint not available in current API')
      return null
    } catch (error) {
      console.error('Error getting audit log by ID:', error)
      return null
    }
  }

  // Reports - These endpoints may not exist
  async getReports(type: string, params?: any) {
    try {
      console.warn('Reports endpoint not available in current API')
      return []
    } catch (error) {
      console.error('Error getting reports:', error)
      return []
    }
  }

  // Settings - These endpoints may not exist
  async getSettings() {
    try {
      console.warn('Settings endpoint not available in current API')
      return {}
    } catch (error) {
      console.error('Error getting settings:', error)
      return {}
    }
  }

  // Locations - Complete CRUD operations
  async getLocations(params?: {
    page?: number
    limit?: number
    search?: string
    region?: string
    city?: string
    status?: string
    sortBy?: string
    sortDirection?: 'asc' | 'desc'
  }): Promise<PagedResponse<any>> {
    try {
      let endpoint = '/api/Location'
      const queryParams = new URLSearchParams()
      
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      if (params?.search) queryParams.append('search', params.search)
      if (params?.region) queryParams.append('region', params.region)
      if (params?.city) queryParams.append('city', params.city)
      if (params?.status) queryParams.append('status', params.status)
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
      if (params?.sortDirection) queryParams.append('sortDirection', params.sortDirection)
      
      if (queryParams.toString()) {
        endpoint += `?${queryParams.toString()}`
      }
      
      const response = await this.request<any>(endpoint)
      
      // Handle different response formats
      if (response && typeof response === 'object') {
        if (response.items && response.totalItems) {
          // Direct PagedResponse format
          return response
        } else if (response.data && response.pagination) {
          // Wrapped in data property with pagination
          return {
            items: response.data,
            totalItems: response.pagination.totalItems,
            totalPages: response.pagination.totalPages,
            currentPage: params?.page || 1,
            pageSize: params?.limit || 20
          }
        } else if (Array.isArray(response)) {
          // Simple array response - convert to paged format
          return {
            items: response,
            totalItems: response.length,
            totalPages: 1,
            currentPage: 1,
            pageSize: response.length
          }
        }
      }
      
      // Fallback for unexpected response format
      console.warn('Unexpected locations API response format:', response)
      return {
        items: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: params?.page || 1,
        pageSize: params?.limit || 20
      }
    } catch (error) {
      console.error('Error getting locations:', error)
      // Return empty result instead of throwing error
      return {
        items: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: params?.page || 1,
        pageSize: params?.limit || 20
      }
    }
  }

  async getLocationById(id: string) {
    try {
      return this.request<any>(`/api/Location/${id}`)
    } catch (error) {
      console.error('Error getting location by ID:', error)
      return null
    }
  }

  async createLocation(data: any) {
    try {
      console.log('Creating location with data:', data)
      const result = await this.request<any>('/api/Location', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      console.log('Location created successfully:', result)
      return result
    } catch (error) {
      console.error('Error creating location:', error)
      throw error
    }
  }

  async updateLocation(id: string, data: any) {
    try {
      console.log('Updating location with data:', data)
      const result = await this.request<any>(`/api/Location/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      console.log('Location updated successfully:', result)
      return result
    } catch (error) {
      console.error('Error updating location:', error)
      throw error
    }
  }

  async deleteLocation(id: string) {
    try {
      console.log('Deleting location:', id)
      const result = await this.request<void>(`/api/Location/${id}`, {
        method: 'DELETE',
      })
      console.log('Location deleted successfully:', result)
      return result
    } catch (error) {
      console.error('Error deleting location:', error)
      throw error
    }
  }

  async getLocationStats() {
    try {
      return this.request<any>('/api/Location/stats')
    } catch (error) {
      console.error('Error getting location stats:', error)
      // Return default stats if endpoint doesn't exist
      return {
        totalLocations: 0,
        activeLocations: 0,
        totalAuctions: 0,
        totalVehicles: 0,
        upcomingAuctions: 0
      }
    }
  }

  async updateSettings(data: any) {
    try {
      console.warn('Update settings endpoint not available in current API')
      return data
    } catch (error) {
      console.error('Error updating settings:', error)
      throw error
    }
  }

  // Additional methods for the new components
  async getAuction(id: string): Promise<any> {
    return this.getAuctionById(id)
  }

  async getAuctionStatistics(id: string): Promise<any> {
    try {
      return this.request<any>(`/api/auction/${id}/statistics`)
    } catch (error) {
      console.error('Error getting auction statistics:', error)
      // Return mock data if endpoint doesn't exist
      return {
        totalVehicles: 0,
        totalRevenue: 0,
        averageBid: 0,
        highestBid: 0,
        totalBids: 0
      }
    }
  }


  async getCars(): Promise<any[]> {
    try {
      const response = await this.getVehicles({ pageSize: 1000 })
      return response.items
    } catch (error) {
      console.error('Error getting cars:', error)
      return []
    }
  }

  async addCarToAuction(auctionId: string, data: any): Promise<void> {
    return this.createAuctionCar({
      auctionId,
      ...data
    })
  }

  // Note: getLocations and createAuction methods already exist above

  // Enum metadata endpoint
  async getEnums() {
    try {
      console.log('Fetching enum metadata from /api/admin/enums...')
      const response = await this.request<any>('/api/admin/enums')
      console.log('Enum metadata loaded successfully:', response)
      return response
    } catch (error) {
      console.error('Error getting enum metadata:', error)
      throw error
    }
  }

  // Admin Dashboard API Endpoints
  async getAdminDashboard() {
    try {
      return this.request<any>('/api/Admin/dashboard')
    } catch (error) {
      console.error('Error getting admin dashboard data:', error)
      throw error
    }
  }

  async getAdminUserStatistics() {
    try {
      return this.request<any>('/api/Admin/statistics/users')
    } catch (error) {
      console.error('Error getting admin user statistics:', error)
      throw error
    }
  }

  async getAdminSystemHealth() {
    try {
      return this.request<any>('/api/Admin/system/health')
    } catch (error) {
      console.error('Error getting admin system health:', error)
      throw error
    }
  }

  async getAdminRecentActivities() {
    try {
      return this.request<any>('/api/Admin/activities/recent')
    } catch (error) {
      console.error('Error getting admin recent activities:', error)
      throw error
    }
  }
}

export const apiClient = new ApiClient()
export type { ApiResponse }
