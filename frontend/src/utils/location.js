export const SHOP_LOCATION = {
  lat: 14.876767, // Dasarapalli Village, Udayagiri Mandal, Nellore Dt
  lng: 79.289523,
  name: 'Bismilla Fruit Juice Shop, Dasarapalli Village, Udayagiri',
};

export const MAX_DELIVERY_DISTANCE_KM = 10.0;

/**
 * Calculates straight line distance between two points in KM (Haversine formula)
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in KM
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Dynamically load Google Maps script
 */
export const loadGoogleMapsScript = (apiKey) => {
  return new Promise((resolve, reject) => {
    if (typeof window.google !== 'undefined' && typeof window.google.maps !== 'undefined') {
      resolve(window.google);
      return;
    }

    const scriptId = 'google-maps-script';
    let script = document.getElementById(scriptId);

    if (script) {
      script.addEventListener('load', () => resolve(window.google));
      script.addEventListener('error', (err) => reject(err));
      return;
    }

    script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = (err) => reject(err);

    document.head.appendChild(script);
  });
};

/**
 * Reverse geocode coordinates to an address using Google Maps Geocoder
 */
export const reverseGeocode = (lat, lng, googleInstance) => {
  return new Promise((resolve, reject) => {
    const geocoder = new googleInstance.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results[0]) {
        resolve(results[0].formatted_address);
      } else {
        reject(new Error('Reverse geocoding failed: ' + status));
      }
    });
  });
};
