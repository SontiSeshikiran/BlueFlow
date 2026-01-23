/**
 * RouteFluxMap Configuration
 * Theme: Black + Green
 * 
 * Many values are adaptive - they adjust based on current relay data.
 * Static defaults are used before data loads or as fallbacks.
 */

export const config = {
  // Site info - configure via environment variables
  siteUrl: import.meta.env.PUBLIC_SITE_URL || '',
  metricsUrl: import.meta.env.PUBLIC_METRICS_URL || 'https://metrics.torproject.org/rs.html',
  dataBaseUrl: import.meta.env.PUBLIC_DATA_URL || '',

  // UI Defaults (Sliders 0-1)
  uiDefaults: {
    opacity: 0.7,      // High visibility for static lines
    speed: 0.2,        // Majestic/slower animation
    relaySize: 0.6,    // Slightly larger dots
    density: 0.5,      // Standard density
    pathWidth: 0.5,    // Path offset spread (controls how spread out paths are)
    particleCount: 0.5, // Particle count factor
    scaleByZoom: true,  // Scale particle size by zoom level
    scaleByBandwidth: true, // Scale particle count by route bandwidth
    particleSize: 0.5,  // Multiplier for particle size
    nodeDensity: 0.5,   // Percentage of top nodes to show (0.1 - 1.0)
    scaleNodesByBandwidth: false, // Scale node size by bandwidth instead of count
  },

  // Color ramps - Light Blue theme
  bandwidthColorRamp: ['#004d80', '#00b4ff'] as const,
  connectionsColorRamp: ['#004d80', '#0099dd'] as const,
  countriesColorRamp: ['#1a1a2e', '#00b4ff'] as const,

  // Particle colors (normalized 0-1)
  particleHiddenColor: [1.0, 0.5, 0.0] as const,      // Orange
  particleGeneralColor: [0.0, 0.71, 1.0] as const,    // Light blue (#00b4ff)

  // Node count configuration
  // ADAPTIVE: Shows all aggregated locations from data when available
  // Static default used before data loads (~1,200-1,500 locations typical)
  nodeCount: {
    default: 1500,
    min: 100,
    max: 3000,
  },

  // Node radius (pixels)
  // Sized by relay count only (bandwidth shown via particles)
  nodeRadius: {
    min: 4,
    max: 22,
  },

  // Country count configuration
  // ADAPTIVE: Shows all countries with relays when data available
  // Static default covers typical range (~80-120 countries have relays)
  countryCount: {
    default: 120,
    min: 5,
    max: 250,
  },

  // Particle count configuration
  // ADAPTIVE: Scales with network bandwidth (particles = bandwidth × K)
  // K=400 derived from: ~400k particles at ~1000 bandwidth baseline
  // This gives ~0.2 particles/pixel on 1080p = good visual density
  particleScaleFactor: 400,
  particleCount: {
    default: 500_000,  // Fallback before data loads
    min: 100_000,
    max: 2_000_000,
  },

  // Particle size (pixels)
  particleSize: {
    default: 1,
    min: 1,
    max: 10,
  },

  // Particle speed (ms for particle to circle earth)
  particleBaseSpeedMs: 55_000,
  particleSpeedFactor: {
    min: 0.01,
    max: 4.0,
  },

  // Hidden service traffic probability
  // Estimated ~3-6% of Tor traffic goes to .onion addresses
  // This is a research estimate - not directly measurable due to Tor's privacy design
  // Source: https://metrics.torproject.org/hidserv-dir-onions-seen.html
  hiddenServiceProbability: 0.04,

  // Mobile adjustments
  mobile: {
    particleFactor: 0.3,
    nodeFactor: 0.5,
    countryFactor: 0.2,
  },

  // Zoom levels
  zoom: {
    desktop: { min: 3, start: 4 },
    mobile: { min: 2, start: 2 },
  },

  // Map settings - dark theme
  mapStyle: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',

  // Attribution sources (name, url, prefix?, suffix?)
  attributions: [
    { name: 'MapLibre', url: 'https://maplibre.org/', prefix: '', suffix: '' },
    { name: 'CARTO', url: 'https://carto.com/attributions', prefix: '©', suffix: '' },
    { name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/copyright', prefix: '©', suffix: '' },
    { name: 'MaxMind', url: 'https://www.maxmind.com', prefix: '', suffix: '' },
    { name: 'TorFlow', url: 'https://github.com/unchartedsoftware/torflow', prefix: '', suffix: 'contributors' },
  ] as const,

  // Relay marker colors (RGBA 0-255)
  relayColors: {
    guard: [0, 240, 255, 220] as [number, number, number, number],      // Cyan - entry nodes
    exit: [255, 136, 0, 220] as [number, number, number, number],       // Orange - exit nodes
    middle: [0, 180, 255, 200] as [number, number, number, number],     // Light blue - middle relays
    hidden: [139, 92, 246, 200] as [number, number, number, number],    // Purple - hidden service dir
  },

  // Content
  title: 'bluFLO',
  summary: `
    <h2>Data Flow in the Tor Network</h2>
    <p>The Tor network is a group of volunteer-operated servers (relays) that allows people to improve their privacy and
    security on the Internet.</p>
    <p>Each circle represents aggregated relay bandwidth. Click to see individual relays with links to detailed metrics.</p>
  `,
} as const;

// Helper to get particle zoom scale
export function getParticleZoomScale(zoom: number, baseSize: number): number {
  return baseSize * Math.max(1, Math.pow(2, zoom - 4));
}

// Helper to check if mobile
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Pre-compiled regex patterns for URL helpers (avoid recompilation on each call)
const FINGERPRINT_CLEAN_REGEX = /[$:\s-]/g;
const FINGERPRINT_VALID_REGEX = /^[0-9A-F]{40}$/;
const COUNTRY_CODE_CLEAN_REGEX = /[^A-Za-z]/g;

// Helper to build metrics relay URL
export function getRelayMetricsUrl(fingerprint: string): string {
  // Tor relay fingerprints must be:
  // - 40 characters (SHA-1 hash)
  // - Hexadecimal (0-9, A-F)
  // - Uppercase (canonical form)
  // - No spaces, colons, or $ prefix

  // Clean the fingerprint: remove $, spaces, colons, and other separators
  const cleanFingerprint = fingerprint
    .replace(FINGERPRINT_CLEAN_REGEX, '')
    .toUpperCase();

  // Strict validation: must be exactly 40 hex characters
  // This prevents any path traversal or injection attacks
  if (!FINGERPRINT_VALID_REGEX.test(cleanFingerprint)) {
    console.warn(`Invalid fingerprint format: ${fingerprint}`);
    // Return safe fallback URL - metrics site will show "not found"
    return `${config.metricsUrl}#details/0000000000000000000000000000000000000000`;
  }

  return `${config.metricsUrl}#details/${cleanFingerprint}`;
}

// Helper to build metrics country URL
export function getCountryMetricsUrl(countryCode: string): string {
  // Country codes must be exactly 2 alphabetic characters (ISO 3166-1 alpha-2)
  const cleaned = countryCode.replace(COUNTRY_CODE_CLEAN_REGEX, '').toUpperCase();
  if (cleaned.length !== 2) {
    console.warn(`Invalid country code: ${countryCode}`);
    return `${config.metricsUrl}#search/`;
  }
  return `${config.metricsUrl}#search/country:${cleaned}`;
}

export type Config = typeof config;
