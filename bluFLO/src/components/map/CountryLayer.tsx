/**
 * CountryLayer - GeoJSON choropleth showing Tor client connections by country
 * 
 * Performance: Uses CPU point-in-polygon for hover detection instead of GPU picking.
 * This avoids expensive readPixels() calls that block the render loop.
 */

import { GeoJsonLayer } from '@deck.gl/layers';
import { type CountryHistogram, getCountryClientData, formatRange, TOOLTIP_OFFSET } from '../../lib/types';
import { forwardRef } from 'react';

interface CountryLayerOptions {
  countryData: CountryHistogram;
  geojson: GeoJSON.FeatureCollection | null;
  visible: boolean;
  opacity?: number;
  /** Limit display to top N countries by client count (default: all) */
  topCountryCount?: number;
}

// Color constants
const NO_DATA_COLOR: [number, number, number, number] = [0, 0, 0, 0]; // Fully transparent
const LINE_COLOR: [number, number, number, number] = [255, 255, 0, 180]; // Vibrant Yellow

// SVG path for external link icon (matches RelayPopup)
const EXTERNAL_LINK_PATH = "M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14";

// Color ramp: Bright Red (#FF0000) → Light Red (#FF8080)
// Pre-computed deltas for efficient interpolation
// Alpha is set to 255 (fully opaque) so the layer opacity slider controls transparency
const COLOR_BASE = [200, 0, 0, 255] as const;
const COLOR_DELTA = [55, 120, 120, 0] as const; // end - start

/** Interpolate color based on normalized value [0,1] */
function getCountryColor(t: number): [number, number, number, number] {
  // Use a ramp that goes from reddish-white to deep pure red
  // We want to make sure even low values (t > 0) are somewhat red

  // Power scale applied outside to make sure mid-range is visible
  return [
    255, // Always full Red component
    Math.round(220 * (1 - t)), // G drops as t increases
    Math.round(220 * (1 - t)), // B drops as t increases
    255
  ];
}

// Get country code from feature properties
function getCountryCode(feature: any): string | null {
  const props = feature.properties;
  return (
    props?.iso_a2 ||
    props?.ISO_A2 ||
    props?.cc2 ||
    props?.['ISO3166-1-Alpha-2'] ||
    props?.iso_3166_1_alpha_2 ||
    props?.postal ||
    null
  );
}

/**
 * Creates a Deck.gl GeoJsonLayer for country choropleth visualization.
 * Layer is always created (even when hidden) to keep geometry in GPU memory.
 */
