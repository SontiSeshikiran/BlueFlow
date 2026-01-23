/**
 * createRelayLayer - Factory for relay marker ScatterplotLayer
 * 
 * Creates a Deck.gl ScatterplotLayer for relay node markers with:
 * - Color by relay type (exit/guard/middle)
 * - Size by bandwidth
 * - Configurable opacity and sizing
 */

import { ScatterplotLayer } from '@deck.gl/layers';
import type { PickingInfo } from '@deck.gl/core';
import type { AggregatedNode } from '../types';
import { config } from '../config';
import { calculateNodeRadius } from '../utils/node-sizing';

export interface CreateRelayLayerOptions {
  /** Relay nodes to display */
  nodes: AggregatedNode[];
  /** Whether layer is visible */
  visible: boolean;
  /** Opacity multiplier (0-1) */
  opacity?: number;
  /** Relay size scale (0-1, 0.5 = 1x) */
  sizeScale?: number;
  /** Whether to scale node size by bandwidth instead of count */
  scaleByBandwidth?: boolean;
  /** Custom layer ID (default: 'relays') */
  id?: string;
  /** Click handler */
  onClick?: (info: PickingInfo) => boolean | void;
  /** Hover handler */
  onHover?: (info: PickingInfo) => void;
  /** Currently selected hour (0-23) */
  currentHour?: number;
  /** Whether uptime diagnostic mode is active */
  uptimeMode?: boolean;
}

/**
 * Create a ScatterplotLayer for relay nodes
 */
export function createRelayLayer(options: CreateRelayLayerOptions): ScatterplotLayer<AggregatedNode> | null {
  const {
    nodes,
    visible,
    opacity = 1,
    sizeScale = 0.5,
    scaleByBandwidth = false,
    id = 'relays',
    onClick,
    onHover,
    currentHour = 12,
    uptimeMode = false,
  } = options;

  if (!visible || nodes.length === 0) {
    return null;
  }

  return new ScatterplotLayer<AggregatedNode>({
    id,
    data: nodes,
    pickable: true,
    opacity: 0.85 * opacity,
    stroked: true,
    filled: true,
    // Use pixel units so getRadius returns actual screen pixels
    radiusUnits: 'pixels',
    radiusScale: 1,
    radiusMinPixels: 0,
    radiusMaxPixels: Infinity,
    lineWidthMinPixels: 1,
    getPosition: (d: AggregatedNode) => [d.lng, d.lat],
    getRadius: (d: AggregatedNode) => calculateNodeRadius(d, scaleByBandwidth) * (sizeScale * 1.5),
    getFillColor: (d: AggregatedNode) => {
      // If none of the relays at this location were active at the current hour, show gray
      const anyActive = d.relays.some(r => {
        if (r.uptime === undefined) return true; // Fallback for data without uptime
        return (r.uptime & (1 << currentHour)) !== 0;
      });

      if (!anyActive) {
        // In uptime mode, inactive nodes are green (as requested for high visibility)
        // In standard mode, they are a subtle gray
        return uptimeMode ? [0, 255, 0, 200] : [100, 100, 100, 150];
      }

      // If uptime mode is on, active nodes are violet/purple
      if (uptimeMode) {
        return [139, 92, 246, 220]; // Violet/Purple (config.relayColors.hidden)
      }

      // Color by majority relay type at this location
      let exits = 0, guards = 0, middles = 0;
      for (const r of d.relays) {
        if (r.flags.includes('E')) exits++;
        else if (r.flags.includes('G')) guards++;
        else middles++;
      }
      if (exits >= guards && exits >= middles) return config.relayColors.exit;
      if (guards >= middles) return config.relayColors.guard;
      return config.relayColors.middle;
    },
    getLineColor: [0, 180, 255, Math.round(100 * opacity)], // Light blue outline with transition opacity
    onClick,
    onHover,
    updateTriggers: {
      getFillColor: [nodes, currentHour, uptimeMode],
      getRadius: [nodes, sizeScale, scaleByBandwidth],
      opacity: [opacity],
      getLineColor: [opacity],
    },
  });
}

