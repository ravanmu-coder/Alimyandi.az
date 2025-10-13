// Car brands data for the wizard
export interface CarBrand {
  id: string;
  name: string;
  logo: string;
  models: string[];
}

export const carBrands: CarBrand[] = [
  {
    id: 'mercedes',
    name: 'Mercedes-Benz',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Mercedes-Logo.svg/1200px-Mercedes-Logo.svg.png',
    models: ['C-Class', 'E-Class', 'S-Class', 'A-Class', 'G-Class', 'GLC', 'GLE', 'GLS', 'CLA', 'CLS', 'AMG GT', 'Sprinter']
  },
  {
    id: 'bmw',
    name: 'BMW',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/BMW.svg/1200px-BMW.svg.png',
    models: ['3 Series', '5 Series', '7 Series', 'X1', 'X3', 'X5', 'X7', 'Z4', 'i3', 'i8', 'M3', 'M5']
  },
  {
    id: 'audi',
    name: 'Audi',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Audi-Logo_2016.svg/1200px-Audi-Logo_2016.svg.png',
    models: ['A3', 'A4', 'A6', 'A8', 'Q3', 'Q5', 'Q7', 'Q8', 'TT', 'R8', 'e-tron', 'RS6']
  },
  {
    id: 'toyota',
    name: 'Toyota',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Toyota_logo_%28v%29.svg/1200px-Toyota_logo_%28v%29.svg.png',
    models: ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Prius', 'Avalon', 'Sienna', 'Tacoma', 'Tundra', '4Runner', 'Land Cruiser', 'Yaris']
  },
  {
    id: 'honda',
    name: 'Honda',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Honda_Logo.svg/1200px-Honda_Logo.svg.png',
    models: ['Civic', 'Accord', 'CR-V', 'Pilot', 'HR-V', 'Passport', 'Ridgeline', 'Insight', 'Fit', 'Odyssey', 'Element', 'S2000']
  },
  {
    id: 'ford',
    name: 'Ford',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Ford_logo_flat.svg/1200px-Ford_logo_flat.svg.png',
    models: ['F-150', 'Mustang', 'Explorer', 'Escape', 'Edge', 'Expedition', 'Bronco', 'Focus', 'Fusion', 'Ranger', 'Transit', 'EcoSport']
  },
  {
    id: 'chevrolet',
    name: 'Chevrolet',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Chevrolet_logo.svg/1200px-Chevrolet_logo.svg.png',
    models: ['Silverado', 'Equinox', 'Malibu', 'Traverse', 'Tahoe', 'Suburban', 'Camaro', 'Corvette', 'Cruze', 'Sonic', 'Spark', 'Blazer']
  },
  {
    id: 'nissan',
    name: 'Nissan',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Nissan_logo.svg/1200px-Nissan_logo.svg.png',
    models: ['Altima', 'Sentra', 'Rogue', 'Murano', 'Pathfinder', 'Armada', 'Frontier', 'Titan', '370Z', 'GT-R', 'Leaf', 'Versa']
  },
  {
    id: 'hyundai',
    name: 'Hyundai',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Hyundai_logo.svg/1200px-Hyundai_logo.svg.png',
    models: ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Palisade', 'Kona', 'Veloster', 'Genesis', 'Accent', 'Venue', 'Ioniq', 'Nexo']
  },
  {
    id: 'kia',
    name: 'Kia',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Kia_logo.svg/1200px-Kia_logo.svg.png',
    models: ['Forte', 'Optima', 'Sorento', 'Sportage', 'Telluride', 'Soul', 'Stinger', 'Niro', 'Cadenza', 'Sedona', 'Rio', 'EV6']
  },
  {
    id: 'volkswagen',
    name: 'Volkswagen',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Volkswagen_logo_2019.svg/1200px-Volkswagen_logo_2019.svg.png',
    models: ['Jetta', 'Passat', 'Golf', 'Tiguan', 'Atlas', 'Arteon', 'Beetle', 'CC', 'Touareg', 'ID.4', 'GTI', 'GLI']
  },
  {
    id: 'lexus',
    name: 'Lexus',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Lexus_logo.svg/1200px-Lexus_logo.svg.png',
    models: ['ES', 'IS', 'GS', 'LS', 'RX', 'GX', 'LX', 'NX', 'UX', 'LC', 'RC', 'CT']
  },
  {
    id: 'infiniti',
    name: 'Infiniti',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Infiniti_logo.svg/1200px-Infiniti_logo.svg.png',
    models: ['Q50', 'Q60', 'Q70', 'QX50', 'QX60', 'QX80', 'G37', 'M37', 'FX35', 'EX35', 'JX35', 'I35']
  },
  {
    id: 'acura',
    name: 'Acura',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Acura_logo.svg/1200px-Acura_logo.svg.png',
    models: ['ILX', 'TLX', 'RLX', 'RDX', 'MDX', 'NSX', 'TSX', 'TL', 'RL', 'RSX', 'Integra', 'Legend']
  },
  {
    id: 'mazda',
    name: 'Mazda',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Mazda_logo.svg/1200px-Mazda_logo.svg.png',
    models: ['Mazda3', 'Mazda6', 'CX-3', 'CX-5', 'CX-9', 'MX-5 Miata', 'RX-7', 'RX-8', 'Protege', 'Millenia', 'Tribute', 'B-Series']
  },
  {
    id: 'subaru',
    name: 'Subaru',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Subaru_logo.svg/1200px-Subaru_logo.svg.png',
    models: ['Impreza', 'Legacy', 'Outback', 'Forester', 'Ascent', 'WRX', 'BRZ', 'Crosstrek', 'Tribeca', 'Baja', 'SVX', 'Justy']
  },
  {
    id: 'volvo',
    name: 'Volvo',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Volvo_logo.svg/1200px-Volvo_logo.svg.png',
    models: ['S60', 'S90', 'V60', 'V90', 'XC40', 'XC60', 'XC90', 'C30', 'C70', 'S40', 'S80', 'V70']
  },
  {
    id: 'jaguar',
    name: 'Jaguar',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Jaguar_logo.svg/1200px-Jaguar_logo.svg.png',
    models: ['XE', 'XF', 'XJ', 'F-PACE', 'E-PACE', 'I-PACE', 'F-TYPE', 'XK', 'S-TYPE', 'X-TYPE', 'XJS', 'XJ6']
  },
  {
    id: 'landrover',
    name: 'Land Rover',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Land_Rover_logo.svg/1200px-Land_Rover_logo.svg.png',
    models: ['Range Rover', 'Range Rover Sport', 'Range Rover Evoque', 'Range Rover Velar', 'Discovery', 'Discovery Sport', 'Defender', 'Freelander', 'LR2', 'LR3', 'LR4']
  },
  {
    id: 'porsche',
    name: 'Porsche',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/50/Porsche_logo.svg/1200px-Porsche_logo.svg.png',
    models: ['911', 'Cayenne', 'Macan', 'Panamera', 'Taycan', 'Boxster', 'Cayman', '718', '944', '928', '968', 'Carrera GT']
  }
];