export function createCountryLayer({
  countryData,
  geojson,
  visible,
  opacity = 0.6,
  topCountryCount,
}: CountryLayerOptions): GeoJsonLayer | null {
  // Return null only if there's no geojson data - but always create the layer
  // even when not visible to keep geometry in GPU memory and avoid re-parsing lag
  if (!geojson) return null;

  // Pre-compute counts lookup
  const countLookup: Record<string, number> = {};
  for (const code in countryData) {
    countLookup[code] = getCountryClientData(countryData, code).count;
  }

  // Pre-compute Top N set for fill colors
  let topCountrySet: Set<string> | null = null;
  let maxCount = 1;

  if (topCountryCount && topCountryCount > 0) {
    const sortedCodes = Object.entries(countLookup)
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, topCountryCount)
      .map(([code]) => code);

    topCountrySet = new Set(sortedCodes);
    if (sortedCodes.length > 0) {
      maxCount = countLookup[sortedCodes[0]] || 1;
    }
  } else {
    // If no count limit, find global max for ramp normalization
    for (const code in countLookup) {
      if (countLookup[code] > maxCount) maxCount = countLookup[code];
    }
  }

  if (visible) {
    console.log(`[CountryLayer] Rendering. Visible: ${visible}, GeoJSON: ${geojson?.features?.length} features, Data keys: ${Object.keys(countLookup).length}`);
    console.log(`[CountryLayer] TopCountryCount: ${topCountryCount}, TopCountrySet Size: ${topCountrySet?.size || 'N/A'}, Max count: ${maxCount}`);
  }

  return new GeoJsonLayer({
    id: 'countries',
    data: geojson, // Always use full GeoJSON to show all borders
    visible,
    pickable: false,
    stroked: true,
    filled: true,
    extruded: false,
    wireframe: false,
    opacity,
    lineWidthMinPixels: 1,

    // Style based on client count (uses pre-computed lookup)
    getFillColor: (feature: any) => {
      const cc = getCountryCode(feature);
      if (!cc) {
        // console.log('[CountryLayer] No CC for feature:', feature.properties.name);
        return NO_DATA_COLOR;
      }

      const count = countLookup[cc];

      // If Top N filter is active, only fill countries in the set
      if (topCountrySet && !topCountrySet.has(cc)) {
        return NO_DATA_COLOR;
      }

      if (count === undefined || count === 0) return NO_DATA_COLOR;

      // Debug first few positive matches
      if (visible && Math.random() < 0.01) {
        console.log(`[CountryLayer] Match: ${cc} (${feature.properties.name || '?'}) count=${count} t=${(count / maxCount).toFixed(3)}`);
      }

      // Linear interpolation relative to current selection max
      // Apply slight power scale (0.5) to make colors "pop" more for mid-range values
      return getCountryColor(Math.pow(count / maxCount, 0.5));
    },

    getLineColor: LINE_COLOR,
    getLineWidth: 1,

    updateTriggers: {
      getFillColor: [countryData, maxCount, topCountryCount, topCountrySet],
      visible: [visible],
    },
  });
}

// Country hover tooltip component
interface CountryTooltipProps {
  countryCode: string;
  countryData: CountryHistogram;
  x: number;
  y: number;
  style?: React.CSSProperties;
}

export const CountryTooltip = forwardRef<HTMLDivElement, CountryTooltipProps>(
  function CountryTooltip({ countryCode, countryData, x, y, style }, ref) {
    const { count, lower, upper, hasBounds } = getCountryClientData(countryData, countryCode);
    const countStr = count.toLocaleString();

    return (
      <div
        ref={ref}
        className="absolute bg-black/90 text-white text-sm px-3 py-2 rounded-lg shadow-lg border border-red-500/30 z-10 transition-opacity duration-75"
        style={{ left: x + TOOLTIP_OFFSET, top: y + TOOLTIP_OFFSET, ...style }}
      >
        <div className="font-medium text-red-400 country-name">{countryCode}</div>
        <div className="text-gray-400 country-count">{countStr} clients</div>
        {/* Always render bounds element so DOM ref caching works; hide via display:none */}
        <div
          className="text-gray-500 text-xs country-bounds"
          style={{ display: hasBounds ? undefined : 'none' }}
        >
          Est. range: {formatRange(lower, upper)}
        </div>
        {/* Relay count - shown dynamically via DOM manipulation */}
        <div
          className="text-gray-300 text-xs country-relays"
          style={{ display: 'none' }}
        />
        {/* Link to metrics site - shown only when country has relays */}
        <a
          className="country-link text-tor-green hover:text-tor-green-dim text-xs mt-1 inline-flex items-center gap-1 hover:underline transition-colors"
          href=""
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View relays in country on metrics site"
          style={{ display: 'none' }}
        >
          View relays in country
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={EXTERNAL_LINK_PATH} />
          </svg>
        </a>
      </div>
    );
  }
);

/** Format country data for display: total count and top 10 countries */
export function formatCountryStats(
  countryData: CountryHistogram,
  countryNames: Record<string, string>
): {
  total: number;
  topCountries: { code: string; name: string; count: number }[];
} {
  let total = 0;
  const entries: { code: string; name: string; count: number }[] = [];

  for (const code in countryData) {
    const count = getCountryClientData(countryData, code).count;
    total += count;
    entries.push({
      code,
      name: countryNames[code] || code,
      count
    });
  }

  entries.sort((a, b) => b.count - a.count);
  return { total, topCountries: entries.slice(0, 10) };
}
