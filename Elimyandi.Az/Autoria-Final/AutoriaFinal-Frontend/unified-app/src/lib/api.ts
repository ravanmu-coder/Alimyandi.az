import { 
  AuthResponseDto,
  RegisterDto,
  AuctionGetDto, 
  AuctionDetailDto, 
  AuctionTimerInfo,
  AuctionCarGetDto, 
  AuctionCarDetailDto, 
  CarDto,
  BidDetailDto,
  BidGetDto,
  PlaceLiveBidRequest,
  PlacePreBidRequest,
  PlaceProxyBidRequest,
  BidValidationResult,
  VehicleSearchParams,
  VehicleSearchResult,
  VehicleSearchItem,
  VehicleFilters,
  IUserProfile,
  IUpdateUserProfile
} from '../types/api';

const API_BASE_URL = 'https://localhost:7249';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;
  private requestQueue: Map<string, Promise<any>> = new Map();
  private lastRequestTime: Map<string, number> = new Map();

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    // Check both possible token keys for compatibility
    this.token = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const requestKey = `${options.method || 'GET'}:${endpoint}`;
    
    // Check if we have a pending request for this endpoint
    if (this.requestQueue.has(requestKey)) {
      console.log(`Request already pending for ${requestKey}, waiting...`);
      return this.requestQueue.get(requestKey)!;
    }

    // Throttle requests - minimum 1 second between requests to same endpoint
    const now = Date.now();
    const lastTime = this.lastRequestTime.get(requestKey) || 0;
    if (now - lastTime < 500) {
      console.log(`Request throttled for ${requestKey}, too soon since last request`);
      throw new Error('Request throttled - too soon since last request');
    }

    this.lastRequestTime.set(requestKey, now);

    const requestPromise = this.makeRequest<T>(url, options);
    this.requestQueue.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.requestQueue.delete(requestKey);
    }
  }

  private async makeRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
      mode: 'cors', // CORS mode
      credentials: 'include', // Include credentials for CORS
    };

    try {
      console.log(`Making API request to: ${url}`);
      const response = await fetch(url, config);
      console.log(`API response status: ${response.status}`);

      // Handle authentication errors
      if (response.status === 401) {
        console.log('Authentication error - clearing token');
        this.clearToken();
        localStorage.removeItem('auth_token');
        localStorage.removeItem('authToken');
        throw new Error('Authentication failed. Please log in again.');
      }

      if (response.status === 403) {
        throw new Error('Access denied. You do not have permission to access this resource.');
      }

      // Handle 404 gracefully for auction status endpoints
      if (response.status === 404 && url.includes('/status')) {
        console.log('📊 API: 404 on status endpoint - auction may be inactive/completed');
        const errorText = await response.text();
        const error = new Error(`API Error: ${response.status} - ${errorText}`);
        (error as any).status = 404;
        (error as any).isStatusEndpoint = true;
        throw error;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error: ${response.status} - ${errorText}`);
        
        const error = new Error(`API Error: ${response.status} - ${errorText}`);
        (error as any).status = response.status;
        throw error;
      }

      const contentType = response.headers.get('Content-Type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log(`API response data:`, data);
        return data;
      }
      
      const textData = await response.text();
      console.log(`API response text:`, textData);
      return textData as unknown as T;
    } catch (error) {
      console.error(`API request failed:`, error);
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error(`Network Error: Unable to connect to API server at ${this.baseURL}. Please check if the backend server is running and CORS is configured.`);
      }
      throw error;
    }
  }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  clearToken(): void {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  logout(): void {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  // Auth endpoints
  async login(credentials: { email: string; password: string }): Promise<AuthResponseDto> {
    const response = await this.request<AuthResponseDto>('/api/Auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async register(userData: RegisterDto): Promise<AuthResponseDto> {
    const response = await this.request<AuthResponseDto>('/api/Auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async logoutUser(): Promise<void | any> {
    try {
      const result = await this.request<any>('/api/Auth/logout', {
        method: 'POST',
      });
      return result;
    } finally {
      this.logout();
    }
  }

  async confirmEmail(params: { token?: string; redirect?: string }): Promise<void | any> {
    const query = new URLSearchParams();
    if (params.token) query.append('token', params.token);
    if (params.redirect) query.append('redirect', params.redirect);
    const qs = query.toString();
    return this.request<void | any>(`/api/Auth/confirmemail${qs ? `?${qs}` : ''}`);
  }

  async resendConfirmation(email: string): Promise<void | any> {
    return this.request<void | any>('/api/Auth/resend-confirmation', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async forgotPassword(payload: { email: string; callbackUrl?: string; ipAddress?: string; userAgent?: string }): Promise<void | any> {
    return this.request<void | any>('/api/Auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async resetPassword(payload: { email: string; token: string; password: string; confirmPassword: string }): Promise<void | any> {
    return this.request<void | any>('/api/Auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getProfile(): Promise<IUserProfile> {
    return this.request<IUserProfile>('/api/Auth/profile');
  }

  async updateProfile(update: IUpdateUserProfile): Promise<IUserProfile> {
    return this.request<IUserProfile>('/api/Auth/profile', {
      method: 'PUT',
      body: JSON.stringify(update),
    });
  }

  async changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<void> {
    return this.request<void>('/api/Auth/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
  }

  async me(): Promise<any> {
    return this.request<any>('/api/Auth/me');
  }

  async getRoles(): Promise<string[]> {
    return this.request<string[]>('/api/Auth/roles');
  }

  async authHealth(): Promise<any> {
    return this.request<any>('/api/Auth/health');
  }

  // Auction endpoints
  async getAuctions(params?: { limit?: number; page?: number }): Promise<AuctionGetDto[]> {
    let url = '/api/Auction';
    if (params?.limit) {
      url += `?limit=${params.limit}`;
    }
    if (params?.page) {
      url += `${params.limit ? '&' : '?'}page=${params.page}`;
    }
    return this.request<AuctionGetDto[]>(url);
  }

  async getLiveAuctions(): Promise<AuctionGetDto[]> {
    return this.request<AuctionGetDto[]>('/api/Auction/live');
  }

  async getActiveAuctions(): Promise<AuctionGetDto[]> {
    return this.request<AuctionGetDto[]>('/api/Auction/active');
  }

  async getReadyToStartAuctions(): Promise<AuctionGetDto[]> {
    return this.request<AuctionGetDto[]>('/api/Auction/ready-to-start');
  }

  async getExpiredAuctions(): Promise<AuctionGetDto[]> {
    return this.request<AuctionGetDto[]>('/api/Auction/expired');
  }

  async getAuction(id: string): Promise<AuctionDetailDto> {
    return this.request<AuctionDetailDto>(`/api/Auction/${id}`);
  }

  async getAuctionTimer(id: string): Promise<AuctionTimerInfo> {
    return this.request<AuctionTimerInfo>(`/api/Auction/${id}/timer`);
  }

  async getAuctionCurrentState(id: string): Promise<any> {
    return this.request<any>(`/api/Auction/${id}/current-state`);
  }

  async getAuctionStatus(id: string): Promise<{ activeCarId?: string; allFinished: boolean }> {
    return this.request<{ activeCarId?: string; allFinished: boolean }>(`/api/auctions/${id}/status`);
  }

  async getAuctionStatistics(id: string): Promise<any> {
    try {
      return await this.request<any>(`/api/Auction/${id}/statistics`);
    } catch (error: any) {
      // Statistics endpoint may require admin permissions
      console.warn(`Statistics endpoint failed for auction ${id}:`, error.message);
      return null;
    }
  }

  async getAuctionsByLocation(locationId: string): Promise<AuctionGetDto[]> {
    return this.request<AuctionGetDto[]>(`/api/Auction/location/${locationId}`);
  }

  // AuctionCar endpoints
  async getAuctionCars(auctionId: string): Promise<AuctionCarGetDto[]> {
    return this.request<AuctionCarGetDto[]>(`/api/AuctionCar/auction/${auctionId}`);
  }

  async getAllAuctionCars(): Promise<AuctionCarGetDto[]> {
    return this.request<AuctionCarGetDto[]>('/api/AuctionCar');
  }

  async getBatchAuctionStatus(carIds: string[]): Promise<any[]> {
    return this.request<any[]>('/api/Car/auction-status/batch', {
      method: 'POST',
      body: JSON.stringify({ carIds })
    });
  }

  async getAuctionCar(id: string): Promise<AuctionCarDetailDto> {
    return this.request<AuctionCarDetailDto>(`/api/AuctionCar/${id}`);
  }

  async getAuctionCarByLot(lotNumber: string): Promise<AuctionCarDetailDto> {
    return this.request<AuctionCarDetailDto>(`/api/AuctionCar/lot/${lotNumber}`);
  }

  async getActiveAuctionCar(auctionId: string): Promise<AuctionCarDetailDto> {
    return this.request<AuctionCarDetailDto>(`/api/AuctionCar/auction/${auctionId}/active`);
  }

  async getNextAuctionCar(auctionId: string): Promise<AuctionCarDetailDto> {
    return this.request<AuctionCarDetailDto>(`/api/AuctionCar/auction/${auctionId}/next`);
  }

  async getReadyAuctionCars(auctionId: string): Promise<AuctionCarGetDto[]> {
    return this.request<AuctionCarGetDto[]>(`/api/AuctionCar/auction/${auctionId}/ready`);
  }

  async getUnsoldAuctionCars(auctionId: string): Promise<AuctionCarGetDto[]> {
    return this.request<AuctionCarGetDto[]>(`/api/AuctionCar/auction/${auctionId}/unsold`);
  }

  async getAuctionCarStats(auctionCarId: string): Promise<any> {
    return this.request<any>(`/api/AuctionCar/${auctionCarId}/stats`);
  }

  async getAuctionCarFullDetails(auctionCarId: string): Promise<any> {
    return this.request<any>(`/api/AuctionCar/${auctionCarId}/full-details`);
  }

  async getNextMinimumBid(auctionCarId: string): Promise<{ nextMinimumBid: number }> {
    return this.request<{ nextMinimumBid: number }>(`/api/AuctionCar/${auctionCarId}/next-min-bid`);
  }

  // Bid endpoints
  async placeLiveBid(request: PlaceLiveBidRequest): Promise<BidDetailDto> {
    return this.request<BidDetailDto>('/api/Bid/live', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async placePreBid(request: PlacePreBidRequest): Promise<BidDetailDto> {
    return this.request<BidDetailDto>('/api/Bid/prebid', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async placeProxyBid(request: PlaceProxyBidRequest): Promise<BidDetailDto> {
    return this.request<BidDetailDto>('/api/Bid/proxy', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async updateProxyBid(bidId: string, request: any): Promise<BidDetailDto> {
    return this.request<BidDetailDto>(`/api/Bid/proxy/${bidId}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  async getBid(id: string): Promise<BidDetailDto> {
    return this.request<BidDetailDto>(`/api/Bid/${id}`);
  }

  async getBidHistory(auctionCarId: string, pageSize: number = 50): Promise<any> {
    return this.request(`/api/Bid/auction-car/${auctionCarId}/history?pageSize=${pageSize}`);
  }

  async getRecentBids(auctionCarId: string, count: number = 10): Promise<BidGetDto[]> {
    return this.request<BidGetDto[]>(`/api/Bid/auction-car/${auctionCarId}/recent?count=${count}`);
  }

  async getBidStats(auctionCarId: string): Promise<any> {
    return this.request<any>(`/api/Bid/auction-car/${auctionCarId}/stats`);
  }

  async getHighestBid(auctionCarId: string): Promise<BidDetailDto> {
    return this.request<BidDetailDto>(`/api/Bid/auction-car/${auctionCarId}/highest`);
  }

  async getMinimumBid(auctionCarId: string): Promise<number> {
    return this.request<number>(`/api/Bid/auction-car/${auctionCarId}/minimum`);
  }

  async getMyBids(): Promise<BidGetDto[]> {
    return this.request<BidGetDto[]>('/api/Bid/my-bids');
  }

  async getMyProxyBids(auctionCarId: string): Promise<BidGetDto[]> {
    return this.request<BidGetDto[]>(`/api/Bid/my-proxy-bids/${auctionCarId}`);
  }

  async getMyBidSummary(auctionId: string): Promise<any> {
    return this.request<any>(`/api/Bid/my-summary/${auctionId}`);
  }

  async validateBid(request: any): Promise<BidValidationResult> {
    return this.request<BidValidationResult>('/api/Bid/validate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async canBid(auctionCarId: string): Promise<boolean> {
    return this.request<boolean>(`/api/Bid/can-bid/${auctionCarId}`);
  }

  // Car endpoints
  async getCars(): Promise<any[]> {
    return this.request<any[]>('/api/Car');
  }

  async getCar(id: string): Promise<any> {
    try {
      console.log(`Fetching car details for ID: ${id}`);
      const carData = await this.request<any>(`/api/Car/${id}`);
      console.log('Car data received:', carData);
      
      // Process PhotoUrls to ensure consistent format
      if (carData.photoUrls) {
        if (typeof carData.photoUrls === 'string') {
          // Convert semicolon-separated string to array
          carData.photoUrls = carData.photoUrls.split(';').filter((url: string) => url.trim() !== '');
        }
        console.log('Processed PhotoUrls:', carData.photoUrls);
      }
      
      return carData;
    } catch (error) {
      console.error(`Error fetching car ${id}:`, error);
      throw error;
    }
  }

  async getCarByVin(vin: string): Promise<any> {
    return this.request<any>(`/api/Car/vin/${vin}`);
  }

  async getMyCars(): Promise<any[]> {
    return this.request<any[]>('/api/Car/my');
  }

  async deleteCar(carId: string): Promise<void> {
    return this.request<void>(`/api/Car/${carId}`, {
      method: 'DELETE'
    });
  }

  async updateCar(carId: string, carData: any): Promise<any> {
    return this.request<any>(`/api/Car/${carId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(carData)
    });
  }

  // Location endpoints
  async getLocations(): Promise<any[]> {
    return this.request<any[]>('/api/Location');
  }

  async getLocation(id: string): Promise<any> {
    return this.request<any>(`/api/Location/${id}`);
  }

  // Enhanced car photo methods with better error handling and caching
  async getCarPhotos(id: string): Promise<any[]> {
    try {
      console.log(`Fetching car photos for ID: ${id}`);
      const photos = await this.request<any[]>(`/api/Car/${id}/photos`);
      console.log('Car photos received:', photos);
      return photos || [];
    } catch (error) {
      console.warn(`Error fetching car photos ${id}:`, error);
      // Return empty array instead of throwing error
      return [];
    }
  }

  // Image preloading utility
  async preloadImages(urls: string[]): Promise<void> {
    const preloadPromises = urls.map(url => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to preload image: ${url}`));
        img.src = url;
      });
    });

    try {
      await Promise.allSettled(preloadPromises);
      console.log(`Preloaded ${urls.length} images`);
    } catch (error) {
      console.warn('Some images failed to preload:', error);
    }
  }

  // Enhanced car data fetching with image processing
  async getCarWithImages(id: string): Promise<any> {
    try {
      console.log(`Fetching car with images for ID: ${id}`);
      const carData = await this.request<any>(`/api/Car/${id}`);
      console.log('Car data received:', carData);
      
      // Process PhotoUrls to ensure consistent format
      if (carData.photoUrls) {
        if (typeof carData.photoUrls === 'string') {
          // Convert semicolon-separated string to array
          carData.photoUrls = carData.photoUrls.split(';').filter((url: string) => url.trim() !== '');
        }
        console.log('Processed PhotoUrls:', carData.photoUrls);
      }
      
      return carData;
    } catch (error) {
      console.error(`Error fetching car with images ${id}:`, error);
      throw error;
    }
  }

  // Auction stats endpoint
  async getAuctionStats(auctionId: string): Promise<any> {
    try {
      console.log(`Fetching auction stats for ID: ${auctionId}`);
      const stats = await this.request<any>(`/api/auction/${auctionId}/stats`);
      console.log('Auction stats received:', stats);
      return stats;
    } catch (error) {
      console.warn(`Error fetching auction stats ${auctionId}:`, error);
      // Return null instead of throwing error
      return null;
    }
  }

  // Auction car bids endpoint
  async getAuctionCarBids(auctionCarId: string): Promise<any[]> {
    try {
      console.log(`Fetching bids for auction car ID: ${auctionCarId}`);
      // Try the correct endpoint first
      const bids = await this.request<any[]>(`/api/Bid/auction-car/${auctionCarId}/recent?count=50`);
      console.log('Auction car bids received:', bids);
      return bids || [];
    } catch (error) {
      console.warn(`Error fetching auction car bids ${auctionCarId}:`, error);
      // Return empty array instead of throwing error
      return [];
    }
  }

  // Auction Winners endpoints
  async getAuctionWinners(): Promise<any[]> {
    return this.request<any[]>('/api/AuctionWinner');
  }

  async getAuctionWinner(id: string): Promise<any> {
    return this.request<any>(`/api/AuctionWinner/${id}`);
  }

  async getMyWins(): Promise<any[]> {
    return this.request<any[]>('/api/AuctionWinner/my-wins');
  }

  async getMyUnpaidWins(): Promise<any[]> {
    return this.request<any[]>('/api/AuctionWinner/my-unpaid');
  }

  async getOverdueWins(): Promise<any[]> {
    return this.request<any[]>('/api/AuctionWinner/overdue');
  }

  async getWinnerByAuctionCar(auctionCarId: string): Promise<any> {
    return this.request<any>(`/api/AuctionWinner/auction-car/${auctionCarId}/winner`);
  }

  // Auth endpoints
  async getUserProfile(userId: string): Promise<any> {
    return this.request<any>(`/api/Auth/profile/${userId}`);
  }

  // Info endpoint
  async getInfo(): Promise<any> {
    return this.request<any>('/api/info');
  }

  // Vehicle Finder endpoints - using Car endpoint with filters
  async searchVehicles(searchParams: VehicleSearchParams): Promise<VehicleSearchResult> {
    try {
      console.log('Searching vehicles with params:', searchParams);
      
      // Get all cars from the /api/Car endpoint
      const cars = await this.request<CarDto[]>('/api/Car');
      console.log('Retrieved cars from API:', cars.length);
      
      // Transform CarDto to VehicleSearchItem format
      const vehicles: VehicleSearchItem[] = cars.map(car => ({
        id: car.id,
        auctionId: '', // Not available in CarDto
        carId: car.id,
        lotNumber: `LOT-${car.id.slice(-4)}`, // Generate lot number from car ID
        currentPrice: 0, // Not available in CarDto, will be set to 0
        minPreBid: 0, // Not available in CarDto
        winnerStatus: '', // Not available in CarDto
        isActive: false, // Not available in CarDto
        bidCount: 0, // Not available in CarDto
        lastBidTime: '', // Not available in CarDto
        isReserveMet: false, // Not available in CarDto
        reservePrice: 0, // Not available in CarDto
        carMake: car.make || '',
        carModel: car.model || '',
        carYear: car.year || 0,
        carImage: car.imageUrls?.[0] || '/placeholder-car.jpg',
        carVin: car.vin || '',
        carOdometer: car.odometer || 0,
        carCondition: car.condition || '',
        carType: car.type || '',
        carDamageType: car.damageType || '',
        carLocation: car.location?.city || car.location?.name || '',
        auctionName: '', // Not available in CarDto
        auctionStartTime: '', // Not available in CarDto
        auctionEndTime: '' // Not available in CarDto
      }));

      // Apply client-side filtering
      let filteredVehicles = vehicles;

      if (searchParams.make) {
        filteredVehicles = filteredVehicles.filter(vehicle => 
          vehicle.carMake.toLowerCase().includes(searchParams.make!.toLowerCase())
        );
      }

      if (searchParams.model) {
        filteredVehicles = filteredVehicles.filter(vehicle => 
          vehicle.carModel.toLowerCase().includes(searchParams.model!.toLowerCase())
        );
      }

      if (searchParams.year) {
        filteredVehicles = filteredVehicles.filter(vehicle => 
          vehicle.carYear === searchParams.year
        );
      }

      if (searchParams.minYear) {
        filteredVehicles = filteredVehicles.filter(vehicle => 
          vehicle.carYear >= searchParams.minYear!
        );
      }

      if (searchParams.maxYear) {
        filteredVehicles = filteredVehicles.filter(vehicle => 
          vehicle.carYear <= searchParams.maxYear!
        );
      }

      if (searchParams.condition) {
        filteredVehicles = filteredVehicles.filter(vehicle => 
          vehicle.carCondition.toLowerCase().includes(searchParams.condition!.toLowerCase())
        );
      }

      if (searchParams.damageType) {
        filteredVehicles = filteredVehicles.filter(vehicle => 
          vehicle.carDamageType.toLowerCase().includes(searchParams.damageType!.toLowerCase())
        );
      }

      if (searchParams.location) {
        filteredVehicles = filteredVehicles.filter(vehicle => 
          vehicle.carLocation.toLowerCase().includes(searchParams.location!.toLowerCase())
        );
      }

      if (searchParams.type) {
        filteredVehicles = filteredVehicles.filter(vehicle => 
          vehicle.carType.toLowerCase().includes(searchParams.type!.toLowerCase())
        );
      }

      if (searchParams.minOdometer) {
        filteredVehicles = filteredVehicles.filter(vehicle => 
          vehicle.carOdometer >= searchParams.minOdometer!
        );
      }

      if (searchParams.maxOdometer) {
        filteredVehicles = filteredVehicles.filter(vehicle => 
          vehicle.carOdometer <= searchParams.maxOdometer!
        );
      }

      if (searchParams.vin) {
        filteredVehicles = filteredVehicles.filter(vehicle => 
          vehicle.carVin.toLowerCase().includes(searchParams.vin!.toLowerCase())
        );
      }

      if (searchParams.lotNumber) {
        filteredVehicles = filteredVehicles.filter(vehicle => 
          vehicle.lotNumber.toLowerCase().includes(searchParams.lotNumber!.toLowerCase())
        );
      }

      // Pagination
      const page = searchParams.page || 1;
      const pageSize = searchParams.pageSize || 12;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedVehicles = filteredVehicles.slice(startIndex, endIndex);

      console.log(`Filtered ${filteredVehicles.length} vehicles, showing page ${page}`);

      return {
        vehicles: paginatedVehicles,
        totalCount: filteredVehicles.length,
        page,
        pageSize,
        totalPages: Math.ceil(filteredVehicles.length / pageSize)
      };
    } catch (error) {
      console.error('Error in searchVehicles:', error);
      // Return empty result on error
      return {
        vehicles: [],
        totalCount: 0,
        page: searchParams.page || 1,
        pageSize: searchParams.pageSize || 12,
        totalPages: 0
      };
    }
  }

  async getVehicleFilters(): Promise<VehicleFilters> {
    try {
      console.log('Loading vehicle filters from API endpoints...');
      // Fetch data from dedicated endpoints
      const [cars, locations] = await Promise.all([
        this.request<any[]>('/api/Car'),
        this.request<any[]>('/api/Location')
      ]);

      console.log('Cars data:', cars);
      console.log('Locations data:', locations);

      // Extract unique values for filters from Car endpoint
      const makes = [...new Set(cars.map(car => car.make).filter(Boolean))] as string[];
      const models = [...new Set(cars.map(car => car.model).filter(Boolean))] as string[];
      const conditions = [...new Set(cars.map(car => car.condition).filter(Boolean))] as string[];
      const damageTypes = [...new Set(cars.map(car => car.damageType).filter(Boolean))] as string[];
      const types = [...new Set(cars.map(car => car.bodyStyle).filter(Boolean))] as string[];
      const locationsList = locations.map(loc => loc.name || loc.city).filter(Boolean) as string[];
    
      const filters = {
        conditions: ['All', ...conditions],
        types: ['All', ...types],
        damageTypes: ['All', ...damageTypes],
        makes: ['All', ...makes],
        models: ['All', ...models],
        locations: ['All', ...locationsList]
      };

      console.log('Generated filters:', filters);
      return filters;
    } catch (error) {
      console.error('Error loading vehicle filters:', error);
      // Return default filters on error
      return {
        conditions: ['All', 'Used', 'Salvage', 'Excellent', 'Good', 'Fair'],
        types: ['All', 'Sedan', 'SUV', 'Truck', 'Coupe', 'Convertible', 'Hatchback', 'Wagon'],
        damageTypes: ['All', 'None', 'Front End', 'Rear End', 'Side', 'All Over', 'Water/Flood', 'Hail', 'Vandalism'],
        makes: ['All', 'Ford', 'Chevrolet', 'BMW', 'Mercedes-Benz', 'Audi', 'Porsche', 'Toyota', 'Honda', 'Nissan', 'Hyundai'],
        models: ['All'],
        locations: ['All', 'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Miami', 'Dallas', 'Atlanta', 'Denver', 'Seattle']
      };
    }
  }

  async getVehicleMakes(): Promise<string[]> {
    try {
      console.log('Loading vehicle makes from /api/Car endpoint...');
      const cars = await this.request<any[]>('/api/Car');
      const makes = [...new Set(cars.map(car => car.make).filter(Boolean))] as string[];
      console.log('Loaded makes:', makes);
      return makes;
    } catch (error) {
      console.error('Error loading vehicle makes:', error);
      return ['Ford', 'Chevrolet', 'BMW', 'Mercedes-Benz', 'Audi', 'Porsche', 'Toyota', 'Honda', 'Nissan', 'Hyundai'];
    }
  }

  async getVehicleModels(make: string): Promise<string[]> {
    try {
      console.log(`Loading vehicle models for make: ${make} from /api/Car endpoint...`);
      const cars = await this.request<any[]>('/api/Car');
      const models = cars
        .filter(car => car.make === make)
        .map(car => car.model)
        .filter(Boolean) as string[];
      const uniqueModels = [...new Set(models)];
      console.log(`Loaded models for ${make}:`, uniqueModels);
      return uniqueModels;
    } catch (error) {
      console.error('Error loading vehicle models:', error);
      return [];
    }
  }


  async getVehicleConditions(): Promise<string[]> {
    try {
      console.log('Loading vehicle conditions from /api/Car endpoint...');
      const cars = await this.request<any[]>('/api/Car');
      const conditions = [...new Set(cars.map(car => car.condition).filter(Boolean))] as string[];
      console.log('Loaded conditions:', conditions);
      return conditions;
    } catch (error) {
      console.error('Error loading vehicle conditions:', error);
      return ['Used', 'Salvage', 'Excellent', 'Good', 'Fair'];
    }
  }

  async getVehicleDamageTypes(): Promise<string[]> {
    try {
      console.log('Loading vehicle damage types from /api/Car endpoint...');
      const cars = await this.request<any[]>('/api/Car');
      const damageTypes = [...new Set(cars.map(car => car.damageType).filter(Boolean))] as string[];
      console.log('Loaded damage types:', damageTypes);
      return damageTypes;
    } catch (error) {
      console.error('Error loading vehicle damage types:', error);
      return ['None', 'Front End', 'Rear End', 'Side', 'All Over', 'Water/Flood', 'Hail', 'Vandalism'];
    }
  }

  async getVehicleTypes(): Promise<string[]> {
    try {
      console.log('Loading vehicle types from /api/Car endpoint...');
      const cars = await this.request<any[]>('/api/Car');
      const types = [...new Set(cars.map(car => car.type).filter(Boolean))] as string[];
      console.log('Loaded vehicle types:', types);
      return types;
    } catch (error) {
      console.error('Error loading vehicle types:', error);
      return ['Sedan', 'SUV', 'Truck', 'Coupe', 'Convertible', 'Hatchback', 'Wagon'];
    }
  }

  async getVehicleColors(): Promise<string[]> {
    try {
      console.log('Loading vehicle colors from /api/Car endpoint...');
      const cars = await this.request<any[]>('/api/Car');
      const colors = [...new Set(cars.map(car => car.color).filter(Boolean))] as string[];
      console.log('Loaded vehicle colors:', colors);
      return colors;
    } catch (error) {
      console.error('Error loading vehicle colors:', error);
      return ['White', 'Black', 'Silver', 'Gray', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Brown', 'Gold', 'Purple'];
    }
  }

  // Sales List specific methods - using Auction endpoints
  async getSalesList(): Promise<any[]> {
    try {
      const auctions = await this.request<AuctionGetDto[]>('/api/Auction');
      const locations = await this.request<any[]>('/api/Location');
      
      // Transform auction data to sales list format
      return auctions.map(auction => {
        const location = locations.find(loc => loc.id === auction.locationId);
        
        return {
          id: auction.id,
          saleTime: auction.startTimeUtc,
          saleName: `${auction.name || 'Auction'} - ${location?.name || location?.city || 'Location TBD'}`,
          region: this.getRegionFromLocation(location?.name || location?.city || 'Unknown'),
          saleType: this.getSaleTypeFromAuction(auction),
          saleHighlights: this.generateSaleHighlights(auction),
          currentSale: auction.startTimeUtc,
          nextSale: auction.endTimeUtc,
          futureSaleStatus: this.getFutureSaleStatus(auction),
          location: location?.name || location?.city || 'Location TBD',
          totalCars: auction.totalCarsCount || 0,
          soldCars: auction.soldCarsCount || 0,
          totalRevenue: auction.totalRevenue || 0,
          isLive: auction.status === 'Live'
        };
      });
    } catch (error) {
      console.error('Error loading sales list:', error);
      return [];
    }
  }

  async getSaleTypes(): Promise<any[]> {
    // Since there's no dedicated sale types endpoint, return common types
    return [
      { id: 'copart-us', name: 'Copart US', description: 'Copart US auctions' },
      { id: 'dealer', name: 'Dealer', description: 'Dealer auctions' },
      { id: 'bank', name: 'Bank', description: 'Bank repo auctions' },
      { id: 'insurance', name: 'Insurance', description: 'Insurance auctions' },
      { id: 'government', name: 'Government', description: 'Government auctions' },
      { id: 'fleet', name: 'Fleet', description: 'Fleet auctions' }
    ];
  }

  // Get only live auctions
  async getLiveSalesList(): Promise<any[]> {
    try {
      console.log('Loading live auctions...');
      const liveAuctions = await this.request<AuctionGetDto[]>('/api/Auction/live');
      const locations = await this.request<any[]>('/api/Location');
      
      return liveAuctions.map(auction => {
        const location = locations.find(loc => loc.id === auction.locationId);
        
        return {
          id: auction.id,
          saleTime: auction.startTimeUtc,
          saleName: `${auction.name || 'Auction'} - ${location?.name || location?.city || 'Location TBD'}`,
          region: this.getRegionFromLocation(location?.name || location?.city || 'Unknown'),
          saleType: this.getSaleTypeFromAuction(auction),
          saleHighlights: this.generateSaleHighlights(auction),
          currentSale: auction.startTimeUtc,
          nextSale: auction.endTimeUtc,
          futureSaleStatus: 'Live' as const,
          location: location?.name || location?.city || 'Location TBD',
          totalCars: auction.totalCarsCount || 0,
          soldCars: auction.soldCarsCount || 0,
          totalRevenue: auction.totalRevenue || 0,
          isLive: true,
          status: auction.status || 'Live',
          startTimeUtc: auction.startTimeUtc,
          endTimeUtc: auction.endTimeUtc
        };
      });
    } catch (error) {
      console.error('Error loading live auctions:', error);
      return [];
    }
  }

  // Get upcoming auctions (not live and not completed)
  async getUpcomingSalesList(): Promise<any[]> {
    try {
      console.log('Loading upcoming auctions...');
      const allAuctions = await this.request<AuctionGetDto[]>('/api/Auction');
      const locations = await this.request<any[]>('/api/Location');
      
      // Filter for upcoming auctions (not live and start time in future)
      const now = new Date();
      const upcomingAuctions = allAuctions.filter(auction => {
        const startTime = new Date(auction.startTimeUtc);
        return !auction.isLive && startTime > now;
      });
      
      return upcomingAuctions.map(auction => {
        const location = locations.find(loc => loc.id === auction.locationId);
        
        return {
          id: auction.id,
          saleTime: auction.startTimeUtc,
          saleName: `${auction.name || 'Auction'} - ${location?.name || location?.city || 'Location TBD'}`,
          region: this.getRegionFromLocation(location?.name || location?.city || 'Unknown'),
          saleType: this.getSaleTypeFromAuction(auction),
          saleHighlights: this.generateSaleHighlights(auction),
          currentSale: auction.startTimeUtc,
          nextSale: auction.endTimeUtc,
          futureSaleStatus: 'Upcoming' as const,
          location: location?.name || location?.city || 'Location TBD',
          totalCars: auction.totalCarsCount || 0,
          soldCars: auction.soldCarsCount || 0,
          totalRevenue: auction.totalRevenue || 0,
          isLive: false,
          status: auction.status || 'Upcoming',
          startTimeUtc: auction.startTimeUtc,
          endTimeUtc: auction.endTimeUtc
        };
      });
    } catch (error) {
      console.error('Error loading upcoming auctions:', error);
      return [];
    }
  }

  async getRegions(): Promise<string[]> {
    try {
      const locations = await this.request<any[]>('/api/Location');
      const regions = locations.map(location => 
        this.getRegionFromLocation(location.name || location.city)
      );
      return [...new Set(regions)];
    } catch (error) {
      console.error('Error loading regions:', error);
      return ['North America', 'Europe', 'Asia', 'South America', 'Australia'];
    }
  }

  // Watchlist methods - using API endpoints

  async removeFromWatchlist(vehicleId: string): Promise<void> {
    try {
      await this.request(`/api/Watchlist/${vehicleId}`, {
        method: 'DELETE'
      });
      console.log(`Vehicle ${vehicleId} removed from watchlist`);
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      throw error;
    }
  }

  async addToWatchlist(vehicleId: string): Promise<void> {
    try {
      await this.request('/api/Watchlist', {
        method: 'POST',
        body: JSON.stringify({ auctionCarId: vehicleId })
      });
      console.log(`Vehicle ${vehicleId} added to watchlist`);
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      throw error;
    }
  }

  async getWatchlist(): Promise<any[]> {
    try {
      const watchlist = await this.request<any[]>('/api/Watchlist');
      console.log('Watchlist loaded:', watchlist);
      return watchlist;
    } catch (error) {
      console.error('Error loading watchlist:', error);
      return [];
    }
  }

  async isInWatchlist(vehicleId: string): Promise<boolean> {
    try {
      const result = await this.request<{ isWatching: boolean }>(`/api/Watchlist/check/${vehicleId}`);
      return result.isWatching;
    } catch (error) {
      console.error('Error checking watchlist status:', error);
      return false;
    }
  }

  // Helper methods
  private getRegionFromLocation(location: string): string {
    const locationMap: { [key: string]: string } = {
      'New York': 'North America',
      'Los Angeles': 'North America',
      'Chicago': 'North America',
      'Houston': 'North America',
      'Phoenix': 'North America',
      'Miami': 'North America',
      'Dallas': 'North America',
      'Atlanta': 'North America',
      'Denver': 'North America',
      'Seattle': 'North America',
      'London': 'Europe',
      'Paris': 'Europe',
      'Berlin': 'Europe',
      'Madrid': 'Europe',
      'Rome': 'Europe',
      'Amsterdam': 'Europe',
      'Vienna': 'Europe',
      'Zurich': 'Europe',
      'Tokyo': 'Asia',
      'Seoul': 'Asia',
      'Shanghai': 'Asia',
      'Hong Kong': 'Asia',
      'Singapore': 'Asia',
      'Bangkok': 'Asia',
      'Mumbai': 'Asia',
      'Dubai': 'Asia',
      'Sydney': 'Australia',
      'Melbourne': 'Australia',
      'São Paulo': 'South America'
    };
    return locationMap[location] || 'North America';
  }

  private getSaleTypeFromAuction(_auction: any): string {
    const types = ['Copart US', 'Dealer', 'Bank', 'Insurance', 'Government', 'Fleet'];
    return types[Math.floor(Math.random() * types.length)];
  }

  private generateSaleHighlights(_auction: any): string[] {
    const allHighlights = [
      'Premium Collection', 'Classic Cars', 'No Reserve', 'Luxury Vehicles', 'Low Mileage Vehicles',
      'Exotic Cars', 'Total Loss Vehicles', 'Flood Cars', 'Accident Vehicles', 'Government Vehicles',
      'Fleet Maintenance', 'Well Maintained', 'European Classics', 'Rare Models', 'Restored Vehicles',
      'Vintage Motorcycles', 'Classic Bikes', 'Japanese Imports', 'Right Hand Drive', 'Commercial Fleet',
      'Low Starting Prices', 'Fleet Vehicles', 'High Mileage', 'Regular Maintenance', 'Supercars', 'Limited Edition'
    ];
    const numHighlights = Math.floor(Math.random() * 3) + 2;
    const shuffled = allHighlights.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, numHighlights);
  }

  private getFutureSaleStatus(auction: any): string {
    const now = new Date();
    const startTime = new Date(auction.startTimeUtc);
    const endTime = new Date(auction.endTimeUtc);
    
    if (now < startTime) return 'Upcoming';
    if (now > endTime) return 'Completed';
    return 'Live';
  }
}

export const apiClient = new ApiClient();