// Color options for Step 3
export const colorOptions = [
  { name: 'White', hex: '#FFFFFF', textColor: '#000000' },
  { name: 'Black', hex: '#000000', textColor: '#FFFFFF' },
  { name: 'Silver', hex: '#C0C0C0', textColor: '#000000' },
  { name: 'Gray', hex: '#808080', textColor: '#FFFFFF' },
  { name: 'Red', hex: '#FF0000', textColor: '#FFFFFF' },
  { name: 'Blue', hex: '#0000FF', textColor: '#FFFFFF' },
  { name: 'Green', hex: '#008000', textColor: '#FFFFFF' },
  { name: 'Yellow', hex: '#FFFF00', textColor: '#000000' },
  { name: 'Orange', hex: '#FFA500', textColor: '#000000' },
  { name: 'Brown', hex: '#A52A2A', textColor: '#FFFFFF' },
  { name: 'Gold', hex: '#FFD700', textColor: '#000000' },
  { name: 'Purple', hex: '#800080', textColor: '#FFFFFF' }
];

// FuelType options - matching backend FuelType.cs enum values (EXACT VALUES)
export const fuelTypeOptions = [
  { value: 0, label: 'Naməlum' }, // Unknown = 0
  { value: 1, label: 'Benzin' }, // Gasoline = 1
  { value: 2, label: 'Dizel' }, // Diesel = 2
  { value: 3, label: 'Hibrid' }, // Hybrid = 3
  { value: 4, label: 'Elektrik' }, // Electric = 4
  { value: 5, label: 'LPG' }, // LPG = 5
  { value: 6, label: 'CNG' }, // CNG = 6
  { value: 7, label: 'Digər' } // Other = 7
];

// DamageType options - matching backend DamageType.cs enum values (EXACT VALUES)
export const damageTypeOptions = [
  { value: 0, label: 'Naməlum' }, // Unknown = 0
  { value: 1, label: 'Ön Hissə' }, // FrontEnd = 1
  { value: 2, label: 'Arxa Hissə' }, // RearEnd = 2
  { value: 3, label: 'Yan Tərəf' }, // Side = 3
  { value: 4, label: 'Kiçik Batıq/Cızıqlar' }, // MinorDentsScratches = 4
  { value: 5, label: 'Normal Aşınma' }, // NormalWear = 5
  { value: 6, label: 'Hər Tərəfli' }, // AllOver = 6
  { value: 7, label: 'Dolu' }, // Hail = 7
  { value: 8, label: 'Vandalizm' }, // Vandalism = 8
  { value: 9, label: 'Su/Sel' }, // WaterFlood = 9
  { value: 10, label: 'Yanma' }, // Burn = 10
  { value: 11, label: 'Mexaniki' }, // Mechanical = 11
  { value: 12, label: 'Dam' }, // Roof = 12
  { value: 13, label: 'Alt Hissə' } // Undercarriage = 13
];

