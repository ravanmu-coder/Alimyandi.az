import React, { useState } from 'react';
import Modal from './Modal';
import toast from 'react-hot-toast';
import { 
  AlertTriangle, 
  Trash2, 
  X, 
  CheckCircle, 
  XCircle,
  Car,
  Calendar,
  DollarSign,
  MapPin,
  Loader2,
  AlertCircle,
  Info
} from 'lucide-react';
import { getEnumLabel, getEnumBadgeClasses } from '../services/enumService';
import { apiClient } from '../lib/api';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  color?: string;
  bodyStyle?: string;
  mileage?: number;
  mileageUnit?: string;
  fuelType?: number;
  damageType?: number;
  carCondition?: number;
  transmission?: number;
  driveTrain?: number;
  titleType?: number;
  secondaryDamage?: number;
  hasKeys?: boolean;
  titleState?: string;
  price?: number;
  currency?: string;
  estimatedRetailValue?: number;
  locationId?: string;
  locationName?: string;
  locationAddress?: string;
  locationCity?: string;
  createdAt?: string;
  updatedAtUtc?: string;
  ownerId?: string;
  ownerUsername?: string;
  photoUrls?: string[];
  videoUrls?: string[];
}

interface DeleteVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
  onDelete: (vehicleId: string) => void;
}

const DeleteVehicleModal: React.FC<DeleteVehicleModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  onDelete
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string>('');
  const [showImpactWarning, setShowImpactWarning] = useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (price?: number, currency?: string) => {
    if (!price || price === 0) return 'N/A';
    const currencySymbol = currency === 'AZN' ? '₼' : currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '$';
    return `${currencySymbol}${price.toLocaleString()}`;
  };

  const formatMileage = (mileage?: number, unit?: string) => {
    if (!mileage || mileage === 0) return 'N/A';
    const unitText = unit === 'km' ? 'km' : unit === 'miles' ? 'mi' : unit || 'km';
    return `${mileage.toLocaleString()} ${unitText}`;
  };

  const handleDelete = async () => {
    if (!vehicle) return;

    try {
      setDeleting(true);
      setError('');

      // Delete vehicle via API
      await apiClient.deleteCar(vehicle.id);
      
      // Call parent callback
      onDelete(vehicle.id);
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      const errorMessage = 'Failed to delete vehicle. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    setConfirmText('');
    setError('');
    setShowImpactWarning(false);
    onClose();
  };

  const isConfirmValid = () => {
    if (!vehicle) return false;
    return confirmText === `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  };

  const hasAuctionHistory = () => {
    // This would check if the vehicle has been in any auctions
    // For now, we'll assume no auction history
    return false;
  };

  if (!vehicle) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Delete Vehicle"
      size="lg"
      className="bg-red-50"
    >
      <div className="bg-white">
        {/* Warning Header */}
        <div className="bg-red-50 border-b border-red-200 p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-900">Delete Vehicle Confirmation</h3>
              <p className="text-red-700 mt-1">
                This action cannot be undone. All vehicle data, images, and related information will be permanently deleted.
              </p>
            </div>
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="p-6">
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Car className="h-5 w-5" />
              Vehicle to be Deleted
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Vehicle:</span>
                  <span className="font-medium">{vehicle.year} {vehicle.make} {vehicle.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">VIN:</span>
                  <span className="font-medium font-mono text-sm">{vehicle.vin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Color:</span>
                  <span className="font-medium">{vehicle.color || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mileage:</span>
                  <span className="font-medium">{formatMileage(vehicle.mileage, vehicle.mileageUnit)}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-medium text-green-600">{formatPrice(vehicle.price, vehicle.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-medium">{vehicle.locationName || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Added:</span>
                  <span className="font-medium">{formatDate(vehicle.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Owner:</span>
                  <span className="font-medium">{vehicle.ownerUsername || 'Unknown'}</span>
                </div>
              </div>
            </div>

            {/* Status Information */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h5 className="font-semibold text-gray-900 mb-2">Current Status</h5>
              <div className="flex flex-wrap gap-2">
                {vehicle.carCondition !== undefined && (
                  <span className={getEnumBadgeClasses('CarCondition', vehicle.carCondition)}>
                    {getEnumLabel('CarCondition', vehicle.carCondition)}
                  </span>
                )}
                {vehicle.titleType !== undefined && (
                  <span className={getEnumBadgeClasses('TitleType', vehicle.titleType)}>
                    {getEnumLabel('TitleType', vehicle.titleType)}
                  </span>
                )}
                {vehicle.hasKeys !== undefined && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    vehicle.hasKeys ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {vehicle.hasKeys ? '✓ Has Keys' : '✗ No Keys'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Impact Warning */}
          {hasAuctionHistory() && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-orange-900">Auction History Detected</h4>
                  <p className="text-orange-800 text-sm mt-1">
                    This vehicle has participated in auctions. Deleting it may affect auction records and bid history.
                    Consider contacting support before proceeding.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Data Impact Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              What will be deleted:
            </h4>
            <ul className="text-blue-800 text-sm space-y-1">
              <li className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Vehicle specifications and details
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                All vehicle images and videos
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Pricing and valuation data
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Location and ownership information
              </li>
              <li className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                All related metadata and timestamps
              </li>
            </ul>
          </div>

          {/* Confirmation Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To confirm deletion, type the vehicle name exactly as shown:
            </label>
            <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 mb-2">
              <code className="text-sm font-medium text-gray-900">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </code>
            </div>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type vehicle name here..."
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                confirmText && !isConfirmValid() ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {confirmText && !isConfirmValid() && (
              <p className="text-red-500 text-sm mt-1">
                Text does not match. Please type exactly: {vehicle.year} {vehicle.make} {vehicle.model}
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Error</span>
              </div>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          )}

          {/* Final Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900">Final Warning</h4>
                <p className="text-red-800 text-sm mt-1">
                  This action is permanent and cannot be undone. All data associated with this vehicle will be lost forever.
                  Make sure you have backed up any important information before proceeding.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            <p>This action cannot be undone</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              disabled={deleting}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            
            <button
              onClick={handleDelete}
              disabled={!isConfirmValid() || deleting}
              className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete Vehicle
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteVehicleModal;
