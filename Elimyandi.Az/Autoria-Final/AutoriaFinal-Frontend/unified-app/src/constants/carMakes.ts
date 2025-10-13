// Car makes data with icon names for react-simple-icons
export interface CarMake {
  id: string;
  name: string;
  iconName: string; // Icon name for react-simple-icons
  models: string[];
  isPopular?: boolean;
}

export const carMakes: CarMake[] = [
  // Popular brands (shown first)
  {
    id: 'mercedes',
    name: 'Mercedes-Benz',
    iconName: 'Mercedes',
    isPopular: true,
    models: ['C-Class', 'E-Class', 'S-Class', 'A-Class', 'G-Class', 'GLC', 'GLE', 'GLS', 'CLA', 'CLS', 'AMG GT', 'Sprinter']
  },
  {
    id: 'bmw',
    name: 'BMW',
    iconName: 'BMW',
    isPopular: true,
    models: ['3 Series', '5 Series', '7 Series', 'X1', 'X3', 'X5', 'X7', 'Z4', 'i3', 'i8', 'M3', 'M5']
  },
  {
    id: 'audi',
    name: 'Audi',
    iconName: 'Audi',
    isPopular: true,
    models: ['A3', 'A4', 'A6', 'A8', 'Q3', 'Q5', 'Q7', 'Q8', 'TT', 'R8', 'e-tron', 'RS6']
  },
  {
    id: 'toyota',
    name: 'Toyota',
    iconName: 'Toyota',
    isPopular: true,
    models: ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Prius', 'Avalon', 'Sienna', 'Tacoma', 'Tundra', '4Runner', 'Land Cruiser', 'Yaris']
  },
  {
    id: 'honda',
    name: 'Honda',
    iconName: 'Honda',
    isPopular: true,
    models: ['Civic', 'Accord', 'CR-V', 'Pilot', 'HR-V', 'Passport', 'Ridgeline', 'Insight', 'Fit', 'Odyssey', 'Element', 'S2000']
  },
  {
    id: 'ford',
    name: 'Ford',
    iconName: 'Ford',
    isPopular: true,
    models: ['F-150', 'Mustang', 'Explorer', 'Escape', 'Edge', 'Expedition', 'Bronco', 'Focus', 'Fusion', 'Ranger', 'Transit', 'EcoSport']
  },
  {
    id: 'chevrolet',
    name: 'Chevrolet',
    iconName: 'Chevrolet',
    isPopular: true,
    models: ['Silverado', 'Equinox', 'Malibu', 'Traverse', 'Tahoe', 'Suburban', 'Camaro', 'Corvette', 'Cruze', 'Sonic', 'Spark', 'Blazer']
  },
  {
    id: 'nissan',
    name: 'Nissan',
    iconName: 'Nissan',
    isPopular: true,
    models: ['Altima', 'Sentra', 'Rogue', 'Murano', 'Pathfinder', 'Armada', 'Frontier', 'Titan', '370Z', 'GT-R', 'Leaf', 'Versa']
  },
  {
    id: 'hyundai',
    name: 'Hyundai',
    iconName: 'Hyundai',
    isPopular: true,
    models: ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Palisade', 'Kona', 'Veloster', 'Genesis', 'Accent', 'Venue', 'Ioniq', 'Nexo']
  },
  {
    id: 'volkswagen',
    name: 'Volkswagen',
    iconName: 'Volkswagen',
    isPopular: true,
    models: ['Jetta', 'Passat', 'Golf', 'Tiguan', 'Atlas', 'Arteon', 'Beetle', 'CC', 'Touareg', 'ID.4', 'GTI', 'GLI']
  },

  // Other brands
  {
    id: 'kia',
    name: 'Kia',
    iconName: 'Kia',
    models: ['Forte', 'Optima', 'Sorento', 'Sportage', 'Telluride', 'Soul', 'Stinger', 'Niro', 'Cadenza', 'Sedona', 'Rio', 'EV6']
  },
  {
    id: 'lexus',
    name: 'Lexus',
    iconName: 'Lexus',
    models: ['ES', 'IS', 'GS', 'LS', 'RX', 'GX', 'LX', 'NX', 'UX', 'LC', 'RC', 'CT']
  },
  {
    id: 'infiniti',
    name: 'Infiniti',
    iconName: 'Infiniti',
    models: ['Q50', 'Q60', 'Q70', 'QX50', 'QX60', 'QX80', 'G37', 'M37', 'FX35', 'EX35', 'JX35', 'I35']
  },
  {
    id: 'acura',
    name: 'Acura',
    iconName: 'Acura',
    models: ['ILX', 'TLX', 'RLX', 'RDX', 'MDX', 'NSX', 'TSX', 'TL', 'RL', 'RSX', 'Integra', 'Legend']
  },
  {
    id: 'mazda',
    name: 'Mazda',
    iconName: 'Mazda',
    models: ['Mazda3', 'Mazda6', 'CX-3', 'CX-5', 'CX-9', 'MX-5 Miata', 'RX-7', 'RX-8', 'Protege', 'Millenia', 'Tribute', 'B-Series']
  },
  {
    id: 'subaru',
    name: 'Subaru',
    iconName: 'Subaru',
    models: ['Impreza', 'Legacy', 'Outback', 'Forester', 'Ascent', 'WRX', 'BRZ', 'Crosstrek', 'Tribeca', 'Baja', 'SVX', 'Justy']
  },
  {
    id: 'volvo',
    name: 'Volvo',
    iconName: 'Volvo',
    models: ['S60', 'S90', 'V60', 'V90', 'XC40', 'XC60', 'XC90', 'C30', 'C70', 'S40', 'S80', 'V70']
  },
  {
    id: 'jaguar',
    name: 'Jaguar',
    iconName: 'Jaguar',
    models: ['XE', 'XF', 'XJ', 'F-PACE', 'E-PACE', 'I-PACE', 'F-TYPE', 'XK', 'S-TYPE', 'X-TYPE', 'XJS', 'XJ6']
  },
  {
    id: 'landrover',
    name: 'Land Rover',
    iconName: 'Landrover',
    models: ['Range Rover', 'Range Rover Sport', 'Range Rover Evoque', 'Range Rover Velar', 'Discovery', 'Discovery Sport', 'Defender', 'Freelander', 'LR2', 'LR3', 'LR4']
  },
  {
    id: 'porsche',
    name: 'Porsche',
    iconName: 'Porsche',
    models: ['911', 'Cayenne', 'Macan', 'Panamera', 'Taycan', 'Boxster', 'Cayman', '718', '944', '928', 'Carrera GT']
  },
  {
    id: 'tesla',
    name: 'Tesla',
    iconName: 'Tesla',
    models: ['Model S', 'Model 3', 'Model X', 'Model Y', 'Roadster', 'Cybertruck']
  },
  {
    id: 'ferrari',
    name: 'Ferrari',
    iconName: 'Ferrari',
    models: ['488', 'F8', 'SF90', 'Roma', 'Portofino', '812', 'LaFerrari', 'Enzo', 'F40', 'F50']
  },
  {
    id: 'lamborghini',
    name: 'Lamborghini',
    iconName: 'Lamborghini',
    models: ['Huracán', 'Aventador', 'Urus', 'Gallardo', 'Murciélago', 'Countach', 'Diablo']
  },
  {
    id: 'mclaren',
    name: 'McLaren',
    iconName: 'McLaren',
    models: ['720S', '570S', '600LT', 'GT', 'Senna', 'P1', 'F1']
  },
  {
    id: 'bentley',
    name: 'Bentley',
    iconName: 'Bentley',
    models: ['Continental', 'Flying Spur', 'Bentayga', 'Mulsanne', 'Azure', 'Arnage']
  },
  {
    id: 'rollsroyce',
    name: 'Rolls-Royce',
    iconName: 'Rollsroyce',
    models: ['Phantom', 'Ghost', 'Wraith', 'Dawn', 'Cullinan', 'Silver Shadow', 'Silver Spirit']
  },
  {
    id: 'maserati',
    name: 'Maserati',
    iconName: 'Maserati',
    models: ['Ghibli', 'Quattroporte', 'Levante', 'GranTurismo', 'GranCabrio', 'MC20']
  },
  {
    id: 'alfa-romeo',
    name: 'Alfa Romeo',
    iconName: 'Alfaromeo',
    models: ['Giulia', 'Stelvio', '4C', 'Spider', 'Brera', '159', '147']
  },
  {
    id: 'fiat',
    name: 'Fiat',
    iconName: 'Fiat',
    models: ['500', 'Panda', 'Tipo', 'Punto', 'Bravo', 'Linea', 'Doblo']
  },
  {
    id: 'peugeot',
    name: 'Peugeot',
    iconName: 'Peugeot',
    models: ['208', '308', '508', '2008', '3008', '5008', 'Partner', 'Expert']
  },
  {
    id: 'renault',
    name: 'Renault',
    iconName: 'Renault',
    models: ['Clio', 'Megane', 'Talisman', 'Kadjar', 'Koleos', 'Captur', 'Twingo', 'Scenic']
  },
  {
    id: 'citroen',
    name: 'Citroën',
    iconName: 'Citroen',
    models: ['C3', 'C4', 'C5', 'Berlingo', 'Cactus', 'C4 Picasso', 'DS3', 'DS4']
  },
  {
    id: 'seat',
    name: 'SEAT',
    iconName: 'Seat',
    models: ['Ibiza', 'Leon', 'Ateca', 'Tarraco', 'Arona', 'Alhambra', 'Toledo']
  },
  {
    id: 'skoda',
    name: 'Škoda',
    iconName: 'Skoda',
    models: ['Fabia', 'Octavia', 'Superb', 'Kodiaq', 'Karoq', 'Kamiq', 'Scala']
  },
  {
    id: 'dacia',
    name: 'Dacia',
    iconName: 'Dacia',
    models: ['Sandero', 'Logan', 'Duster', 'Lodgy', 'Dokker', 'Spring']
  },
  {
    id: 'lada',
    name: 'Lada',
    iconName: 'Lada',
    models: ['Vesta', 'Granta', 'Kalina', 'Niva', 'Priora', 'Samara']
  },
  {
    id: 'uaz',
    name: 'UAZ',
    iconName: 'Uaz',
    models: ['Patriot', 'Hunter', 'Pickup', 'Cargo', 'Profi']
  },
  {
    id: 'geely',
    name: 'Geely',
    iconName: 'Geely',
    models: ['Emgrand', 'Coolray', 'Atlas', 'GC9', 'Vision', 'Boyue']
  },
  {
    id: 'haval',
    name: 'Haval',
    iconName: 'Haval',
    models: ['H6', 'H2', 'H9', 'Jolion', 'Dargo', 'Poer']
  },
  {
    id: 'chery',
    name: 'Chery',
    iconName: 'Chery',
    models: ['Tiggo', 'Arrizo', 'QQ', 'Fulwin', 'Exeed', 'Omoda']
  },
  {
    id: 'jac',
    name: 'JAC',
    iconName: 'Jac',
    models: ['T6', 'T8', 'S2', 'S3', 'S4', 'S5', 'iEV']
  },
  {
    id: 'great-wall',
    name: 'Great Wall',
    iconName: 'Greatwall',
    models: ['Haval', 'Wingle', 'Deer', 'Voleex', 'Florid', 'Peri']
  },
  {
    id: 'dongfeng',
    name: 'Dongfeng',
    iconName: 'Dongfeng',
    models: ['AX7', 'AX3', 'AX5', 'S30', 'H30', 'A9']
  },
  {
    id: 'byd',
    name: 'BYD',
    iconName: 'Byd',
    models: ['Tang', 'Song', 'Qin', 'Han', 'Yuan', 'Dolphin', 'Seal']
  },
  {
    id: 'xpeng',
    name: 'XPeng',
    iconName: 'Xpeng',
    models: ['P7', 'G3', 'P5', 'G9', 'G6']
  },
  {
    id: 'nio',
    name: 'NIO',
    iconName: 'Nio',
    models: ['ES8', 'ES6', 'EC6', 'ET7', 'ET5', 'EL7']
  },
  {
    id: 'li-auto',
    name: 'Li Auto',
    iconName: 'Li',
    models: ['Li ONE', 'L9', 'L8', 'L7', 'L6']
  }
];

// Get popular brands (first 10)
export const popularBrands = carMakes.filter(brand => brand.isPopular).slice(0, 10);

// Get all brands sorted by popularity first, then alphabetically
export const sortedBrands = [
  ...popularBrands,
  ...carMakes.filter(brand => !brand.isPopular).sort((a, b) => a.name.localeCompare(b.name))
];