// SecondaryDamage options - matching backend DamageType.cs enum values (EXACT VALUES)
export const secondaryDamageOptions = [
  { value: 0, label: 'Yoxdur' }, // None = 0
  { value: 1, label: 'Ön Hissə' }, // FrontEnd = 1
  { value: 2, label: 'Arxa Hissə' }, // RearEnd = 2
  { value: 3, label: 'Yan Tərəf' }, // Side = 3
  { value: 4, label: 'Kiçik Batıq/Cızıqlar' }, // MinorDentsScratches = 4
  { value: 5, label: 'Normal Aşınma' }, // NormalWear = 5
  { value: 6, label: 'Hər Tərəfli' }, // AllOver = 6
  { value: 7, label: 'Dolu' }, // Hail = 7
  { value: 8, label: 'Vandalizm' }, // Vandalism = 8
  { value: 9, label: 'Su/Sel' }, // WaterFlood = 9
  { value: 10, label: 'Yanma' }, // Burn = 10
  { value: 11, label: 'Mexaniki' }, // Mechanical = 11
  { value: 12, label: 'Dam' }, // Roof = 12
  { value: 13, label: 'Alt Hissə' } // Undercarriage = 13
];

// CarCondition options - matching backend CarCondition.cs enum values (EXACT VALUES)
export const carConditionOptions = [
  { value: 0, label: 'Naməlum' }, // Unknown = 0
  { value: 1, label: 'İşləyir və Sürülür' }, // RunAndDrive = 1
  { value: 2, label: 'Mühərrik Başlatma Proqramı' }, // EngineStartProgram = 2
  { value: 3, label: 'Təkmilləşdirilmiş' }, // Enhanced = 3
  { value: 4, label: 'Stasionar' } // Stationary = 4
];

// Transmission options - matching backend Transmission.cs enum values (EXACT VALUES)
export const transmissionOptions = [
  { value: 0, label: 'Naməlum' }, // Unknown = 0
  { value: 1, label: 'Avtomatik' }, // Automatic = 1
  { value: 2, label: 'Mexaniki' }, // Manual = 2
  { value: 3, label: 'CVT' } // CVT = 3
];

// DriveTrain options - matching backend DriveTrain.cs enum values (EXACT VALUES)
export const driveTrainOptions = [
  { value: 0, label: 'Naməlum' }, // Unknown = 0
  { value: 1, label: 'Ön Təkər' }, // FWD = 1
  { value: 2, label: 'Arxa Təkər' }, // RWD = 2
  { value: 3, label: 'Tam Ötürücü' }, // AWD = 3
  { value: 4, label: 'Dörd Təkər' } // FourWD = 4
];

// TitleType options - matching backend TitleType.cs enum values (EXACT VALUES)
export const titleTypeOptions = [
  { value: 0, label: 'Naməlum' }, // Unknown = 0
  { value: 1, label: 'Təmiz' }, // Clean = 1
  { value: 2, label: 'Salvage' }, // Salvage = 2
  { value: 3, label: 'Təmir Edilməz' }, // NonRepairable = 3
  { value: 4, label: 'Məhv Sertifikatı' }, // CertificateOfDestruction = 4
  { value: 5, label: 'Yenidən Qurulmuş' }, // Rebuilt = 5
  { value: 6, label: 'Zibil' } // Junk = 6
];

// TitleState options - US States and territories
export const titleStateOptions = [
  { value: '', label: 'Seçin' },
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
  { value: 'DC', label: 'District of Columbia' },
  { value: 'PR', label: 'Puerto Rico' },
  { value: 'VI', label: 'Virgin Islands' },
  { value: 'GU', label: 'Guam' },
  { value: 'AS', label: 'American Samoa' },
  { value: 'MP', label: 'Northern Mariana Islands' }
];

// HasKeys options - boolean representation
export const hasKeysOptions = [
  { value: true, label: 'Bəli' },
  { value: false, label: 'Xeyr' }
];

// Body style options
export const bodyStyleOptions = [
  'Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 'Wagon', 'Pickup', 'Van', 'Minivan', 'Crossover', 'Roadster', 'Truck'
];

// Currency options
export const currencyOptions = [
  { value: 'AZN', label: 'AZN (₼)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' }
];

// Mileage unit options
export const mileageUnitOptions = [
  { value: 'km', label: 'Kilometers' },
  { value: 'miles', label: 'Miles' }
];
