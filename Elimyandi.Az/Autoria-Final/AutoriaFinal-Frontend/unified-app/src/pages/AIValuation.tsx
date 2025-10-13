import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Car, 
  ArrowRight, 
  Loader2,
  AlertCircle,
  Sparkles,
  TrendingUp as TrendingUpIcon,
  BrainCircuit,
  Cpu,
  FileText,
  BarChart,
  CheckCircle,
  Zap,
  RotateCcw,
  Search
} from 'lucide-react';

// Types for VehicleDetailsDto and VehiclePriceEstimate
interface VehicleDetailsDto {
  make: string;
  model: string;
  year: number;
  mileage: number;
  conditionDescription: string;
  damageDescription: string;
}

interface VehiclePriceEstimate {
  estimatedAveragePrice: number;
  minPrice: number;
  maxPrice: number;
  analysisSummary: string;
  confidence: number;
  marketTrend: string;
}

export default function AIValuation() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    mileage: '',
    conditionDescription: '',
    damageDescription: ''
  });

  // State management for API integration
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [estimateResult, setEstimateResult] = useState<VehiclePriceEstimate | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Utility function to format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('az-AZ', {
      style: 'currency',
      currency: 'AZN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset states
    setIsLoading(true);
    setError(null);
    setEstimateResult(null);

    try {
      // Prepare VehicleDetailsDto
      const vehicleDetails: VehicleDetailsDto = {
        make: formData.make,
        model: formData.model,
        year: parseInt(formData.year),
        mileage: parseInt(formData.mileage),
        conditionDescription: formData.conditionDescription,
        damageDescription: formData.damageDescription
      };

      // Call the valuation API endpoint
      const response = await fetch('https://localhost:7249/api/Valuation/estimate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify(vehicleDetails)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Network error occurred' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result: VehiclePriceEstimate = await response.json();
      setEstimateResult(result);
    } catch (err: any) {
      console.error('Valuation API error:', err);
      setError(err.message || 'Qiymətləndirmə zamanı xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEstimateResult(null);
    setError(null);
    setFormData({
      make: '',
      model: '',
      year: '',
      mileage: '',
      conditionDescription: '',
      damageDescription: ''
    });
  };

  // Determine current state
  const currentState = isLoading ? 'loading' : estimateResult ? 'result' : 'input';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
      {/* Background Elements */}
      <div className="absolute inset-0">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-indigo-900/80 to-slate-900/90"></div>
        
        {/* Neural Network Pattern */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="neuralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            
            {/* Neural Network Nodes */}
            <circle cx="200" cy="200" r="3" fill="url(#neuralGradient)" className="animate-pulse">
              <animate attributeName="r" values="3;6;3" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="400" cy="150" r="3" fill="url(#neuralGradient)" className="animate-pulse">
              <animate attributeName="r" values="3;6;3" dur="3.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="600" cy="250" r="3" fill="url(#neuralGradient)" className="animate-pulse">
              <animate attributeName="r" values="3;6;3" dur="2.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="800" cy="180" r="3" fill="url(#neuralGradient)" className="animate-pulse">
              <animate attributeName="r" values="3;6;3" dur="4s" repeatCount="indefinite" />
            </circle>
            
            {/* Neural Network Connections */}
            <path d="M200,200 Q300,175 400,150" stroke="url(#neuralGradient)" strokeWidth="1" fill="none" opacity="0.6">
              <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
            </path>
            <path d="M400,150 Q500,200 600,250" stroke="url(#neuralGradient)" strokeWidth="1" fill="none" opacity="0.6">
              <animate attributeName="opacity" values="0.6;1;0.6" dur="2.5s" repeatCount="indefinite" />
            </path>
            <path d="M600,250 Q700,215 800,180" stroke="url(#neuralGradient)" strokeWidth="1" fill="none" opacity="0.6">
              <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" />
            </path>
          </svg>
        </div>
        
        {/* Floating Data Particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400/60 rounded-full animate-ping"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-purple-400/80 rounded-full animate-ping delay-1000"></div>
        <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-cyan-400/70 rounded-full animate-ping delay-2000"></div>
        <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-blue-400/50 rounded-full animate-ping delay-3000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section - Always Visible */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6 shadow-2xl">
            <BrainCircuit className="h-10 w-10 text-white animate-pulse" />
          </div>
          <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6">
            AI ilə{' '}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent animate-pulse">
              Dəqiq Qiymətləndirmə
            </span>
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Süni intellekt texnologiyası ilə avtomobilinizin dəyərini saniyələr içində müəyyən edin. 
            Milyonlarla məlumat nöqtəsini analiz edərək ən dəqiq qiyməti təqdim edirik.
          </p>
        </div>

        {/* STATE 1: INPUT STATE - Default State */}
        {currentState === 'input' && (
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left Side - How It Works */}
            <div className="space-y-12">
              <div className="space-y-8">
                <h2 className="text-3xl font-bold text-white mb-8">
                  Necə{' '}
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    İşləyir?
                  </span>
                </h2>
                
                {/* Step 1 */}
                <div className="flex items-start space-x-6 group">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300">
                      <FileText className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-3">1. Məlumatları Daxil Edin</h3>
                    <p className="text-slate-300 leading-relaxed">
                      Avtomobilinizin marka, model, il, kilometraj və vəziyyəti haqqında məlumatları daxil edin. 
                      Nə qədər çox məlumat verəsiniz, o qədər dəqiq nəticə alacaqsınız.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start space-x-6 group">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-purple-500/25 transition-all duration-300">
                      <BrainCircuit className="h-8 w-8 text-white animate-pulse" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-3">2. AI Analiz Edir</h3>
                    <p className="text-slate-300 leading-relaxed">
                      Süni intellekt sistemimiz milyonlarla avtomobil məlumatını, bazar tendensiyalarını və 
                      müxtəlif amilləri analiz edərək dəqiq qiymətləndirmə aparır.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start space-x-6 group">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-green-500/25 transition-all duration-300">
                      <BarChart className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-3">3. Nəticəni Anında Əldə Edin</h3>
                    <p className="text-slate-300 leading-relaxed">
                      Analiz tamamlandıqdan sonra avtomobilinizin orta, minimum və maksimum qiymət aralığını, 
                      həmçinin ətraflı təhlil hesabatını alacaqsınız.
                    </p>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white mb-6">AI Texnologiyasının Üstünlükləri</h3>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center space-x-4">
                    <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
                    <span className="text-slate-300">Milyonlarla məlumat nöqtəsinin analizi</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
                    <span className="text-slate-300">Real vaxt bazar tendensiyaları</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
                    <span className="text-slate-300">95%+ dəqiqlik dərəcəsi</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
                    <span className="text-slate-300">Saniyələr içində nəticə</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Interactive Form */}
            <div className="relative">
              {/* Form Container */}
              <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-xl opacity-75"></div>
                
                <div className="relative z-10">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
                      <Zap className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">AI Qiymətləndirmə</h3>
                    <p className="text-slate-300">Avtomobilinizin dəyərini dərhal öyrənin</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <select
                          name="make"
                          value={formData.make}
                          onChange={handleInputChange}
                          className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 appearance-none"
                          required
                        >
                          <option value="">Marka seçin</option>
                          <option value="BMW">BMW</option>
                          <option value="Mercedes">Mercedes</option>
                          <option value="Audi">Audi</option>
                          <option value="Toyota">Toyota</option>
                          <option value="Hyundai">Hyundai</option>
                          <option value="Nissan">Nissan</option>
                          <option value="Honda">Honda</option>
                          <option value="Ford">Ford</option>
                          <option value="Chevrolet">Chevrolet</option>
                          <option value="Volkswagen">Volkswagen</option>
                        </select>
                      </div>
                      
                      <div className="relative">
                        <input
                          type="text"
                          name="model"
                          value={formData.model}
                          onChange={handleInputChange}
                          className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300"
                          placeholder="Model adı"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <select
                          name="year"
                          value={formData.year}
                          onChange={handleInputChange}
                          className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 appearance-none"
                          required
                        >
                          <option value="">İl seçin</option>
                          {Array.from({ length: 25 }, (_, i) => 2024 - i).map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="relative">
                        <input
                          type="number"
                          name="mileage"
                          value={formData.mileage}
                          onChange={handleInputChange}
                          className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300"
                          placeholder="Kilometraj (km)"
                          required
                        />
                      </div>
                    </div>

                    <div className="relative">
                      <select
                        name="conditionDescription"
                        value={formData.conditionDescription}
                        onChange={handleInputChange}
                        className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 appearance-none"
                        required
                      >
                        <option value="">Vəziyyət seçin</option>
                        <option value="Əla vəziyyətdə - yeni kimi">Əla vəziyyətdə - yeni kimi</option>
                        <option value="Yaxşı vəziyyətdə - az istifadə edilmiş">Yaxşı vəziyyətdə - az istifadə edilmiş</option>
                        <option value="Orta vəziyyətdə - normal istifadə izləri">Orta vəziyyətdə - normal istifadə izləri</option>
                        <option value="Zəif vəziyyətdə - çox istifadə edilmiş">Zəif vəziyyətdə - çox istifadə edilmiş</option>
                        <option value="Qəzalı vəziyyətdə - təmir tələb edir">Qəzalı vəziyyətdə - təmir tələb edir</option>
                      </select>
                    </div>

                    <div className="relative">
                      <textarea
                        name="damageDescription"
                        value={formData.damageDescription}
                        onChange={handleInputChange}
                        className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 resize-none"
                        placeholder="Varsa, avtomobilinizdəki zədələri qısa şəkildə təsvir edin..."
                        rows={3}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-500/25 flex items-center justify-center space-x-2 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
                    >
                      <Sparkles className="h-5 w-5 group-hover:animate-pulse" />
                      <span>AI ilə Qiymətləndir</span>
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STATE 2: LOADING STATE - AI Thinking Animation */}
        {currentState === 'loading' && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-8">
              {/* Central Brain Icon */}
              <div className="relative">
                <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-2xl animate-pulse">
                  <BrainCircuit className="h-16 w-16 text-white" />
                </div>
                
                {/* Data Flow Animation */}
                <div className="absolute inset-0">
                  <div className="absolute top-0 left-1/2 w-3 h-3 bg-blue-400 rounded-full animate-ping"></div>
                  <div className="absolute top-1/4 left-0 w-2 h-2 bg-purple-400 rounded-full animate-ping delay-500"></div>
                  <div className="absolute top-1/4 right-0 w-2 h-2 bg-cyan-400 rounded-full animate-ping delay-1000"></div>
                  <div className="absolute bottom-1/4 left-1/4 w-2.5 h-2.5 bg-blue-400 rounded-full animate-ping delay-1500"></div>
                  <div className="absolute bottom-1/4 right-1/4 w-2.5 h-2.5 bg-purple-400 rounded-full animate-ping delay-2000"></div>
                  <div className="absolute bottom-0 left-1/2 w-3 h-3 bg-cyan-400 rounded-full animate-ping delay-2500"></div>
                </div>
              </div>
              
              {/* Thinking Text */}
              <div className="space-y-4">
                <h3 className="text-3xl font-bold text-white">AI Düşünür...</h3>
                <p className="text-slate-300 text-xl">
                  Avtomobiliniz üçün ən yaxşı qiymət analiz edilir
                  <span className="inline-block animate-pulse">...</span>
                </p>
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STATE 3: RESULT STATE - Modern Compact Result Card */}
        {currentState === 'result' && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-full max-w-4xl">
              {/* Modern Result Card */}
              <div className="relative bg-slate-800/60 backdrop-blur-xl border border-green-500/30 rounded-3xl p-8 shadow-2xl">
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-3xl blur-xl opacity-75"></div>
                
                <div className="relative z-10">
                  {/* Header */}
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mb-4">
                      <Sparkles className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-2">AI Qiymətləndirmə Nəticəsi</h3>
                    <p className="text-slate-300">Google Gemini AI tərəfindən hesablanmış dəyər</p>
                  </div>

                  {/* Main Price Display - Hero Section */}
                  <div className="text-center mb-8">
                    <div className="text-6xl font-bold text-green-400 mb-4">
                      {formatCurrency(estimateResult!.estimatedAveragePrice)}
                    </div>
                    <div className="text-xl text-slate-300 mb-6">Orta Qiymət</div>
                    
                    {/* Secondary Prices */}
                    <div className="flex justify-center space-x-8 mb-8">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400 mb-1">
                          {formatCurrency(estimateResult!.minPrice)}
                        </div>
                        <div className="text-sm text-slate-400">Minimum</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400 mb-1">
                          {formatCurrency(estimateResult!.maxPrice)}
                        </div>
                        <div className="text-sm text-slate-400">Maksimum</div>
                      </div>
                    </div>
                  </div>

                  {/* AI Analysis */}
                  <div className="mb-8">
                    <h4 className="text-xl font-semibold text-white mb-4 flex items-center justify-center">
                      <TrendingUpIcon className="h-6 w-6 mr-2 text-blue-400" />
                      AI Təhlili
                    </h4>
                    <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/30">
                      <p className="text-slate-300 leading-relaxed mb-4 text-center">
                        {estimateResult!.analysisSummary}
                      </p>
                      <div className="flex items-center justify-center space-x-8 text-sm">
                        <span className="text-slate-400">
                          Etibar dərəcəsi: {estimateResult!.confidence}%
                        </span>
                        <span className="text-slate-400">
                          Bazar tendensiyası: {estimateResult!.marketTrend}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    {/* Reset Button */}
                    <button
                      onClick={resetForm}
                      className="px-6 py-3 bg-transparent border border-slate-600 text-slate-300 rounded-xl hover:bg-slate-700/50 hover:border-slate-500 transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                      <RotateCcw className="h-5 w-5" />
                      <span>Yenidən Soruş</span>
                    </button>

                    {/* View Vehicles Button */}
                    <Link
                      to="/vehicle-finder"
                      className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-500/25 flex items-center justify-center space-x-2"
                    >
                      <Search className="h-5 w-5" />
                      <span>View Vehicles</span>
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-full max-w-2xl">
              <div className="relative bg-slate-800/60 backdrop-blur-xl border border-red-500/30 rounded-3xl p-8 shadow-2xl">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-3xl blur-xl opacity-75"></div>
                
                <div className="relative z-10 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Xəta Baş Verdi</h3>
                  <p className="text-slate-300 mb-8">{error}</p>
                  <button
                    onClick={resetForm}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-500/25 flex items-center justify-center space-x-2 mx-auto"
                  >
                    <RotateCcw className="h-5 w-5" />
                    <span>Yenidən Cəhd Et</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}