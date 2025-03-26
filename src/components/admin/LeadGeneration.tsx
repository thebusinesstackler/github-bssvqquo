import React, { useState, useCallback, useRef } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { Search, MapPin, Mail, Download, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { useLeadStore } from '../../store/useLeadStore';
import { useAdminStore } from '../../store/useAdminStore';

const EMAIL_PATTERNS = ['@gmail.com', '@yahoo.com', '@hotmail.com', '@outlook.com', '@aol.com'];
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const mapContainerStyle = {
  width: '100%',
  height: '500px'
};

const center = {
  lat: 35.2271,
  lng: -80.8431
};

export function LeadGeneration() {
  const { partners } = useAdminStore();
  const { addLead } = useLeadStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [searchRadius, setSearchRadius] = useState(5); // miles
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedPartner, setSelectedPartner] = useState('');
  const mapRef = useRef<google.maps.Map>();

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      setSelectedLocation({
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      });
    }
  }, []);

  const searchBusinesses = async () => {
    if (!selectedLocation) {
      setError('Please select a location on the map first');
      return;
    }

    setIsSearching(true);
    setError(null);
    
    try {
      const service = new google.maps.places.PlacesService(mapRef.current!);
      
      const request = {
        location: selectedLocation,
        radius: searchRadius * 1609.34, // Convert miles to meters
        keyword: searchTerm,
        type: 'business'
      };

      const results = await new Promise((resolve, reject) => {
        service.nearbySearch(request, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            resolve(results);
          } else {
            reject(new Error('Failed to fetch places'));
          }
        });
      });

      setSearchResults(results as any[]);
      setSuccess(`Found ${(results as any[]).length} potential leads`);
    } catch (err) {
      setError('Failed to search businesses. Please try again.');
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const generateEmailPatterns = (businessName: string, domain: string) => {
    const sanitizedName = businessName.toLowerCase().replace(/[^a-z0-9]/g, '');
    return [
      `${sanitizedName}${domain}`,
      `info@${sanitizedName}${domain}`,
      `contact@${sanitizedName}${domain}`,
      `admin@${sanitizedName}${domain}`
    ];
  };

  const importLeads = async () => {
    if (!selectedPartner) {
      setError('Please select a partner to assign leads to');
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      for (const result of searchResults) {
        const emails = EMAIL_PATTERNS.flatMap(domain => 
          generateEmailPatterns(result.name, domain)
        );

        // Add lead to the system
        await addLead({
          firstName: 'Business',
          lastName: result.name,
          email: emails[0], // Use first email pattern
          phone: result.formatted_phone_number || '',
          address: result.vicinity || '',
          partnerId: selectedPartner,
          status: 'new',
          source: 'google_maps',
          potentialEmails: emails,
          location: {
            lat: result.geometry.location.lat(),
            lng: result.geometry.location.lng()
          }
        });
      }

      setSuccess(`Successfully imported ${searchResults.length} leads`);
      setSearchResults([]);
    } catch (err) {
      setError('Failed to import leads. Please try again.');
      console.error('Import error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lead Generation</h1>
          <p className="mt-1 text-sm text-gray-500">
            Find and import potential leads from Google Maps
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Term
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="e.g., medical clinic, hospital"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Radius (miles)
            </label>
            <input
              type="number"
              value={searchRadius}
              onChange={(e) => setSearchRadius(Number(e.target.value))}
              min="1"
              max="50"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign to Partner
            </label>
            <select
              value={selectedPartner}
              onChange={(e) => setSelectedPartner(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a partner...</option>
              {partners.map(partner => (
                <option key={partner.id} value={partner.id}>
                  {partner.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <LoadScript
          googleMapsApiKey={GOOGLE_MAPS_API_KEY}
          libraries={['places']}
        >
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={12}
            onClick={handleMapClick}
            onLoad={onMapLoad}
          >
            {selectedLocation && (
              <Marker
                position={selectedLocation}
                icon={{
                  url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
                }}
              />
            )}
            
            {searchResults.map((result, index) => (
              <Marker
                key={index}
                position={{
                  lat: result.geometry.location.lat(),
                  lng: result.geometry.location.lng()
                }}
                icon={{
                  url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                }}
              />
            ))}
          </GoogleMap>
        </LoadScript>

        <div className="mt-6 flex justify-between items-center">
          <div className="flex-1">
            {error && (
              <div className="flex items-center text-red-600">
                <AlertCircle className="w-5 h-5 mr-2" />
                {error}
              </div>
            )}
            {success && (
              <div className="flex items-center text-green-600">
                <CheckCircle className="w-5 h-5 mr-2" />
                {success}
              </div>
            )}
          </div>

          <div className="flex space-x-4">
            <button
              onClick={searchBusinesses}
              disabled={isSearching || !selectedLocation || !searchTerm}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSearching ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Search className="w-5 h-5 mr-2" />
              )}
              Search Area
            </button>

            <button
              onClick={importLeads}
              disabled={isSearching || searchResults.length === 0 || !selectedPartner}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Download className="w-5 h-5 mr-2" />
              Import Leads
            </button>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Search Results ({searchResults.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {searchResults.map((result, index) => (
              <div key={index} className="p-6 flex items-start justify-between hover:bg-gray-50">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{result.name}</h3>
                  <p className="text-sm text-gray-500">{result.vicinity}</p>
                  <div className="mt-2 flex items-center space-x-4">
                    <span className="flex items-center text-sm text-gray-500">
                      <MapPin className="w-4 h-4 mr-1" />
                      {result.geometry.location.lat().toFixed(6)}, {result.geometry.location.lng().toFixed(6)}
                    </span>
                    <span className="flex items-center text-sm text-gray-500">
                      <Mail className="w-4 h-4 mr-1" />
                      {generateEmailPatterns(result.name, EMAIL_PATTERNS[0])[0]}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {result.rating && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {result.rating} ★
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}