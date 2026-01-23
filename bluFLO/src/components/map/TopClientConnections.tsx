import React from 'react';

interface TopClientConnectionsProps {
    show: boolean;
    isVisible: boolean;
    onToggle: (visible: boolean) => void;
    countryOpacity: number;
    onOpacityChange: (value: number) => void;
    topCountryCount: number;
    onCountryCountChange: (value: number) => void;
    onClose: () => void;
    countryData: any;
    countryNames: Record<string, string>;
}

/**
 * TopClientConnections - Torflow-style control panel for country choropleth layer
 * 
 * Controls:
 * - Opacity slider (0.00 - 1.00)
 * - Country Count (top n) slider (5 - 200)
 */
export default function TopClientConnections({
    show,
    isVisible,
    onToggle,
    countryOpacity,
    onOpacityChange,
    topCountryCount,
    onCountryCountChange,
    onClose,
    countryData,
    countryNames,
}: TopClientConnectionsProps) {
    if (!show) return null;

    // Calculate top countries
    const topCountries = Object.entries(countryData)
        .map(([code, data]: [string, any]) => ({
            code,
            name: countryNames[code] || code,
            count: typeof data === 'number' ? data : data.count,
        }))
        .filter(c => c.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, topCountryCount);

    return (
        <div className="absolute bottom-24 left-14 w-60 bg-black/90 backdrop-blur-md rounded-lg border border-white/10 shadow-lg z-20 animate-fade-in">
            {/* Header with checkbox toggle */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
                <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={(e) => onToggle(e.target.checked)}
                    className="w-4 h-4 accent-tor-green cursor-pointer"
                    id="top-client-toggle"
                />
                <label
                    htmlFor="top-client-toggle"
                    className="text-white text-sm font-medium cursor-pointer select-none"
                >
                    Top Client Connections
                </label>
            </div>

            {/* Controls body */}
            <div className="p-3 space-y-4">
                {/* Opacity slider */}
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                        <label className="text-gray-400 text-[10px] uppercase font-semibold tracking-wider">Opacity</label>
                        <span className="text-gray-300 text-xs font-mono">
                            {countryOpacity.toFixed(2)}
                        </span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={countryOpacity}
                        onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
                        className="w-full h-1.5 accent-cyan-500 cursor-pointer bg-white/10 rounded-lg appearance-none"
                    />
                </div>

                {/* Country Count slider */}
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                        <label className="text-gray-400 text-[10px] uppercase font-semibold tracking-wider">Country Count</label>
                        <span className="text-gray-300 text-xs font-mono">
                            {topCountryCount}
                        </span>
                    </div>
                    <input
                        type="range"
                        min="5"
                        max="200"
                        step="1"
                        value={topCountryCount}
                        onChange={(e) => onCountryCountChange(parseInt(e.target.value, 10))}
                        className="w-full h-1.5 accent-cyan-500 cursor-pointer bg-white/10 rounded-lg appearance-none"
                    />
                </div>
            </div>
            {/* Top Countries List */}
            <div className="border-t border-white/10 max-h-48 overflow-y-auto custom-scrollbar">
                {topCountries.length > 0 ? (
                    <table className="w-full text-left text-xs text-gray-400">
                        <thead className="sticky top-0 bg-black/90 text-[10px] text-gray-500 uppercase">
                            <tr>
                                <th className="px-3 py-1 font-normal">Rank</th>
                                <th className="px-1 py-1 font-normal text-right">Count</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topCountries.map((country, i) => (
                                <tr key={country.code} className="hover:bg-white/5 transition-colors">
                                    <td className="px-3 py-1 truncate max-w-[120px]" title={country.name}>
                                        <span className="text-gray-500 mr-1">{i + 1}.</span>
                                        {country.name}
                                    </td>
                                    <td className="px-1 py-1 text-right font-mono text-[10px] text-red-500 pr-3">
                                        {country.count.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="px-4 py-8 text-center">
                        <div className="text-gray-500 text-xs italic mb-1">No connection data for this date</div>
                        <div className="text-gray-600 text-[10px] leading-relaxed">
                            Tor Metrics data has a ~3-day delay.<br />
                            Try selecting an earlier date.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
