import React from 'react';
import { X, MapPin, Phone, Mail, Clock, Navigation } from 'lucide-react';
import { LocationDetails } from '../api/locations';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: LocationDetails | null;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  location
}) => {
  if (!isOpen || !location) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{location.name}</h2>
                <p className="text-gray-600">{location.city}, {location.region}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Address */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-600" />
                Address
              </h3>
              <p className="text-gray-700 leading-relaxed">{location.address}</p>
              {location.latitude && location.longitude && (
                <button
                  onClick={() => {
                    const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
                    window.open(url, '_blank');
                  }}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Navigation className="h-4 w-4" />
                  Open in Maps
                </button>
              )}
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Phone className="h-5 w-5 text-gray-600" />
                  Phone
                </h3>
                <a
                  href={`tel:${location.phone}`}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {location.phone}
                </a>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Mail className="h-5 w-5 text-gray-600" />
                  Email
                </h3>
                <a
                  href={`mailto:${location.email}`}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {location.email}
                </a>
              </div>
            </div>

            {/* Hours */}
            {location.hours && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-600" />
                  Hours
                </h3>
                <p className="text-gray-700 whitespace-pre-line">{location.hours}</p>
              </div>
            )}

            {/* Description */}
            {location.description && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
                <p className="text-gray-700 leading-relaxed">{location.description}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
