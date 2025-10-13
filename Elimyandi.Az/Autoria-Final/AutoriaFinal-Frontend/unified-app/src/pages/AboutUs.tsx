import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Car, 
  Users, 
  Shield, 
  Award, 
  CheckCircle, 
  Clock, 
  Phone, 
  Mail,
  MapPin,
  Star,
  TrendingUp,
  Zap,
  Heart
} from 'lucide-react';

export default function AboutUs() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          {/* Animated Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-indigo-900/80 to-slate-900/90"></div>
          
          {/* Floating Orbs */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-40">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='0.03'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundRepeat: 'repeat'
            }} />
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
                  Avtomobilinizin{' '}
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Növbəti Hekayəsi
                  </span>{' '}
                  Buradan Başlayır
                </h1>
                
                <p className="text-xl text-slate-300 leading-relaxed max-w-2xl">
                  <span className="font-semibold text-blue-200">Sürətli.</span>{' '}
                  <span className="font-semibold text-purple-200">Şəffaf.</span>{' '}
                  <span className="font-semibold text-green-200">Maksimum Dəyər.</span>
                </p>
                
                <p className="text-lg text-slate-400 leading-relaxed">
                  Əlimyandı.az-da avtomobilinizi satmağın ən müasir və etibarlı yolunu kəşf edin. 
                  Minlərlə qeydiyyatlı alıcı və peşəkar dəstək komandamızla maksimum dəyər əldə edin.
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400">15K+</div>
                  <div className="text-sm text-slate-400">Qeydiyyatlı Alıcı</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400">98%</div>
                  <div className="text-sm text-slate-400">Müştəri Məmnuniyyəti</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">24h</div>
                  <div className="text-sm text-slate-400">Orta Satış Müddəti</div>
                </div>
              </div>
            </div>

            {/* Right Content - Company Info Card */}
            <div className="relative">
              {/* Glassmorphism Card */}
              <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-xl opacity-75"></div>
                
                <div className="relative z-10">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-white mb-2">Bizimlə Əlaqə</h3>
                    <p className="text-slate-300">Avtomobil satışında etibarlı tərəfdaşınız</p>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-3">
                        <Phone className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">Telefon</h4>
                        <p className="text-slate-300">+994 12 XXX XX XX</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-full p-3">
                        <Mail className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">Email</h4>
                        <p className="text-slate-300">info@elimyandi.az</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-full p-3">
                        <MapPin className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">Ünvan</h4>
                        <p className="text-slate-300">Bakı şəhəri, Nəsimi rayonu</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-600/50">
                      <p className="text-slate-300 text-sm text-center">
                        Avtomobilinizi satmaq istəyirsiniz? Bizimlə əlaqə saxlayın və 
                        pulsuz qiymətləndirmə alın.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Steps Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-slate-800/50"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Üç Asan Addımda{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Satış Prosesi
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Avtomobilinizi satmaq heç vaxt bu qədər asan olmamışdı. Sadəcə üç addımda maksimum dəyər əldə edin.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative group">
              <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 h-full transition-all duration-500 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-75 transition-all duration-500"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-full p-4">
                      <Car className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-6xl font-bold text-blue-500/20">01</div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-4">Avtomobilinizi Təqdim Edin</h3>
                  <p className="text-slate-300 leading-relaxed mb-6">
                    Pulsuz ilkin qiymətləndirmə üçün avtomobilinizin məlumatlarını daxil edin. 
                    Mütəxəssislərimiz 24 saat ərzində sizinlə əlaqə saxlayacaq.
                  </p>
                  
                  <div className="flex items-center text-blue-400 font-medium">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Pulsuz qiymətləndirmə
                  </div>
                </div>
              </div>
              
              {/* Connection Line */}
              <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform -translate-y-1/2"></div>
            </div>

            {/* Step 2 */}
            <div className="relative group">
              <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 h-full transition-all duration-500 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/10">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-75 transition-all duration-500"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-full p-4">
                      <TrendingUp className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-6xl font-bold text-purple-500/20">02</div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-4">Hərraca Çıxın</h3>
                  <p className="text-slate-300 leading-relaxed mb-6">
                    Mütəxəssislərimiz avtomobilinizi yoxlayır və onu minlərlə alıcının iştirak etdiyi 
                    gündəlik hərraclarımıza yerləşdirir.
                  </p>
                  
                  <div className="flex items-center text-purple-400 font-medium">
                    <Users className="h-5 w-5 mr-2" />
                    15,000+ aktiv alıcı
                  </div>
                </div>
              </div>
              
              {/* Connection Line */}
              <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-purple-500 to-green-500 transform -translate-y-1/2"></div>
            </div>

            {/* Step 3 */}
            <div className="relative group">
              <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 h-full transition-all duration-500 hover:border-green-500/50 hover:shadow-2xl hover:shadow-green-500/10">
                <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-75 transition-all duration-500"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-full p-4">
                      <Shield className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-6xl font-bold text-green-500/20">03</div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-4">Ödənişinizi Təhlükəsiz Alın</h3>
                  <p className="text-slate-300 leading-relaxed mb-6">
                    Satış tamamlanan kimi ödənişiniz zəmanət altında və təhlükəsiz şəkildə 
                    hesabınıza köçürülür.
                  </p>
                  
                  <div className="flex items-center text-green-400 font-medium">
                    <Shield className="h-5 w-5 mr-2" />
                    100% təhlükəsiz ödəniş
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-800/50 to-slate-900/50"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Niyə{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Əlimyandı.az?
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Avtomobil satışında lider platformamızın üstünlükləri və fərqləndirici xüsusiyyətləri
            </p>
          </div>

          <div className="grid lg:grid-cols-2 xl:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="group">
              <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 h-full transition-all duration-500 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 hover:transform hover:-translate-y-2">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-75 transition-all duration-500"></div>
                
                <div className="relative z-10">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full p-4 w-fit mb-6">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-2">Minlərlə Alıcı</h3>
                  <h4 className="text-lg font-semibold text-blue-400 mb-4">Bütün Ölkə Üzrə Şəbəkə</h4>
                  <p className="text-slate-300 leading-relaxed">
                    Avtomobiliniz, rəqabətli təkliflər təmin edən geniş qeydiyyatlı diler və 
                    fərdi alıcı şəbəkəmizə təqdim olunur.
                  </p>
                  
                  <div className="mt-6 flex items-center text-blue-400 font-medium">
                    <Star className="h-5 w-5 mr-2" />
                    15,000+ aktiv üzv
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group">
              <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 h-full transition-all duration-500 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/10 hover:transform hover:-translate-y-2">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-75 transition-all duration-500"></div>
                
                <div className="relative z-10">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-4 w-fit mb-6">
                    <Car className="h-8 w-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-2">İstənilən Vəziyyətdə</h3>
                  <h4 className="text-lg font-semibold text-purple-400 mb-4">Klassikdən Qəzalıya Qədər</h4>
                  <p className="text-slate-300 leading-relaxed">
                    İstər yeni, istər köhnə, istərsə də qəzalı olsun, hər növ avtomobili 
                    dəyərləndiririk və uyğun alıcı tapırıq.
                  </p>
                  
                  <div className="mt-6 flex items-center text-purple-400 font-medium">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Bütün növlər qəbul edilir
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group">
              <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 h-full transition-all duration-500 hover:border-green-500/50 hover:shadow-2xl hover:shadow-green-500/10 hover:transform hover:-translate-y-2">
                <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-75 transition-all duration-500"></div>
                
                <div className="relative z-10">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-full p-4 w-fit mb-6">
                    <Zap className="h-8 w-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-2">Hər Şeyi Həll Edirik</h3>
                  <h4 className="text-lg font-semibold text-green-400 mb-4">Sənədləşmə Daxil</h4>
                  <p className="text-slate-300 leading-relaxed">
                    Texniki baxışdan sənədlərin təhvil verilməsinə qədər bütün prosesi 
                    mütəxəssislərimiz idarə edir.
                  </p>
                  
                  <div className="mt-6 flex items-center text-green-400 font-medium">
                    <Shield className="h-5 w-5 mr-2" />
                    Tam xidmət paketi
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group">
              <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 h-full transition-all duration-500 hover:border-orange-500/50 hover:shadow-2xl hover:shadow-orange-500/10 hover:transform hover:-translate-y-2">
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-75 transition-all duration-500"></div>
                
                <div className="relative z-10">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-full p-4 w-fit mb-6">
                    <Heart className="h-8 w-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-2">A+ Səviyyəli</h3>
                  <h4 className="text-lg font-semibold text-orange-400 mb-4">Fərdi Dəstək Xidməti</h4>
                  <p className="text-slate-300 leading-relaxed">
                    Müştəri xidmətləri komandamız bütün proses boyunca sizə yol göstərməyə 
                    və dəstək verməyə hazırdır.
                  </p>
                  
                  <div className="mt-6 flex items-center text-orange-400 font-medium">
                    <Award className="h-5 w-5 mr-2" />
                    24/7 dəstək xidməti
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Service Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-slate-800/50"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Müştəri{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Xidmətləri
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Hər zaman yanınızdayıq. Suallarınız və dəstək ehtiyaclarınız üçün bizə müraciət edin.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 lg:p-12">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-xl opacity-75"></div>
              
              <div className="relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  {/* Left Content */}
                  <div className="space-y-8">
                    <div className="space-y-6">
                      <div className="flex items-center space-x-4">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-3">
                          <Clock className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">İş Saatları</h3>
                          <p className="text-slate-300">Bazar ertəsi - Cümə: 09:00 - 18:00</p>
                          <p className="text-slate-300">Şənbə: 10:00 - 16:00</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-full p-3">
                          <Phone className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">Telefon</h3>
                          <p className="text-slate-300">+994 12 XXX XX XX</p>
                          <p className="text-slate-300">+994 50 XXX XX XX</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-full p-3">
                          <Mail className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">Email</h3>
                          <p className="text-slate-300">info@elimyandi.az</p>
                          <p className="text-slate-300">support@elimyandi.az</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-full p-3">
                          <MapPin className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">Ünvan</h3>
                          <p className="text-slate-300">Bakı şəhəri, Nəsimi rayonu</p>
                          <p className="text-slate-300">Azadlıq prospekti 123</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Content - Abstract Graphic */}
                  <div className="relative">
                    <div className="relative w-full h-80 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl overflow-hidden">
                      {/* Abstract Elements */}
                      <div className="absolute top-4 left-4 w-16 h-16 bg-blue-500/30 rounded-full blur-sm"></div>
                      <div className="absolute top-12 right-8 w-12 h-12 bg-purple-500/40 rounded-full blur-sm"></div>
                      <div className="absolute bottom-8 left-8 w-20 h-20 bg-green-500/25 rounded-full blur-sm"></div>
                      <div className="absolute bottom-4 right-4 w-14 h-14 bg-orange-500/35 rounded-full blur-sm"></div>
                      
                      {/* Center Icon */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-8 shadow-2xl">
                          <Phone className="h-12 w-12 text-white" />
                        </div>
                      </div>
                      
                      {/* Connecting Lines */}
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 320">
                        <defs>
                          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.3" />
                          </linearGradient>
                        </defs>
                        <path d="M50 50 Q160 80 270 50" stroke="url(#lineGradient)" strokeWidth="2" fill="none" />
                        <path d="M50 270 Q160 240 270 270" stroke="url(#lineGradient)" strokeWidth="2" fill="none" />
                        <path d="M50 50 Q80 160 50 270" stroke="url(#lineGradient)" strokeWidth="2" fill="none" />
                        <path d="M270 50 Q240 160 270 270" stroke="url(#lineGradient)" strokeWidth="2" fill="none" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
