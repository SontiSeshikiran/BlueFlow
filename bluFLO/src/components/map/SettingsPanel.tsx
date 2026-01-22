interface SettingsPanelProps {
  show: boolean;
  pathMode: 'city' | 'country';
  setPathMode: (mode: 'city' | 'country') => void;
  trafficType: 'all' | 'hidden' | 'general';
  setTrafficType: (type: 'all' | 'hidden' | 'general') => void;
  density: number;
  setDensity: (val: number) => void;
  opacity: number;
  setOpacity: (val: number) => void;
  speed: number;
  setSpeed: (val: number) => void;
  relaySize: number;
  setRelaySize: (val: number) => void;
  filterRelaysByTraffic: boolean;
  setFilterRelaysByTraffic: (val: boolean) => void;
  trafficEnabled: boolean;
  // TorFlow-inspired settings
  pathWidth: number;
  setPathWidth: (val: number) => void;
  particleCount: number;
  setParticleCount: (val: number) => void;
  scaleByZoom: boolean;
  setScaleByZoom: (val: boolean) => void;
  scaleByBandwidth: boolean;
  setScaleByBandwidth: (val: boolean) => void;
  particleSize: number;
  setParticleSize: (val: number) => void;
  nodeDensity: number;
  setNodeDensity: (val: number) => void;
  scaleNodesByBandwidth: boolean;
  setScaleNodesByBandwidth: (val: boolean) => void;
}

