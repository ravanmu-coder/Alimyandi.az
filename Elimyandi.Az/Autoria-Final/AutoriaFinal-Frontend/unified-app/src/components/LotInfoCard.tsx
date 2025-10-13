import React from 'react';
import { Gauge, Calendar, Shield, Key, DollarSign, FileText } from 'lucide-react';
import { getEnumLabel, getEnumBadgeClasses } from '../services/enumService';

interface LotInfoCardProps {
  lotNumber: string;
  itemNumber: number;
  vin: string;
  odometer: number;
  damageType: string;
  estimatedValue: number;
  titleType: string;
  keysStatus: string;
  condition: string;
  color: string;
  engine: string;
  transmission: string;
  driveType: string;
  fuelType: string;
  cylinders: number;
  doors: number;
  bodyStyle: string;
  className?: string;
}

export const LotInfoCard: React.FC<LotInfoCardProps> = ({
  lotNumber,
  itemNumber,
  vin,
  odometer,
  damageType,
  estimatedValue,
  titleType,
  keysStatus,
  condition,
  color,
  engine,
  transmission,
  driveType,
  fuelType,
  cylinders,
  doors,
  bodyStyle,
  className = ''
}) => {
  const formatOdometer = (miles: number) => {
    return new Intl.NumberFormat('en-US').format(miles);
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getTitleTypeColor = (title: string) => {
    // Use enum service for consistent styling
    const badgeClasses = getEnumBadgeClasses('TitleType', title)
    return badgeClasses
  };

  const getDamageTypeColor = (damageType: string) => {
    // Use enum service for consistent styling
    const badgeClasses = getEnumBadgeClasses('DamageType', damageType)
    return badgeClasses
  };

  const getConditionColor = (condition: string) => {
    // Use enum service for consistent styling
    const badgeClasses = getEnumBadgeClasses('CarCondition', condition)
    return badgeClasses
  };

  const getKeysStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'not available':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-gray-200 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Lot #{lotNumber}</h3>
              <p className="text-sm text-gray-500">Item #{itemNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">VIN</p>
              <p className="font-mono text-sm text-gray-900">{vin}</p>
            </div>
          </div>
        </div>

        {/* Main Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Odometer */}
            <div className="flex items-center gap-3">
              <Gauge className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Odometer</p>
                <p className="font-semibold text-gray-900">{formatOdometer(odometer)} miles</p>
              </div>
            </div>

            {/* Damage */}
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Damage</p>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getDamageTypeColor(damageType)}`}>
                  {getEnumLabel('DamageType', damageType)}
                </span>
              </div>
            </div>

            {/* Estimated Value */}
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Est. Value</p>
                <p className="font-semibold text-gray-900">{formatPrice(estimatedValue)}</p>
              </div>
            </div>

            {/* Title Type */}
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Title</p>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getTitleTypeColor(titleType)}`}>
                  {getEnumLabel('TitleType', titleType)}
                </span>
              </div>
            </div>

            {/* Keys Status */}
            <div className="flex items-center gap-3">
              <Key className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Keys</p>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getKeysStatusColor(keysStatus)}`}>
                  {keysStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Condition */}
            <div>
              <p className="text-sm text-gray-500 mb-1">Condition</p>
              <p className="font-semibold text-gray-900">{condition}</p>
            </div>

            {/* Color */}
            <div>
              <p className="text-sm text-gray-500 mb-1">Color</p>
              <p className="font-semibold text-gray-900">{color}</p>
            </div>

            {/* Engine */}
            <div>
              <p className="text-sm text-gray-500 mb-1">Engine</p>
              <p className="font-semibold text-gray-900">{engine}</p>
            </div>

            {/* Transmission */}
            <div>
              <p className="text-sm text-gray-500 mb-1">Transmission</p>
              <p className="font-semibold text-gray-900">{transmission}</p>
            </div>

            {/* Drive Type */}
            <div>
              <p className="text-sm text-gray-500 mb-1">Drive Type</p>
              <p className="font-semibold text-gray-900">{driveType}</p>
            </div>
          </div>
        </div>

        {/* Additional Details */}
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Fuel Type</p>
              <p className="font-medium text-gray-900">{fuelType}</p>
            </div>
            <div>
              <p className="text-gray-500">Cylinders</p>
              <p className="font-medium text-gray-900">{cylinders}</p>
            </div>
            <div>
              <p className="text-gray-500">Doors</p>
              <p className="font-medium text-gray-900">{doors}</p>
            </div>
            <div>
              <p className="text-gray-500">Body Style</p>
              <p className="font-medium text-gray-900">{bodyStyle}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
