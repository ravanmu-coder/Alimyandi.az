import React, { useState } from 'react';
import PortalDropdown, { DropdownOption } from './PortalDropdown';
import { Car, Calendar, Fuel, Wrench } from 'lucide-react';

const DropdownTestExample: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedFuel, setSelectedFuel] = useState('');
  const [selectedDamage, setSelectedDamage] = useState('');

  // Sample data
  const yearOptions: DropdownOption[] = Array.from({ length: 10 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
  });

  const fuelOptions: DropdownOption[] = [
    { value: 'gasoline', label: 'Gasoline' },
    { value: 'diesel', label: 'Diesel' },
    { value: 'hybrid', label: 'Hybrid' },
    { value: 'electric', label: 'Electric' },
    { value: 'lpg', label: 'LPG' }
  ];

  const damageOptions: DropdownOption[] = [
    { value: 'none', label: 'No Damage' },
    { value: 'minor', label: 'Minor Damage' },
    { value: 'major', label: 'Major Damage' },
    { value: 'salvage', label: 'Salvage' }
  ];

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Portal Dropdown Test</h1>
        
        {/* Test Container with overflow issues */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8 overflow-visible mb-8">
          <h2 className="text-xl font-semibold text-white mb-6">Test Dropdowns in Container</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Year Dropdown */}
            <div>
              <PortalDropdown
                options={yearOptions}
                value={selectedYear}
                onChange={setSelectedYear}
                placeholder="Select Year"
                label="Vehicle Year"
                icon={<Calendar className="h-4 w-4" />}
              />
            </div>

            {/* Fuel Type Dropdown */}
            <div>
              <PortalDropdown
                options={fuelOptions}
                value={selectedFuel}
                onChange={setSelectedFuel}
                placeholder="Select Fuel Type"
                label="Fuel Type"
                icon={<Fuel className="h-4 w-4" />}
              />
            </div>

            {/* Damage Type Dropdown */}
            <div>
              <PortalDropdown
                options={damageOptions}
                value={selectedDamage}
                onChange={setSelectedDamage}
                placeholder="Select Damage Type"
                label="Damage Type"
                icon={<Wrench className="h-4 w-4" />}
              />
            </div>
          </div>

          {/* Results Display */}
          <div className="mt-6 p-4 bg-white/20 rounded-lg">
            <h3 className="text-white font-medium mb-2">Selected Values:</h3>
            <p className="text-blue-200">Year: {selectedYear || 'None'}</p>
            <p className="text-blue-200">Fuel: {selectedFuel || 'None'}</p>
            <p className="text-blue-200">Damage: {selectedDamage || 'None'}</p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Instructions:</h3>
          <ul className="space-y-2 text-gray-700">
            <li>• Click on any dropdown to open it</li>
            <li>• Use arrow keys to navigate options</li>
            <li>• Press Enter or Space to select</li>
            <li>• Press Escape to close</li>
            <li>• Click outside to close</li>
            <li>• Verify dropdowns appear above all content</li>
            <li>• Test on mobile devices for touch interaction</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DropdownTestExample;