export default function SettingsPanel({
  show,
  pathMode,
  setPathMode,
  trafficType,
  setTrafficType,
  density,
  setDensity,
  opacity,
  setOpacity,
  speed,
  setSpeed,
  relaySize,
  setRelaySize,
  filterRelaysByTraffic,
  setFilterRelaysByTraffic,
  trafficEnabled,
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
}: SettingsPanelProps) {
  if (!show) return null;

  return (
    <div className="absolute bottom-0 left-10 ml-2 bg-black/80 backdrop-blur-md rounded-lg p-3 border border-tor-green/20 w-52 shadow-lg animate-fade-in z-20 max-h-[70vh] overflow-y-auto">

      {/* NODE SETTINGS Header */}
      <h3 className="text-tor-green text-xs font-bold mb-3 uppercase tracking-wider">Node Settings</h3>

      {/* Node Circle Size Slider */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
          <span>Circle Size</span>
          <span>{(relaySize * 100).toFixed(0)}%</span>
        </div>
        <input
          type="range"
          min="0.01"
          max="1.0"
          step="0.01"
          value={relaySize}
          onChange={(e) => setRelaySize(parseFloat(e.target.value))}
          className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />
      </div>

      {/* Node Density Slider */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
          <span
            className="cursor-help border-b border-dotted border-gray-500"
            title="Controls the number of relay nodes shown on the map"
          >
            Node Count
          </span>
          <span>{(nodeDensity * 100).toFixed(0)}%</span>
        </div>
        <input
          type="range"
          min="0.1"
          max="1.0"
          step="0.05"
          value={nodeDensity}
          onChange={(e) => setNodeDensity(parseFloat(e.target.value))}
          className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          title="Controls the number of relay nodes shown on the map"
        />
      </div>

      {/* Scale Nodes by Bandwidth Toggle */}
      <div className="mb-3">
        <div className="flex items-center justify-between">
          <span
            className="text-[10px] text-gray-400 cursor-help border-b border-dotted border-gray-500"
            title="Scale node size relative to its bandwidth contribution"
          >
            Scale by Bandwidth
          </span>
          <button
            onClick={() => setScaleNodesByBandwidth(!scaleNodesByBandwidth)}
            className={`w-8 h-4 rounded-full transition-colors relative ${scaleNodesByBandwidth ? 'bg-cyan-400' : 'bg-gray-700'
              }`}
          >
            <div
              className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${scaleNodesByBandwidth ? 'translate-x(1.25rem)' : 'translate-x(0.125rem)'
                }`}
            />
          </button>
        </div>
      </div>

      {/* Display Relays Toggle */}
      <div className="mb-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-1">
          <span>Filter Display</span>
          <span
            className="text-gray-500 hover:text-tor-green transition-colors cursor-help"
            title="When traffic flows enabled, 'Traffic Only' shows only relays in those flows"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setFilterRelaysByTraffic(false)}
            className={`flex-1 px-2 py-1.5 rounded text-[10px] font-medium transition-colors ${!filterRelaysByTraffic ? 'bg-cyan-400 text-black' : 'bg-white/10 text-gray-400 hover:bg-white/20'
              }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterRelaysByTraffic(true)}
            disabled={!trafficEnabled}
            className={`flex-1 px-2 py-1.5 rounded text-[10px] font-medium transition-colors ${filterRelaysByTraffic
              ? 'bg-cyan-400 text-black'
              : trafficEnabled ? 'bg-white/10 text-gray-400 hover:bg-white/20' : 'bg-white/5 text-gray-600 cursor-not-allowed'
              }`}
            title={trafficEnabled ? '' : 'Enable traffic flows first'}
          >
            Traffic
          </button>
        </div>
      </div>

      {/* PARTICLE SETTINGS Header */}
      <h3 className="text-tor-green text-xs font-bold mb-3 uppercase tracking-wider">Particle Settings</h3>

      {/* Path Mode Selector */}
      <div className="mb-3">
        <div className="text-[10px] text-gray-400 mb-1">Path Mode</div>
        <div className="flex gap-1">
          <button
            onClick={() => setPathMode('city')}
            className={`flex-1 px-2 py-1.5 rounded text-[10px] font-medium transition-colors ${pathMode === 'city'
              ? 'bg-tor-green text-black'
              : 'bg-white/10 text-gray-400 hover:bg-white/20'
              }`}
          >
            City
          </button>
          <button
            onClick={() => setPathMode('country')}
            className={`flex-1 px-2 py-1.5 rounded text-[10px] font-medium transition-colors ${pathMode === 'country'
              ? 'bg-tor-green text-black'
              : 'bg-white/10 text-gray-400 hover:bg-white/20'
              }`}
          >
            Country
          </button>
        </div>
      </div>

      {/* Traffic Type Selector */}
      <div className="mb-3">
        <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-1">
          <span>Traffic Type</span>
          <a
            href="https://metrics.torproject.org/hidserv-dir-onions-seen.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-tor-green transition-colors"
            title="Hidden service traffic is ~3-6% of Tor traffic (estimated). Click to learn more."
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </a>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setTrafficType('all')}
            className={`flex-1 px-2 py-1.5 rounded text-[10px] font-medium transition-colors ${trafficType === 'all'
              ? 'bg-cyan-500 text-black'
              : 'bg-white/10 text-gray-400 hover:bg-white/20'
              }`}
          >
            All
          </button>
          <button
            onClick={() => setTrafficType('general')}
            className={`flex-1 px-2 py-1.5 rounded text-[10px] font-medium transition-colors ${trafficType === 'general'
              ? 'bg-tor-green text-black'
              : 'bg-white/10 text-gray-400 hover:bg-white/20'
              }`}
          >
            General
          </button>
          <button
            onClick={() => setTrafficType('hidden')}
            className={`flex-1 px-2 py-1.5 rounded text-[10px] font-medium transition-colors ${trafficType === 'hidden'
              ? 'bg-tor-orange text-black'
              : 'bg-white/10 text-gray-400 hover:bg-white/20'
              }`}
            title="~3-6% of Tor traffic goes to .onion hidden services (estimated from academic research)"
          >
            Hidden
          </button>
        </div>
      </div>

      {/* Top Bandwidth Routes Slider */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
          <span
            className="cursor-help border-b border-dotted border-gray-500"
            title="Show the top N% of routes by bandwidth contribution"
          >
            Top Bandwidth Routes
          </span>
          <span>{(density * 100).toFixed(0)}%</span>
        </div>
        <input
          type="range"
          min="0.01"
          max="1.0"
          step="0.01"
          value={density}
          onChange={(e) => setDensity(parseFloat(e.target.value))}
          className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-tor-green"
          title="Show the top N% of routes by bandwidth contribution"
        />
      </div>

      {/* Opacity Slider */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
          <span>Opacity</span>
          <span>{(opacity * 100).toFixed(0)}%</span>
        </div>
        <input
          type="range"
          min="0.1"
          max="1.0"
          step="0.1"
          value={opacity}
          onChange={(e) => setOpacity(parseFloat(e.target.value))}
          className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-tor-green"
        />
      </div>

      {/* Speed Slider */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
          <span>Speed</span>
          <span>{(speed * 100).toFixed(0)}%</span>
        </div>
        <input
          type="range"
          min="0.1"
          max="1.0"
          step="0.1"
          value={speed}
          onChange={(e) => setSpeed(parseFloat(e.target.value))}
          className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-tor-green"
        />
      </div>

      {/* Path Width Slider */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
          <span
            className="cursor-help border-b border-dotted border-gray-500"
            title="Controls how spread out the particle paths are"
          >
            Path Width
          </span>
          <span>{(pathWidth * 100).toFixed(0)}%</span>
        </div>
        <input
          type="range"
          min="0.1"
          max="1.0"
          step="0.05"
          value={pathWidth}
          onChange={(e) => setPathWidth(parseFloat(e.target.value))}
          className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-tor-green"
          title="Controls how spread out the particle paths are"
        />
      </div>

      {/* Particle Count Slider */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
          <span
            className="cursor-help border-b border-dotted border-gray-500"
            title="Controls the number of flowing particles"
          >
            Particle Count
          </span>
          <span>{(particleCount * 100).toFixed(0)}%</span>
        </div>
        <input
          type="range"
          min="0.1"
          max="1.0"
          step="0.05"
          value={particleCount}
          onChange={(e) => setParticleCount(parseFloat(e.target.value))}
          className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-tor-green"
          title="Controls the number of flowing particles"
        />
      </div>

      {/* Particle Size Slider */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
          <span
            className="cursor-help border-b border-dotted border-gray-500"
            title="Controls the base size of all flowing particles"
          >
            Particle Size
          </span>
          <span>{(particleSize * 100).toFixed(0)}%</span>
        </div>
        <input
          type="range"
          min="0.1"
          max="1.0"
          step="0.05"
          value={particleSize}
          onChange={(e) => setParticleSize(parseFloat(e.target.value))}
          className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-tor-green"
          title="Controls the base size of all flowing particles"
        />
      </div>

      {/* Scale by Zoom Toggle */}
      <div className="mb-3">
        <div className="flex items-center justify-between">
          <span
            className="text-[10px] text-gray-400 cursor-help border-b border-dotted border-gray-500"
            title="When enabled, particle size scales with map zoom level"
          >
            Scale Size by Zoom
          </span>
          <button
            onClick={() => setScaleByZoom(!scaleByZoom)}
            className={`w-8 h-4 rounded-full transition-colors relative ${scaleByZoom ? 'bg-tor-green' : 'bg-gray-600'
              }`}
          >
            <span
              className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${scaleByZoom ? 'left-4' : 'left-0.5'
                }`}
            />
          </button>
        </div>
      </div>

      {/* Scale by Bandwidth Toggle */}
      <div>
        <div className="flex items-center justify-between">
          <span
            className="text-[10px] text-gray-400 cursor-help border-b border-dotted border-gray-500"
            title="When enabled, particle count scales with route bandwidth"
          >
            Scale Count by Bandwidth
          </span>
          <button
            onClick={() => setScaleByBandwidth(!scaleByBandwidth)}
            className={`w-8 h-4 rounded-full transition-colors relative ${scaleByBandwidth ? 'bg-tor-green' : 'bg-gray-600'
              }`}
          >
            <span
              className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${scaleByBandwidth ? 'left-4' : 'left-0.5'
                }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
