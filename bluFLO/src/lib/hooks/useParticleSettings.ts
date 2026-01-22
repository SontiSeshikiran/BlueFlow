/**
 * useParticleSettings - Particle visualization settings
 * 
 * Manages settings for the particle animation system:
 * - Density (number of particles)
 * - Opacity (line transparency)
 * - Speed (animation speed)
 * - Traffic type (all/hidden/general)
 * - Path mode (city/country)
 * - Relay size scale
 * - Filter relays by traffic
 */

import { useState, useCallback } from 'react';

import { config } from '../config';

export type TrafficType = 'all' | 'hidden' | 'general';
export type PathMode = 'city' | 'country';

export interface UseParticleSettingsResult {
  /** Line density factor (0-1, default 0.5) */
  density: number;
  setDensity: (value: number) => void;

  /** Line opacity factor (0-1, default 0.5) */
  opacity: number;
  setOpacity: (value: number) => void;

  /** Line speed factor (0-1, default 0.5) */
  speed: number;
  setSpeed: (value: number) => void;

  /** Relay marker size scale (0-1, default 0.5 = 1x) */
  relaySize: number;
  setRelaySize: (value: number) => void;

  /** Traffic type filter */
  trafficType: TrafficType;
  setTrafficType: (value: TrafficType) => void;

  /** Path aggregation mode */
  pathMode: PathMode;
  setPathMode: (value: PathMode) => void;

  /** Whether to filter relays to match traffic routes */
  filterRelaysByTraffic: boolean;
  setFilterRelaysByTraffic: (value: boolean) => void;

  /** Path width/offset spread (0-1, default 0.5) */
  pathWidth: number;
  setPathWidth: (value: number) => void;

  /** Particle count factor (0-1, default 0.5) */
  particleCount: number;
  setParticleCount: (value: number) => void;

  /** Scale particle size by zoom level */
  scaleByZoom: boolean;
  setScaleByZoom: (value: boolean) => void;

  /** Scale particle count by route bandwidth */
  scaleByBandwidth: boolean;
  setScaleByBandwidth: (value: boolean) => void;

  /** Multiplier for particle size (0.1-1.0) */
  particleSize: number;
  setParticleSize: (value: number) => void;

  /** Percentage of top nodes to show (0.1-1.0) */
  nodeDensity: number;
  setNodeDensity: (value: number) => void;

  /** Scale node size by bandwidth instead of count */
  scaleNodesByBandwidth: boolean;
  setScaleNodesByBandwidth: (value: boolean) => void;

  /** Visible node indices from particle worker */
  visibleNodeIndices: Set<number>;
  setVisibleNodeIndices: (indices: Set<number>) => void;

  /** Track which data version the indices belong to */
  indicesDataVersion: string | null;
  setIndicesDataVersion: (version: string | null) => void;

  /** Reset all settings to defaults */
  resetToDefaults: () => void;
}

/**
 * Manage particle visualization settings
 */
export function useParticleSettings(): UseParticleSettingsResult {
  // Line settings (Initial values from config headers)
  const [density, setDensity] = useState<number>(config.uiDefaults.density);
  const [opacity, setOpacity] = useState<number>(config.uiDefaults.opacity);
  const [speed, setSpeed] = useState<number>(config.uiDefaults.speed);
  const [relaySize, setRelaySize] = useState<number>(config.uiDefaults.relaySize);

  // Traffic settings
  const [trafficType, setTrafficType] = useState<TrafficType>('all');
  const [pathMode, setPathMode] = useState<PathMode>('city');
  const [filterRelaysByTraffic, setFilterRelaysByTraffic] = useState(false);

  // TorFlow-inspired settings
  const [pathWidth, setPathWidth] = useState<number>(config.uiDefaults.pathWidth);
  const [particleCount, setParticleCount] = useState<number>(config.uiDefaults.particleCount);
  const [scaleByZoom, setScaleByZoom] = useState<boolean>(config.uiDefaults.scaleByZoom);
  const [scaleByBandwidth, setScaleByBandwidth] = useState<boolean>(config.uiDefaults.scaleByBandwidth);
  const [particleSize, setParticleSize] = useState<number>(config.uiDefaults.particleSize);
  const [nodeDensity, setNodeDensity] = useState<number>(config.uiDefaults.nodeDensity);
  const [scaleNodesByBandwidth, setScaleNodesByBandwidth] = useState<boolean>(config.uiDefaults.scaleNodesByBandwidth);

  // Visible node tracking (from particle worker)
  const [visibleNodeIndices, setVisibleNodeIndices] = useState<Set<number>>(new Set());
  const [indicesDataVersion, setIndicesDataVersion] = useState<string | null>(null);

  /**
   * Reset all settings to defaults
   */
  const resetToDefaults = useCallback(() => {
    setDensity(config.uiDefaults.density);
    setOpacity(config.uiDefaults.opacity);
    setSpeed(config.uiDefaults.speed);
    setRelaySize(config.uiDefaults.relaySize);
    setTrafficType('all');
    setPathMode('city');
    setFilterRelaysByTraffic(false);
    setPathWidth(config.uiDefaults.pathWidth);
    setParticleCount(config.uiDefaults.particleCount);
    setScaleByZoom(config.uiDefaults.scaleByZoom);
    setScaleByBandwidth(config.uiDefaults.scaleByBandwidth);
    setParticleSize(config.uiDefaults.particleSize);
    setNodeDensity(config.uiDefaults.nodeDensity);
    setScaleNodesByBandwidth(config.uiDefaults.scaleNodesByBandwidth);
  }, []);

  return {
    density,
    setDensity,
    opacity,
    setOpacity,
    speed,
    setSpeed,
    relaySize,
    setRelaySize,
    trafficType,
    setTrafficType,
    pathMode,
    setPathMode,
    filterRelaysByTraffic,
    setFilterRelaysByTraffic,
    pathWidth,
    setPathWidth,
    particleCount,
    setParticleCount,
    scaleByZoom,
    setScaleByZoom,
    scaleByBandwidth,
    setScaleByBandwidth,
    particleSize,
    setParticleSize,
    nodeDensity,
    setNodeDensity,
    scaleNodesByBandwidth,
    setScaleNodesByBandwidth,
    visibleNodeIndices,
    setVisibleNodeIndices,
    indicesDataVersion,
    setIndicesDataVersion,
    resetToDefaults,
  };
}

