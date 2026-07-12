export interface Location {
  name: string;
  lat: number;
  lng: number;
}

export const LOCATIONS: Location[] = [
  { name: 'Mumbai Warehouse',       lat: 19.0760, lng: 72.8777 },
  { name: 'Mumbai Port',            lat: 18.9500, lng: 72.8354 },
  { name: 'Pune Depot',             lat: 18.5204, lng: 73.8567 },
  { name: 'Nashik Hub',             lat: 19.9975, lng: 73.7898 },
  { name: 'Ahmedabad Terminal',     lat: 23.0225, lng: 72.5714 },
  { name: 'Surat Logistics Park',   lat: 21.1702, lng: 72.8311 },
  { name: 'Vadodara Depot',         lat: 22.3072, lng: 73.1812 },
  { name: 'Delhi NCR Hub',          lat: 28.6139, lng: 77.2090 },
  { name: 'Gurugram Warehouse',     lat: 28.4595, lng: 77.0266 },
  { name: 'Noida Distribution',     lat: 28.5355, lng: 77.3910 },
  { name: 'Jaipur Terminal',        lat: 26.9124, lng: 75.7873 },
  { name: 'Ludhiana Depot',         lat: 30.9010, lng: 75.8573 },
  { name: 'Bangalore Hub',          lat: 12.9716, lng: 77.5946 },
  { name: 'Chennai Port',           lat: 13.0827, lng: 80.2707 },
  { name: 'Hyderabad Depot',        lat: 17.3850, lng: 78.4867 },
  { name: 'Kolkata Terminal',       lat: 22.5726, lng: 88.3639 },
  { name: 'Nagpur Junction',        lat: 21.1458, lng: 79.0882 },
  { name: 'Indore Warehouse',       lat: 22.7196, lng: 75.8577 },
  { name: 'Coimbatore Hub',         lat: 11.0168, lng: 76.9558 },
  { name: 'Visakhapatnam Port',     lat: 17.6868, lng: 83.2185 },
];

export function findLocation(name: string): Location | undefined {
  return LOCATIONS.find(l => l.name.toLowerCase() === name.toLowerCase());
}

/** Straight-line distance between two lat/lng points in km (Haversine formula) */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R    = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a    = Math.sin(dLat / 2) ** 2
             + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  // Add ~25% for road distance vs crow-fly
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1.25;
}
