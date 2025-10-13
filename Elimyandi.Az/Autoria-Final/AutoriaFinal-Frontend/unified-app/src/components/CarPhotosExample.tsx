import React from 'react';
import CarPhotos from './CarPhotos';

/**
 * Example component demonstrating how to use CarPhotos component
 * This shows different usage patterns for the CarPhotos component
 */
const CarPhotosExample: React.FC = () => {
  // Example car IDs - replace with actual car IDs from your database
  const exampleCarIds = [
    'car-1',
    'car-2', 
    'car-3'
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">CarPhotos Component Examples</h1>
        
        {/* Single Image Display (for tables) */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Single Image Display (Table Format)</h2>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {exampleCarIds.map((carId, index) => (
                <div key={carId} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                  <CarPhotos 
                    carId={carId} 
                    showMultiple={false}
                    className="h-16 w-20"
                  />
                  <div>
                    <h3 className="font-medium text-gray-900">Car {index + 1}</h3>
                    <p className="text-sm text-gray-500">ID: {carId}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Multiple Images Display (for detailed views) */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Multiple Images Display (Detailed View)</h2>
          <div className="space-y-8">
            {exampleCarIds.map((carId, index) => (
              <div key={carId} className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Car {index + 1} - Detailed Photos</h3>
                <CarPhotos 
                  carId={carId} 
                  showMultiple={true}
                  maxImages={4}
                  className="max-w-2xl"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Usage Instructions */}
        <section className="bg-blue-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">Usage Instructions</h2>
          <div className="space-y-4 text-sm text-blue-800">
            <div>
              <h3 className="font-medium">Basic Usage:</h3>
              <pre className="bg-blue-100 p-2 rounded mt-1 text-xs overflow-x-auto">
{`<CarPhotos carId="your-car-id" />`}
              </pre>
            </div>
            
            <div>
              <h3 className="font-medium">Single Image (for tables):</h3>
              <pre className="bg-blue-100 p-2 rounded mt-1 text-xs overflow-x-auto">
{`<CarPhotos 
  carId="your-car-id" 
  showMultiple={false}
  className="h-12 w-16"
/>`}
              </pre>
            </div>
            
            <div>
              <h3 className="font-medium">Multiple Images (detailed view):</h3>
              <pre className="bg-blue-100 p-2 rounded mt-1 text-xs overflow-x-auto">
{`<CarPhotos 
  carId="your-car-id" 
  showMultiple={true}
  maxImages={3}
  className="max-w-lg"
/>`}
              </pre>
            </div>
          </div>
        </section>

        {/* API Requirements */}
        <section className="bg-green-50 rounded-lg p-6 mt-8">
          <h2 className="text-xl font-semibold text-green-900 mb-4">API Requirements</h2>
          <div className="space-y-3 text-sm text-green-800">
            <div>
              <h3 className="font-medium">Required Endpoints:</h3>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li><code>GET /api/car/{id}</code> - Returns car details with PhotoUrls field</li>
                <li><code>GET /api/car</code> - Returns all cars with PhotoUrls field</li>
                <li><code>POST /api/car/{id}/photo</code> - Upload photos (multipart/form-data)</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium">PhotoUrls Format:</h3>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Array: <code>["/images/cars/photo1.jpg", "/images/cars/photo2.jpg"]</code></li>
                <li>String: <code>"/images/cars/photo1.jpg;/images/cars/photo2.jpg"</code></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium">Image Storage:</h3>
              <p>Images should be stored in <code>wwwroot/images/cars/</code> directory on the server.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CarPhotosExample;
