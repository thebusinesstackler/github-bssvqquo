// A utility library for working with zip codes and geographic proximity

// Function to calculate distance between two zip codes
// This is a simplified version using the Haversine formula
// In a production app, you would likely use a more robust geocoding service API
export async function calculateDistance(zipCode1: string, zipCode2: string): Promise<number> {
  try {
    const coord1 = await getZipCodeCoordinates(zipCode1);
    const coord2 = await getZipCodeCoordinates(zipCode2);
    
    if (!coord1 || !coord2) return Infinity;
    
    return haversineDistance(coord1.lat, coord1.lng, coord2.lat, coord2.lng);
  } catch (error) {
    console.error("Error calculating distance between zip codes:", error);
    return Infinity;
  }
}

// Function to get coordinates for a zip code
interface ZipCoordinates {
  lat: number;
  lng: number;
}

// Cache for zip code coordinates to avoid redundant lookups
const zipCodeCache: Record<string, ZipCoordinates | null> = {};

export async function getZipCodeCoordinates(zipCode: string): Promise<ZipCoordinates | null> {
  // Use cache if available
  if (zipCodeCache[zipCode] !== undefined) {
    return zipCodeCache[zipCode];
  }
  
  // Define some sample coordinates for demo purposes
  // In a real application, you would use a geocoding API
  const zipCoordinatesMap: Record<string, ZipCoordinates> = {
    '28202': { lat: 35.2271, lng: -80.8431 }, // Charlotte, NC
    '28203': { lat: 35.2078, lng: -80.8532 }, // South End, Charlotte, NC
    '28204': { lat: 35.2206, lng: -80.8163 }, // Elizabeth, Charlotte, NC
    '27601': { lat: 35.7796, lng: -78.6382 }, // Raleigh, NC
    '27701': { lat: 35.9940, lng: -78.8986 }, // Durham, NC
    '27262': { lat: 35.9556, lng: -80.0053 }, // High Point, NC
    '27403': { lat: 36.0726, lng: -79.8083 }, // Greensboro, NC
    '27101': { lat: 36.0999, lng: -80.2442 }, // Winston-Salem, NC
    '28801': { lat: 35.5951, lng: -82.5515 }, // Asheville, NC
    '28403': { lat: 34.2257, lng: -77.8847 }, // Wilmington, NC
    '28546': { lat: 34.7540, lng: -77.4302 }, // Jacksonville, NC
    '27858': { lat: 35.6127, lng: -77.3664 }, // Greenville, NC
    '28412': { lat: 34.1682, lng: -77.8999 }, // Wilmington suburbs, NC
    '28540': { lat: 34.7540, lng: -77.4302 }, // Camp Lejeune, NC
    '28562': { lat: 35.1046, lng: -77.0440 }, // New Bern, NC
    '28739': { lat: 35.2681, lng: -82.4915 }  // Flat Rock, NC
  };
  
  // Return coordinates if found in our sample data
  if (zipCode in zipCoordinatesMap) {
    zipCodeCache[zipCode] = zipCoordinatesMap[zipCode];
    return zipCoordinatesMap[zipCode];
  }
  
  try {
    // For real applications, you would make an API call here
    // For demo purposes, generate some coordinates near Charlotte for any unknown zip
    // This simulates having all zip codes available
    const baseCoord = { lat: 35.2271, lng: -80.8431 }; // Charlotte center
    
    // Generate a slight random offset (within ~25 miles)
    const latOffset = (Math.random() - 0.5) * 0.5;
    const lngOffset = (Math.random() - 0.5) * 0.5;
    
    const result = {
      lat: baseCoord.lat + latOffset,
      lng: baseCoord.lng + lngOffset
    };
    
    // Cache the result
    zipCodeCache[zipCode] = result;
    return result;
  } catch (error) {
    console.error("Error fetching coordinates for zip code:", error);
    zipCodeCache[zipCode] = null;
    return null;
  }
}

// Haversine formula to calculate distance between two points on Earth
export function haversineDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 3958.8; // Earth's radius in miles
  
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRadians(degrees: number): number {
  return degrees * Math.PI / 180;
}

// Function to find the nearest partner for a lead based on zip code
export async function findNearestPartner(
  leadZipCode: string,
  partners: any[],
  maxDistance: number = 50 // Default max distance in miles
): Promise<{ partner: any, distance: number } | null> {
  if (!leadZipCode || !partners || partners.length === 0) {
    return null;
  }
  
  let nearestPartner = null;
  let shortestDistance = Infinity;
  
  try {
    for (const partner of partners.filter(p => p.active && p.siteDetails?.zipCode)) {
      const partnerZipCode = partner.siteDetails.zipCode;
      const partnerMaxDistance = partner.siteDetails.serviceRadius || maxDistance;
      
      // Skip partners without valid zip codes
      if (!partnerZipCode) continue;
      
      // Calculate distance
      const distance = await calculateDistance(leadZipCode, partnerZipCode);
      
      // Check if this partner is within their service radius and closer than previous matches
      if (distance <= partnerMaxDistance && distance < shortestDistance) {
        nearestPartner = partner;
        shortestDistance = distance;
      }
    }
    
    if (nearestPartner) {
      return { partner: nearestPartner, distance: shortestDistance };
    }
    
    return null;
  } catch (error) {
    console.error("Error finding nearest partner:", error);
    return null;
  }
}