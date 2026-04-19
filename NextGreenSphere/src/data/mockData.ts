import { Hotspot } from '../types';

export const SATELLITE_LANDFILLS: Hotspot[] = [
  {
    id: 'sat-sewapura',
    lat: 26.7588,
    lng: 75.9221,
    severity: 9,
    type: 'mixed',
    source: 'satellite',
    status: 'pending',
  },
  {
    id: 'sat-mathuradaspura',
    lat: 26.8500,
    lng: 75.9000,
    severity: 8,
    type: 'mixed',
    source: 'satellite',
    status: 'pending',
  }
];

export const INITIAL_USER_REPORTS: Hotspot[] = [
  {
    id: 'user-1',
    lat: 26.9124,
    lng: 75.7873,
    severity: 7,
    type: 'plastic',
    source: 'user',
    status: 'pending',
  },
  {
    id: 'user-2',
    lat: 26.9200,
    lng: 75.8000,
    severity: 4,
    type: 'organic',
    source: 'user',
    status: 'collected',
  }
];
