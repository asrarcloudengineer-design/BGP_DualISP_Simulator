import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Server, Home, Globe, AlertCircle, CheckCircle, Info, Activity, ShieldCheck, InfoIcon, Calculator, RefreshCw, Link2, Zap, LayoutList, ChevronDown, Cpu, Network, BookOpen, Lock, HardHat, Code, Anchor, MessageSquare, Database, TrendingUp, Hash, Settings, Shield, Binary } from 'lucide-react';

/**
 * CONSTANTS & UTILITY FUNCTIONS FOR SUBNETTING & BGP
 */
const possibleClasses = ['A', 'B', 'C'];
const BGP_PEERING_RANGE_CIDR = 16;
const BGP_PEERING_RANGE_IP = '192.168.0.0';

// Initial ISP configuration is now flexible to support custom AS numbers
const initialIspA = { name: 'ISP A', block: '10.0.0.0', cidr: 8, as: 65001 };
const initialIspB = { name: 'ISP B', block: '172.16.0.0', cidr: 12, as: 65002 };

// Utility to determine AS type
const getAsType = (asNumber) => {
    if (asNumber >= 1 && asNumber <= 64511) return 'Public (16-bit)';
    if (asNumber >= 64512 && asNumber <= 65534) return 'Private (16-bit)';
    if (asNumber === 0 || asNumber === 65535) return 'Reserved';
    if (asNumber >= 65536) return '32-bit (4-byte)';
    return 'Invalid';
};

// --- IP Utility Functions (Same as before) ---

const ipToLong = (ip) => {
  const parts = ip.split('.');
  if (parts.length !== 4 || parts.some(p => isNaN(parseInt(p)))) return null;
  return ((parseInt(parts[0], 10) << 24) |
          (parseInt(parts[1], 10) << 16) |
          (parseInt(parts[2], 10) << 8) |
           parseInt(parts[3], 10)) >>> 0;
};

const longToIp = (long) => {
  return [
    (long >>> 24) & 0xFF,
    (long >>> 16) & 0xFF,
    (long >>> 8) & 0xFF,
    long & 0xFF
  ].join('.');
};

const isIpInSubnet = (ipLong, networkLong, cidr) => {
    const mask = ~((1 << (32 - cidr)) - 1);
    return (ipLong & mask) === (networkLong & mask);
};

const calculateSubnet = (ip, cidr) => {
  const ipLong = ipToLong(ip);
  if (ipLong === null || cidr < 1 || cidr > 30) return null; // CIDR min changed to 1 for generic calculator
  
  const mask = ~((1 << (32 - cidr)) - 1);
  const networkLong = (ipLong & mask) >>> 0;
  const broadcastLong = (networkLong | ~mask) >>> 0;
  
  const usableStart = (networkLong + 1) >>> 0;
  const usableEnd = (broadcastLong - 1) >>> 0;
  
  const hosts = Math.max(0, usableEnd > usableStart ? usableEnd - usableStart + 1 : 0);

  const houseIps = [];
  const maxDisplayableHosts = Math.min(hosts, 256);
  for (let i = 0; i < maxDisplayableHosts; i++) {
    houseIps.push(longToIp(usableStart + i));
  }

  return {
    networkAddress: longToIp(networkLong),
    broadcastAddress: longToIp(broadcastLong),
    firstHost: longToIp(usableStart),
    lastHost: longToIp(usableEnd),
    totalHosts: hosts,
    networkLong,
    broadcastLong,
    houseIps
  };
};

/**
 * NEW: Binary Conversion Utilities
 */
const octetToBinary = (octet) => {
    return parseInt(octet, 10).toString(2).padStart(8, '0');
};

const ipToBinary = (ip) => {
    const parts = ip.split('.');
    if (parts.length !== 4) return 'Invalid IP';
    return parts.map(octetToBinary).join('.');
};

const cidrToBinaryMask = (cidr) => {
    const mask = '1'.repeat(cidr) + '0'.repeat(32 - cidr);
    return [
        mask.substring(0, 8),
        mask.substring(8, 16),
        mask.substring(16, 24),
        mask.substring(24, 32)
    ].join('.');
};

// Define 30 zones split across the two ISPs (Same as before)
const generateBaseZoneDefinitions = (ispA, ispB) => {
    const zones = [];
    const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
    const colors = ["border-green-500", "border-blue-500", "border-orange-500", "border-purple-500", "border-red-500", "border-yellow-500"];
    
    for (let i = 1; i <= 30; i++) {
        const ispId = i <= 15 ? 'A' : 'B';
        const ispData = ispId === 'A' ? ispA : ispB;
        zones.push({
            id: i, 
            name: `Sector ${String(i).padStart(2, '0')}`, 
            hostsRequired: Math.floor(Math.random() * 241) + 10,
            reqClass: possibleClasses[Math.floor(Math.random() * possibleClasses.length)],
            ispId: ispId,
            color: colors[i % colors.length], 
            bg: `${colors[i % colors.length].replace('border-', 'bg-')}/20`, 
            position: positions[i % positions.length],
            status: "offline",
            config: { ip: "", cidr: 24, ispSource: ispId },
            message: "Waiting for connection...",
            realData: null,
            houseIps: []
        });
    }
    return zones;
};

// Mapping for the 4 primary zones shown on the visual map
const roadPaths = {
    1: "M 20 20 L 40 40", // Sector 01 to ISP A
    2: "M 80 20 L 60 40", // Sector 02 to ISP B
    3: "M 20 80 L 40 60", // Sector 03 to ISP A
    4: "M 80 80 L 60 60", // Sector 04 to ISP B
};

/**
 * Component: Household IP List (Same as before)
 */
const HouseholdIPList = ({ zone }) => (
    <div className='mt-4 p-3 bg-slate-900 rounded-lg max-h-48 overflow-y-auto border border-slate-700'>
        <h4 className="text-xs font-bold text-cyan-400 uppercase mb-2 flex items-center gap-1">
            <Cpu size={12} /> Assigned Host IPs ({zone.hostsRequired} required)
        </h4>
        <div className="space-y-1">
            {zone.houseIps.slice(0, zone.hostsRequired).map((ip, index) => (
                <div key={index} className="flex justify-between items-center text-xs font-mono text-slate-300">
                    <span>House #{index + 1}</span>
                    <span className='bg-black/30 px-1 rounded'>{ip}</span>
                </div>
            ))}
            {zone.houseIps.length > zone.hostsRequired && (
                <p className="text-xs text-yellow-500 mt-2">
                    Note: {zone.houseIps.length - zone.hostsRequired} IPs are unused.
                </p>
            )}
            {zone.realData && zone.realData.totalHosts < zone.hostsRequired && (
                <p className="text-xs text-red-500 mt-2">
                    Error: Subnet provided only {zone.realData.totalHosts} usable hosts, which is less than the required {zone.hostsRequired}.
                </p>
            )}
        </div>
    </div>
);

/**
 * Component: Network Advisor (Tips and Vulnerabilities) (Same as before, updated to include LOCAL_PREF context)
 */
const NetworkAdvisor = ({ currentTab, ispAConfig, ispBConfig, peeringConfig, selectedZone, ispAData, ispBData }) => {
    let title = "Network Design Best Practices";
    let icon = <HardHat size={16} className="text-yellow-400" />;
    let guidance = [];

    const isIspAConfigured = ispAConfig.iBGPStatus === 'configured';
    const isIspBConfigured = ispBConfig.iBGPStatus === 'configured';
    const isPeeringConfigured = peeringConfig.status === 'configured';
    const isReadyForZone = isIspAConfigured && isIspBConfigured && isPeeringConfigured;
    
    if (currentTab === 'A' || currentTab === 'B') {
        const ispId = currentTab;
        const ispData = ispId === 'A' ? ispAData : ispBData;
        const config = ispId === 'A' ? ispAConfig : ispBConfig;

        title = `${ispData.name} (AS ${ispData.as}) Policy & iBGP`;
        icon = <Settings size={16} className="text-purple-400" />;
        guidance = [
            { type: 'Header', text: `Autonomous System (AS) Type: ${config.asType}` },
            { type: 'Instruction', text: `An AS is a collection of IP networks managed by a single entity. It requires a unique AS number to exchange routes with other ASes (eBGP).` },
            { type: 'Tip', text: "Private AS numbers (64512-65534) are used for internal labs or small networks that don't peer directly with the public internet. 32-bit ASes (>=65536) extend address space." },
            { type: 'Header', text: 'BGP Policy: LOCAL_PREF (Local Preference)' },
            { type: 'Instruction', text: `LOCAL_PREF is the most important policy attribute for choosing outbound routes. It is ONLY advertised and used *within* the AS (iBGP).` },
            { type: 'Tip', text: "Higher LOCAL_PREF is better. Default value is usually 100. If ISP A had two exit paths to the Internet, setting one LOCAL_PREF to 200 and the other to 100 would force all local traffic to prefer the 200 path." },
            { type: 'Vulnerability', text: "Misconfiguring LOCAL_PREF to a very low value can accidentally route all traffic through a backup, less optimal link." },
        ];
    } else if (currentTab === 'eBGP') {
        title = "eBGP Peering & External Routing (Inter-AS)";
        icon = <Anchor size={16} className="text-orange-400" />;
        guidance = [
            { type: 'Header', text: 'eBGP Peering Requirements' },
            { type: 'Instruction', text: "eBGP connects different Autonomous Systems (AS) and requires the **Remote AS** to be different from the **Local AS** for the session to form." },
            { type: 'Instruction', text: `The remote AS for ISP A is **${ispBData.as}** and the remote AS for ISP B is **${ispAData.as}**.` },
            { type: 'Tip', text: "The AS\_PATH attribute is how BGP prevents loops between ASes. Your AS number is prepended to the path when routes are advertised externally." },
            { type: 'Header', text: 'Policy Note: MED' },
            { type: 'Instruction', text: "While not configurable here, the Multi-Exit Discriminator (MED) is an eBGP attribute used to suggest the *best entry point* back into your AS from the neighbor's perspective. It's often compared to an IGP metric." },
            { type: 'Vulnerability', text: "A missing or incorrect AS number in the eBGP configuration will prevent the neighbor session from ever initializing." },
        ];
    } else if (currentTab === 'zone' && selectedZone) {
        const zoneIspData = selectedZone.ispId === 'A' ? ispAData : ispBData;
        title = `Zone ${selectedZone.name} Subnetting (VLSM) - AS ${zoneIspData.as}`;
        icon = <Database size={16} className="text-cyan-400" />;
        guidance = [
            { type: 'Header', text: 'Route Advertisement' },
            { type: 'Instruction', text: `When connected, this subnet is advertised into the local AS (iBGP) and then propagated across the eBGP link to the neighboring AS (${zoneIspData.as === ispAData.as ? ispBData.as : ispAData.as}).` },
            { type: 'Instruction', text: `The advertisement carries the AS\_PATH of the originating AS (${zoneIspData.as}).` },
            { type: 'Tip', text: "VLSM is crucial for efficiency. If your required hosts are 100, a /25 (126 hosts) is more efficient than a /24 (254 hosts). However, for this sim, we only check for minimum host requirements." },
        ];
    } else if (currentTab === 'calc') {
        title = "IPv4 & Binary Operations";
        icon = <Binary size={16} className="text-teal-400" />;
        guidance = [
            { type: 'Header', text: 'Why Binary?' },
            { type: 'Instruction', text: "The router performs all subnetting operations by converting the IP address and the subnet mask into binary and then using the logical AND operation to determine the network address." },
            { type: 'Tip', text: "The subnet mask defines the boundary: 1s are the Network portion, 0s are the Host portion. For example, a /24 mask has 24 ones and 8 zeros, meaning 8 bits are left for hosts (2^8 = 256 addresses)." },
        ];
    } else if (isReadyForZone) {
        title = "Configuration Complete - Policy Applied";
        icon = <TrendingUp size={16} className="text-green-400" />;
        guidance = [
            { type: 'Instruction', text: "All core BGP links (iBGP and eBGP) are successfully established. Routing policies are active." },
            { type: 'Instruction', text: "If the Local Pref values are different (e.g., A=200, B=100), this simulates an imbalance where traffic would prefer one ISP's path for all external routes, assuming multiple paths existed." },
            { type: 'Tip', text: "Next Step: Switch to the **Zones** tab to begin allocating customer subnets. Your allocation simulates the route advertisement via BGP." },
        ];
    } else {
        title = "Initial Setup: BGP Required";
        icon = <MessageSquare size={16} className="text-slate-400" />;
        guidance = [
            { type: 'Instruction', text: "To begin, you must first establish the BGP routing plane. Start with **ISP A** and **ISP B** to configure iBGP and its Local Preference policy, then proceed to the **eBGP** link." },
        ];
    }

    return (
        <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600 space-y-3">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                {icon}
                Network Advisor: {title}
            </h3>
            <div className="space-y-3 text-xs">
                {guidance.map((item, index) => (
                    <div key={index} className="flex items-start gap-2">
                        {item.type === 'Instruction' && <InfoIcon size={16} className="text-cyan-400 shrink-0 mt-0.5" />}
                        {item.type === 'Tip' && <CheckCircle size={16} className="text-yellow-400 shrink-0 mt-0.5" />}
                        {item.type === 'Vulnerability' && <Lock size={16} className="text-red-400 shrink-0 mt-0.5" />}
                        {item.type === 'Header' && <Hash size={16} className="text-slate-300 shrink-0 mt-0.5" />}

                        {item.type === 'Header' ? (
                            <p className="font-bold text-slate-200 mt-0.5 border-b border-slate-600 w-full pb-1">{item.text}</p>
                        ) : (
                            <p className={`text-slate-300 ${item.type === 'Tip' ? 'text-yellow-300' : item.type === 'Vulnerability' ? 'text-red-300' : ''}`}>
                                {item.text}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};


/**
 * NEW: IPv4 & Binary Calculator Component
 */
const IPv4BinaryCalculator = () => {
    const [ip, setIp] = useState('192.168.1.100');
    const [cidr, setCidr] = useState(24);
    const [networkDetails, setNetworkDetails] = useState(null);

    useEffect(() => {
        const details = calculateSubnet(ip, cidr);
        setNetworkDetails(details);
    }, [ip, cidr]);

    const ipParts = ip.split('.');
    const ipBinary = ipToBinary(ip);
    const maskBinary = cidrToBinaryMask(cidr);
    const isValidIp = ipToLong(ip) !== null && ipParts.length === 4 && ipParts.every(p => p >= 0 && p <= 255);
    const isValidCidr = cidr >= 1 && cidr <= 30;

    const getNetworkUseCase = (cidr) => {
        if (!isValidCidr) return "Please enter a valid CIDR (1-30).";
        
        switch (true) {
            case cidr <= 8:
                return "Massive Enterprise/ISP Backbone (e.g., /8): This allocation provides over 16 million usable addresses. It is typically used for entire continents, global ISPs, or very large legacy networks. [Image of global network infrastructure]";
            case cidr <= 12:
                return "Major Regional Network (e.g., /12): Providing over 1 million hosts, these blocks are suitable for major regional ISPs or large private campus networks spanning multiple states or countries. ";
            case cidr <= 16:
                return "Large Campus or Metro Network (e.g., /16): With 65,534 usable hosts, this is common for large corporate campuses, universities, or metropolitan area networks. Useful for VLSM distribution. [Image of university campus network map]";
            case cidr <= 24:
                return "Standard Enterprise LAN (e.g., /24): The most common network size, providing 254 usable hosts. Perfect for a standard office, a floor in a building, or a small business data center. ";
            case cidr <= 26:
                return "Medium Subnet / VLSM (e.g., /26): Provides 62 usable hosts. Excellent for subnetting a larger network into smaller, manageable departments or server racks to improve efficiency and reduce broadcast traffic. ";
            case cidr <= 28:
                return "Small Subnet (e.g., /28): Provides 14 usable hosts. Often used for critical services like management VLANs, specific hardware like firewalls, or small remote branch offices. ";
            case cidr <= 30:
                return "Point-to-Point Link (e.g., /30): Provides only 2 usable hosts. This is the standard, most efficient size for connecting two routers directly (like the eBGP link in this simulator). Saves IP addresses. ";
            default:
                return "Invalid CIDR entered. Please use a value between 1 and 30.";
        }
    };

    const NetworkDetails = ({ label, value, binary, isNetworkHost = false }) => (
        <div className="border border-slate-600 rounded-lg p-3 bg-slate-900/50">
            <h4 className={`text-sm font-semibold ${isNetworkHost ? 'text-green-400' : 'text-purple-400'}`}>{label}</h4>
            <div className='mt-1 space-y-1'>
                <p className="text-lg font-mono text-white break-words">{value}</p>
                <p className="text-xs font-mono text-slate-400 break-words">{binary}</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="bg-teal-700/50 p-4 rounded-lg border border-teal-600">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-white">
                    <Binary size={20} />
                    IPv4 & Binary Subnet Calculator
                </h3>

                {/* Input Fields */}
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-xs text-slate-200 mb-1">IP Address</label>
                        <input 
                            type="text" 
                            value={ip}
                            onChange={(e) => setIp(e.target.value)}
                            placeholder="e.g. 192.168.1.100"
                            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white font-mono focus:border-teal-500 focus:outline-none transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-200 mb-1">CIDR</label>
                        <div className="flex items-center gap-2">
                            <input 
                                type="number" 
                                min="1"
                                max="30"
                                value={cidr}
                                onChange={(e) => setCidr(parseInt(e.target.value) || 1)}
                                className="w-16 bg-slate-900 border border-slate-600 rounded p-2 text-white font-mono focus:border-teal-500 text-center focus:outline-none transition-colors"
                            />
                            <span className="font-mono bg-slate-900 px-3 py-1 rounded border border-slate-600 text-teal-400">/{cidr}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Calculations and Explanations */}
            {isValidIp && isValidCidr && networkDetails ? (
                <div className="space-y-6">
                    {/* Binary Conversion */}
                    <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                        <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Binary size={14} />
                            Binary Breakdown
                        </h3>
                        <div className="space-y-2 text-xs">
                            <div className='flex items-center justify-between'>
                                <span className='text-slate-300'>Input IP ({ip}):</span>
                                <span className="font-mono text-white p-1 rounded bg-black/30 text-right break-all">{ipBinary}</span>
                            </div>
                            <div className='flex items-center justify-between'>
                                <span className='text-slate-300'>Subnet Mask ({longToIp(~((1 << (32 - cidr)) - 1) >>> 0)}):</span>
                                <span className="font-mono text-yellow-300 p-1 rounded bg-black/30 text-right break-all">{maskBinary}</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                <span className='text-white'>1s = Network ID ({cidr} bits)</span> | <span className='text-yellow-300'>0s = Host ID ({32 - cidr} bits)</span>
                            </p>
                        </div>
                    </div>
                    
                    {/* Subnet Details */}
                    <div className="grid grid-cols-2 gap-4">
                        <NetworkDetails
                            label="Network Address"
                            value={networkDetails.networkAddress}
                            binary={ipToBinary(networkDetails.networkAddress)}
                            isNetworkHost={true}
                        />
                        <NetworkDetails
                            label="Broadcast Address"
                            value={networkDetails.broadcastAddress}
                            binary={ipToBinary(networkDetails.broadcastAddress)}
                            isNetworkHost={true}
                        />
                        <NetworkDetails
                            label="First Usable Host"
                            value={networkDetails.firstHost}
                            binary={ipToBinary(networkDetails.firstHost)}
                            isNetworkHost={false}
                        />
                        <NetworkDetails
                            label="Last Usable Host"
                            value={networkDetails.lastHost}
                            binary={ipToBinary(networkDetails.lastHost)}
                            isNetworkHost={false}
                        />
                    </div>

                    <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                        <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Hash size={14} />
                            Network Capacity
                        </h3>
                        <p className="text-2xl font-mono text-white">
                            {networkDetails.totalHosts.toLocaleString()}
                        </p>
                        <p className="text-slate-400 text-sm">Usable Host Addresses</p>
                    </div>

                    {/* Use Case Explanation */}
                    <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                        <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <BookOpen size={14} />
                            CIDR Use Case
                        </h3>
                        <p className="text-sm text-slate-300 whitespace-pre-line">
                            {getNetworkUseCase(cidr)}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4 pt-10">
                    <Calculator size={48} className="opacity-20" />
                    <p className="text-center px-8">Enter a valid IP address and CIDR (1-30) to calculate the network details and see how this network size is typically used.</p>
                </div>
            )}
        </div>
    );
};

/**
 * MAIN APP COMPONENT
 */
export default function App() {
  
  // Use useMemo for initial ISP data to ensure stability
  const initialIspAData = useMemo(() => ({ ...initialIspA, color: 'text-green-400', rangeLabel: '10.x.x.x' }), []);
  const initialIspBData = useMemo(() => ({ ...initialIspB, color: 'text-blue-400', rangeLabel: '172.16.x.x' }), []);

  const [ispAData, setIspAData] = useState(initialIspAData);
  const [ispBData, setIspBData] = useState(initialIspBData);
  
  const [zones, setZones] = useState(() => generateBaseZoneDefinitions(initialIspAData, initialIspBData));
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const selectedZone = useMemo(() => zones.find(z => z.id === selectedZoneId), [selectedZoneId, zones]);
  const [score, setScore] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [isListExpanded, setIsListExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState('A'); 

  // --- BGP Configuration States with Policy & AS Type ---
  const [ispAConfig, setIspAConfig] = useState({ 
    routerId: '', iBGPStatus: 'pending', message: '', 
    as: initialIspAData.as, asType: getAsType(initialIspAData.as),
    localPref: 100 
  });
  const [ispBConfig, setIspBConfig] = useState({ 
    routerId: '', iBGPStatus: 'pending', message: '', 
    as: initialIspBData.as, asType: getAsType(initialIspBData.as),
    localPref: 100 
  });
  const [peeringConfig, setPeeringConfig] = useState({
    ip: '', cidr: 30, remoteAs: initialIspBData.as, 
    status: 'pending', // pending, configured, error
    message: 'Enter Peering IP and Remote AS to establish the link.',
    realData: null
  });

  // --- Temporary Input States (for Zone Config) ---
  const [inputIp, setInputIp] = useState("");
  const [inputCidr, setInputCidr] = useState(24);
  const [inputIspSource, setInputIspSource] = useState('A'); // Tracks the ISP associated with the config

  // Sync inputs when selection changes
  useEffect(() => {
    if (activeTab === 'zone' && selectedZone) {
      setInputIp(selectedZone.config.ip || "");
      setInputCidr(selectedZone.config.cidr || 24);
      setInputIspSource(selectedZone.config.ispSource || selectedZone.ispId); 
    }
  }, [selectedZone, activeTab]);

  const isBGPReady = useMemo(() => 
    ispAConfig.iBGPStatus === 'configured' && 
    ispBConfig.iBGPStatus === 'configured' && 
    peeringConfig.status === 'configured'
  , [ispAConfig, ispBConfig, peeringConfig]);

  const updateZoneStatus = useCallback((index, status, message, config, data = null) => {
    setZones(prevZones => {
      const newZones = [...prevZones];
      newZones[index] = {
        ...newZones[index],
        status: status,
        message: message,
        config: config,
        realData: data ? { ...data, cidr: config.cidr } : newZones[index].realData,
        houseIps: data ? data.houseIps : []
      };
      return newZones;
    });
  }, []);

  const resetGame = () => {
    // Reset ISP data and regenerate zones based on defaults
    const newIspAData = { ...initialIspAData };
    const newIspBData = { ...initialIspBData };
    setIspAData(newIspAData);
    setIspBData(newIspBData);

    setZones(generateBaseZoneDefinitions(newIspAData, newIspBData));
    setSelectedZoneId(null);
    setScore(0);
    setActiveTab('A');
    
    // Reset BGP config, linking to new defaults
    setIspAConfig({ 
        routerId: '', iBGPStatus: 'pending', message: '', 
        as: newIspAData.as, asType: getAsType(newIspAData.as), localPref: 100 
    });
    setIspBConfig({ 
        routerId: '', iBGPStatus: 'pending', message: '', 
        as: newIspBData.as, asType: getAsType(newIspBData.as), localPref: 100 
    });
    setPeeringConfig({
        ip: '', cidr: 30, remoteAs: newIspBData.as, 
        status: 'pending',
        message: 'Enter Peering IP and Remote AS to establish the link.',
        realData: null
    });
  };

  const handleASNumberChange = (ispId, value) => {
    const num = parseInt(value, 10);
    const newAs = isNaN(num) || num < 1 ? '' : num;
    const newAsType = newAs === '' ? 'Invalid' : getAsType(newAs);

    const setConfig = ispId === 'A' ? setIspAConfig : setIspBConfig;
    const setData = ispId === 'A' ? setIspAData : setIspBData;

    setConfig(c => ({...c, as: newAs, asType: newAsType, iBGPStatus: 'pending', message: 'AS changed. Re-configure iBGP.'}));
    setData(d => ({...d, as: newAs}));
    
    // Auto-update remote AS in peering config if the peer is the default
    if (ispId === 'B') {
        setPeeringConfig(p => ({...p, remoteAs: newAs}));
    }
  };

  // --- BGP Configuration Handlers ---

  const handleConfigureIBGP = (ispId) => {
    const config = ispId === 'A' ? ispAConfig : ispBConfig;
    const setConfig = ispId === 'A' ? setIspAConfig : setIspBConfig;
    const ispData = ispId === 'A' ? ispAData : ispBData;
    
    // 1. Validate AS Number
    if (config.as === '' || config.as === 0 || config.asType === 'Invalid' || config.asType === 'Reserved') {
        setConfig(c => ({...c, iBGPStatus: 'error', message: 'Invalid or Reserved AS number.'}));
        return;
    }
    
    // 2. Validate Router ID format (Must be a valid IP address)
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(config.routerId) || ipToLong(config.routerId) === null) {
      setConfig(c => ({...c, iBGPStatus: 'error', message: 'Router ID must be a valid IP address (often a Loopback).'}));
      return;
    }
    
    // Success!
    setConfig(c => ({...c, iBGPStatus: 'configured', message: `iBGP established. LOCAL_PREF set to ${config.localPref}. (AS ${ispData.as}).`}));
    setScore(s => s + 100);
    
    // Auto-switch to the next logical step
    if (ispId === 'A' && ispBConfig.iBGPStatus === 'pending') {
        setActiveTab('B');
    } else if (ispId === 'B' && ispAConfig.iBGPStatus === 'configured' && peeringConfig.status === 'pending') {
        setActiveTab('eBGP');
    }
  };

  const handleConfigureEBGP = () => {
    const localAS = ispAConfig.as;
    const remoteAS = ispBConfig.as;
    
    // 1. BGP readiness check (iBGP must be up in both AS)
    if (ispAConfig.iBGPStatus !== 'configured' || ispBConfig.iBGPStatus !== 'configured') {
        setPeeringConfig(c => ({...c, status: 'error', message: 'iBGP must be established in both Autonomous Systems before eBGP peering.'}));
        return;
    }

    // 2. Basic Format Validation
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(peeringConfig.ip)) {
      setPeeringConfig(c => ({...c, status: 'error', message: 'Invalid IP Format for Link.'}));
      return;
    }

    // 3. Calculate Subnet and check against required range
    const subnetData = calculateSubnet(peeringConfig.ip, peeringConfig.cidr);
    const peeringBlockLong = ipToLong(BGP_PEERING_RANGE_IP);
    const ipLong = ipToLong(peeringConfig.ip);
    
    if (!subnetData || peeringConfig.cidr !== 30 || !isIpInSubnet(ipLong, peeringBlockLong, BGP_PEERING_RANGE_CIDR)) {
        setPeeringConfig(c => ({...c, status: 'error', message: `eBGP link must be a /30 subnet from the ${BGP_PEERING_RANGE_IP}/${BGP_PEERING_RANGE_CIDR} private range.`}));
        return;
    }

    // 4. Check AS configuration
    const requiredRemoteAS = remoteAS; 
    
    if (parseInt(peeringConfig.remoteAs) !== requiredRemoteAS) {
        setPeeringConfig(c => ({...c, status: 'error', message: `Invalid Remote AS. ISP A must peer with Remote AS ${requiredRemoteAS}.`}));
        return;
    }
    
    // 5. Check AS Self-Peering (Must be external)
    if (parseInt(peeringConfig.remoteAs) === localAS) {
        setPeeringConfig(c => ({...c, status: 'error', message: `Error: Cannot use Local AS (${localAS}) as Remote AS in eBGP peering.`}));
        return;
    }


    // 6. Check for Overlap (omitted for brevity, assume no overlap with fresh start, but should be checked in real logic)

    // Success!
    setPeeringConfig(c => ({
      ...c,
      status: 'configured',
      message: `eBGP Peering established between AS ${localAS} and Remote AS ${c.remoteAs}. Routes exchanged.`,
      realData: subnetData,
      ip: peeringConfig.ip,
      cidr: peeringConfig.cidr
    }));
    setScore(s => s + 300); // Big bonus for ISP backbone link
    setActiveTab('zone');
    setSelectedZoneId(zones[0].id); // Select first zone to prompt next step
  }

  // --- Customer Zone Configuration Handler ---

  const handleConnectZone = () => {
    if (!selectedZoneId) return;

    const zoneIndex = zones.findIndex(z => z.id === selectedZoneId);
    const zone = zones[zoneIndex];
    const ispSourceData = zone.ispId === 'A' ? ispAData : ispBData;
    const newConfig = { ip: inputIp, cidr: inputCidr, ispSource: zone.ispId };

    // 1. BGP Readiness Check
    if (!isBGPReady) {
        updateZoneStatus(zoneIndex, "error", "BGP is offline! Configure iBGP for both ISPs and eBGP Peering first.", newConfig);
        return;
    }

    // 2. Basic Format Validation (IP Regex check)
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(inputIp)) {
      updateZoneStatus(zoneIndex, "error", "Invalid IP Format", newConfig);
      return;
    }

    // 3. Calculate Subnet
    const subnetData = calculateSubnet(inputIp, inputCidr);
    if (!subnetData) {
        updateZoneStatus(zoneIndex, "error", "Invalid CIDR or IP Range.", newConfig);
        return;
    }
    
    // 4. Check ISP Source Block Constraint (Private IP range enforcement)
    const ipLong = ipToLong(inputIp);
    const ispBlockLong = ipToLong(ispSourceData.block);
    if (!isIpInSubnet(ipLong, ispBlockLong, ispSourceData.cidr)) {
        updateZoneStatus(zoneIndex, "error", `Invalid ISP Source! IP must be from the ${ispSourceData.rangeLabel} block for ${ispSourceData.name}.`, newConfig);
        return;
    }
    
    // 5. Check Network Address Validity
    if (subnetData.networkAddress !== inputIp) {
      updateZoneStatus(zoneIndex, "error", `Invalid Network ID. Use: ${subnetData.networkAddress}`, newConfig);
      return;
    }

    // 6. Check Host Capacity (VLSM Check)
    if (subnetData.totalHosts < zone.hostsRequired) {
      updateZoneStatus(zoneIndex, "error", `Insufficient Hosts! Need ${zone.hostsRequired}, got ${subnetData.totalHosts}.`, newConfig);
      return;
    }

    // Success!
    const localPref = zone.ispId === 'A' ? ispAConfig.localPref : ispBConfig.localPref;
    const msg = `Connected via ${ispSourceData.name}. Route advertised via BGP (AS ${ispSourceData.as}). LOCAL_PREF: ${localPref}`;
    
    if (zone.status !== 'online') {
      setScore(s => s + 100 + (Math.floor(subnetData.totalHosts / zone.hostsRequired) < 2 ? 50 : 0)); // Bonus for efficiency
    }

    updateZoneStatus(zoneIndex, "online", msg, newConfig, subnetData);
  };
  
  const roadNetworkVisual = (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <linearGradient id="peeringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="100%" stopColor="#eab308" />
        </linearGradient>
        {/* Local Pref Gradient (Simulate routing policy effect) */}
        <linearGradient id="prefAGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#84cc16" />
            <stop offset="100%" stopColor="#4d7c0f" />
        </linearGradient>
        <linearGradient id="prefBGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      
      {/* ISP Peering Link (Connecting ISP A at 40,50 to ISP B at 60,50) */}
      {peeringConfig.status === 'configured' && (
          <g>
            {/* Base Link Road */}
            <path 
              d="M 40 50 L 60 50" 
              stroke="#334155" 
              strokeWidth="6" 
              fill="none" 
              vectorEffect="non-scaling-stroke"
            />
            {/* Animated Link Flow (eBGP) */}
            <path 
              d="M 40 50 L 60 50" 
              stroke="url(#peeringGradient)"
              strokeWidth="2" 
              strokeDasharray="4,4"
              fill="none" 
              vectorEffect="non-scaling-stroke"
              className='animate-dash-flow-horizontal'
            />
            {/* AS Label (A side) */}
            <text x="35" y="47" className="fill-white text-[8px] font-mono" textAnchor="end">AS{ispAConfig.as}</text>
            {/* AS Label (B side) */}
            <text x="65" y="47" className="fill-white text-[8px] font-mono">AS{ispBConfig.as}</text>
          </g>
      )}

      {/* Roads connecting the first 4 sectors to their respective ISPs */}
      {zones.slice(0, 4).map((zone) => {
         const isA = zone.ispId === 'A';
         const currentPref = isA ? ispAConfig.localPref : ispBConfig.localPref;
         const strokeColor = isA ? '#22c55e' : '#3b82f6';
         const dashArray = currentPref > 100 ? "10,2" : "5,5"; // Policy visualization: Higher pref = faster, more solid line
         
         return (
            <g key={`road-${zone.id}`}>
                {/* Base Road */}
                <path 
                  d={roadPaths[zone.id]} 
                  stroke="#1e293b" 
                  strokeWidth="8" 
                  fill="none" 
                  vectorEffect="non-scaling-stroke"
                />
                <path 
                  d={roadPaths[zone.id]} 
                  stroke={zone.status === 'online' ? strokeColor : '#334155'} 
                  strokeWidth="2" 
                  strokeDasharray={zone.status === 'online' ? dashArray : "5,5"}
                  fill="none" 
                  vectorEffect="non-scaling-stroke"
                  className={zone.status === 'online' ? 'animate-dash-flow' : ''}
                  style={{ animationDuration: currentPref > 100 ? '0.7s' : '1.2s' }}
                />
                {/* Data Packets (Only if online) */}
                {zone.status === 'online' && (
                  <circle r="4" fill="white" filter="url(#glow)">
                    <animateMotion dur={currentPref > 100 ? '1.5s' : '2.5s'} repeatCount="indefinite" path={roadPaths[zone.id]} keyPoints="0;1" keyTimes="0;1" />
                  </circle>
                )}
            </g>
          );
      })}
    </svg>
  );

  const ISPConfigPanel = ({ ispId, config, setConfig, handleConfigure, ispData }) => {
    const isIBGPConfigured = config.iBGPStatus === 'configured';
    const message = config.iBGPStatus === 'error' ? config.message : (config.message || 'iBGP ensures all local routers in this AS share customer routes.');

    return (
        <div className={`p-4 rounded-lg border bg-opacity-10 ${ispData.color.replace('text-', 'bg-')}/10 ${ispData.color.replace('text-', 'border-')}`}>
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                <Network size={20} />
                {ispData.name} ({isIBGPConfigured ? 'iBGP UP' : 'iBGP DOWN'})
            </h3>
            
            <div className="space-y-4">
                {/* AS Number Configuration */}
                <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2 border-b border-slate-700 pb-2">
                    <Shield size={16} className="text-yellow-400" /> Autonomous System (AS)
                </h4>
                <div className='space-y-3'>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">AS Number (1 to 4,294,967,295)</label>
                        <input 
                            type="number" 
                            value={config.as}
                            onChange={(e) => handleASNumberChange(ispId, e.target.value)}
                            min="1"
                            max="4294967295"
                            placeholder="e.g. 65001"
                            disabled={isIBGPConfigured}
                            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white font-mono focus:border-cyan-500 focus:outline-none transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                        />
                        <div className={`text-xs mt-1 font-mono ${config.asType.includes('Private') ? 'text-orange-400' : config.asType.includes('32-bit') ? 'text-red-400' : 'text-green-400'}`}>
                            Type: {config.asType}
                        </div>
                    </div>
                </div>

                {/* iBGP Configuration and LOCAL_PREF Policy */}
                <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2 border-b border-slate-700 pb-2 pt-2">
                    <Code size={16} className="text-purple-400" /> Internal BGP & Policy
                </h4>
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">BGP Router ID (e.g., Loopback IP)</label>
                        <input 
                            type="text" 
                            value={config.routerId}
                            onChange={(e) => setConfig(c => ({...c, routerId: e.target.value, iBGPStatus: 'pending', message: 'Ready to configure...'}))}
                            placeholder="e.g. 1.1.1.1 or 10.1.1.1"
                            disabled={isIBGPConfigured}
                            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white font-mono focus:border-cyan-500 focus:outline-none transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                        />
                    </div>
                     <div>
                        <label className="block text-xs text-slate-400 mb-1">LOCAL\_PREF (BGP Policy - Higher is better)</label>
                        <input 
                            type="number" 
                            value={config.localPref}
                            onChange={(e) => setConfig(c => ({...c, localPref: parseInt(e.target.value) || 100, iBGPStatus: isIBGPConfigured ? 'configured' : 'pending', message: isIBGPConfigured ? `Policy updated to ${e.target.value}` : c.message}))}
                            placeholder="Default: 100"
                            min="1"
                            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white font-mono focus:border-cyan-500 focus:outline-none transition-colors"
                        />
                         <p className="text-xs text-slate-500 mt-1">This value is advertised to all routers *within* AS {config.as}.</p>
                    </div>
                    
                    <button 
                        onClick={() => handleConfigure(ispId)}
                        disabled={isIBGPConfigured || !config.routerId || !config.as}
                        className={`w-full font-bold py-2 rounded shadow-lg transition-all active:scale-95 text-sm flex items-center justify-center gap-2
                          ${isIBGPConfigured ? 'bg-green-700' : 'bg-purple-600 hover:bg-purple-500'} text-white`}
                    >
                        {isIBGPConfigured ? <CheckCircle size={18} /> : <ShieldCheck size={18} />}
                        {isIBGPConfigured ? 'iBGP Established' : 'Establish iBGP Mesh'}
                    </button>
                    <p className={`text-xs mt-1 ${isIBGPConfigured ? 'text-green-300' : (config.iBGPStatus === 'error' ? 'text-red-400' : 'text-slate-400')}`}>
                        {message}
                    </p>
                    {isIBGPConfigured && <div className='text-xs text-green-300'></div>}
                </div>
            </div>
        </div>
    );
  };

  const EBGPConfigPanel = () => {
    const isConfigured = peeringConfig.status === 'configured';
    const message = peeringConfig.status === 'error' ? peeringConfig.message : (peeringConfig.message || 'Enter Peering IP and Remote AS to establish the link.');
    const targetAS = ispBConfig.as;
    const localAS = ispAConfig.as;

    return (
        <div className={`p-4 rounded-lg border bg-opacity-10 ${isConfigured ? 'border-yellow-500 bg-yellow-900/20' : 'border-slate-600 bg-slate-700/50'}`}>
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                <Zap size={20} className="text-yellow-400" />
                eBGP Peering Link (Inter-AS Routing)
            </h3>
            
            <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2 border-b border-slate-700 pb-2">
                    <Link2 size={16} className="text-orange-400" /> AS {localAS} &lt;--&gt; AS {targetAS}
                </h4>

                <div className="space-y-3">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Peering Network ID (/30 from 192.168.x.x range)</label>
                        <input 
                            type="text" 
                            value={peeringConfig.ip}
                            onChange={(e) => setPeeringConfig(c => ({...c, ip: e.target.value, status: 'pending', message: 'Ready to configure...'}))}
                            placeholder="e.g. 192.168.1.0"
                            disabled={isConfigured}
                            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white font-mono focus:border-yellow-500 focus:outline-none transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Remote AS Number (Must match ISP B's AS: {targetAS})</label>
                        <input 
                            type="number" 
                            value={peeringConfig.remoteAs}
                            onChange={(e) => setPeeringConfig(c => ({...c, remoteAs: parseInt(e.target.value) || '', status: 'pending', message: 'Ready to configure...'}))}
                            placeholder={targetAS}
                            disabled={isConfigured}
                            min="1"
                            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white font-mono focus:border-yellow-500 focus:outline-none transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                        />
                        <div className="text-right text-xs text-slate-500 mt-1">
                            Link CIDR: <span className="text-yellow-400">/30</span> (Fixed for P2P)
                        </div>
                    </div>
                    <button 
                        onClick={handleConfigureEBGP}
                        disabled={isConfigured || !peeringConfig.ip || !peeringConfig.remoteAs || !localAS || !targetAS}
                        className={`w-full font-bold py-3 rounded shadow-lg transition-all active:scale-95 text-sm flex items-center justify-center gap-2
                          ${isConfigured ? 'bg-green-700' : 'bg-orange-600 hover:bg-orange-500'} text-white`}
                    >
                        {isConfigured ? <CheckCircle size={18} /> : <ShieldCheck size={18} />}
                        {isConfigured ? 'eBGP Established (Routes Exchanged)' : 'Establish eBGP Peering'}
                    </button>
                    <p className={`text-xs mt-1 ${isConfigured ? 'text-green-300' : (peeringConfig.status === 'error' ? 'text-red-400' : 'text-slate-400')}`}>
                        {message}
                    </p>
                </div>
            </div>
        </div>
    );
  };
  
  const ZoneConfigPanel = () => {
    if (!selectedZone) return null;
    
    const statusIcon = selectedZone.status === 'error' ? <AlertCircle className="shrink-0 mt-0.5" size={16}/> : 
                       selectedZone.status === 'online' ? <CheckCircle className="shrink-0 mt-0.5" size={16}/> : 
                       <Info className="shrink-0 mt-0.5" size={16}/>;
    
    const zoneIspData = selectedZone.ispId === 'A' ? ispAData : ispBData;
    
    // Auto-sync input ISP to the zone's inherent ISP
    useEffect(() => {
        setInputIspSource(selectedZone.ispId);
    }, [selectedZone]);


    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
            {/* Zone Details */}
            <div className={`p-4 rounded-lg border bg-opacity-10 ${zoneIspData.color.replace('text-', 'bg-')} ${zoneIspData.color.replace('text-', 'border-')}`}>
                <h2 className="text-lg font-bold flex items-center gap-2">
                    <Home size={20} />
                    {selectedZone.name} (AS {zoneIspData.as})
                </h2>
                <div className="mt-4 space-y-3">
                    <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                        <span className="text-slate-400">Status</span>
                        <span className={`font-mono text-lg font-bold ${selectedZone.status === 'online' ? 'text-green-400' : 'text-red-400'}`}>{selectedZone.status.toUpperCase()}</span>
                    </div>
                </div>
                {selectedZone.status === 'online' && <HouseholdIPList zone={selectedZone} />}
            </div>

            {/* Status Message */}
            <div className={`p-3 rounded text-sm font-medium flex items-start gap-2
                ${selectedZone.status === 'error' ? 'bg-red-900/50 text-red-200 border border-red-700' : 
                  selectedZone.status === 'online' ? 'bg-green-900/50 text-green-200 border border-green-700' : 
                  'bg-slate-700 text-slate-300'}
            `}>
                {statusIcon}
                {selectedZone.message}
            </div>

            {/* Configuration Form */}
            <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                <h3 className="text-sm font-bold text-cyan-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                    <Calculator size={14} />
                    Customer Subnet (VLSM)
                </h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">ISP Source Block (Fixed for this locality)</label>
                        <div 
                            className={`w-full bg-slate-900 border rounded p-2 text-white font-mono border-slate-600 ${zoneIspData.color.replace('text-', 'text-')}`}
                        >
                            {zoneIspData.name} ({zoneIspData.rangeLabel})
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Network Address (Must be the Network ID & within ISP Block)</label>
                        <input 
                          type="text" 
                          value={inputIp}
                          onChange={(e) => setInputIp(e.target.value)}
                          placeholder={`e.g. ${zoneIspData.rangeLabel.replace('x.x.x', '1.0.0')}`}
                          className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white font-mono focus:border-cyan-500 focus:outline-none transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Subnet Mask (CIDR)</label>
                        <div className="flex items-center gap-4">
                          <input 
                            type="range" 
                            min="8" 
                            max="30" 
                            value={inputCidr}
                            onChange={(e) => setInputCidr(parseInt(e.target.value))}
                            className="flex-1 accent-cyan-500"
                          />
                          <span className="font-mono bg-slate-900 px-3 py-1 rounded border border-slate-600 w-16 text-center">/{inputCidr}</span>
                        </div>
                        <div className="text-right text-xs text-slate-500 mt-1">
                          Max Usable Hosts: <span className="text-cyan-400">{Math.pow(2, 32 - inputCidr) - 2}</span>
                        </div>
                    </div>

                    <button 
                        onClick={handleConnectZone}
                        disabled={!isBGPReady}
                        className={`w-full font-bold py-3 rounded shadow-lg shadow-cyan-900/50 transition-all active:scale-95 flex items-center justify-center gap-2
                          ${isBGPReady ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-slate-500 cursor-not-allowed'} text-white`}
                    >
                        <Database size={18} />
                        {isBGPReady ? 'Advertise Route via BGP' : 'BGP Offline (Cannot Route)'}
                    </button>
                    {!isBGPReady && (
                        <p className="text-xs text-red-400 mt-2 text-center">Configure all BGP components before allocating customer IP space.</p>
                    )}
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans overflow-hidden flex flex-col md:flex-row">
      
      {/* LEFT SIDE: VISUAL MAP */}
      <div className="relative flex-1 h-[60vh] md:h-auto bg-[#0f172a] p-4 overflow-hidden perspective-1000">
        
        {/* Grid Background Effect */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ 
               backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', 
               backgroundSize: '30px 30px' 
             }}>
        </div>

        {/* ROAD NETWORK LAYER (SVG) */}
        {roadNetworkVisual}

        {/* ISP A HUB (Center Left) */}
        <div className="absolute top-1/2 left-[40%] transform -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center justify-center">
          <div className={`w-24 h-24 bg-slate-800 rounded-full border-4 shadow-2xl flex items-center justify-center relative ${ispAConfig.iBGPStatus === 'configured' ? 'border-green-500' : 'border-slate-500'}`}>
            <div className={`absolute inset-0 rounded-full border border-green-500/30 ${ispAConfig.iBGPStatus === 'configured' ? 'animate-ping' : ''}`}></div>
            <Server size={40} className="text-green-400" />
            <div className="absolute -bottom-8 bg-slate-800 px-3 py-1 rounded text-xs font-bold border border-green-600 text-green-300">
              ISP A (AS {ispAConfig.as})
            </div>
            {ispAConfig.iBGPStatus === 'configured' && <CheckCircle size={20} className='absolute top-0 right-0 text-green-400 bg-slate-800 rounded-full' />}
          </div>
        </div>

        {/* ISP B HUB (Center Right) */}
        <div className="absolute top-1/2 left-[60%] transform -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center justify-center">
          <div className={`w-24 h-24 bg-slate-800 rounded-full border-4 shadow-2xl flex items-center justify-center relative ${ispBConfig.iBGPStatus === 'configured' ? 'border-blue-500' : 'border-slate-500'}`}>
            <div className={`absolute inset-0 rounded-full border border-blue-500/30 ${ispBConfig.iBGPStatus === 'configured' ? 'animate-ping' : ''}`}></div>
            <Server size={40} className="text-blue-400" />
            <div className="absolute -bottom-8 bg-slate-800 px-3 py-1 rounded text-xs font-bold border border-blue-600 text-blue-300">
              ISP B (AS {ispBConfig.as})
            </div>
            {ispBConfig.iBGPStatus === 'configured' && <CheckCircle size={20} className='absolute top-0 right-0 text-blue-400 bg-slate-800 rounded-full' />}
          </div>
        </div>

        {/* ZONES (Localities) - Show only the first 4 for visual anchor. */}
        {zones.slice(0, 4).map((zone) => {
             const zoneIspData = zone.ispId === 'A' ? ispAData : ispBData;
             return (
              <div
                key={zone.id}
                className={`absolute z-30 transition-all duration-300 pointer-events-none
                  ${zone.position === 'top-left' ? 'top-[15%] left-[10%]' : ''}
                  ${zone.position === 'top-right' ? 'top-[15%] right-[10%]' : ''}
                  ${zone.position === 'bottom-left' ? 'bottom-[15%] left-[10%]' : ''}
                  ${zone.position === 'bottom-right' ? 'bottom-[15%] right-[10%]' : ''}
                `}
              >
                {/* The Locality Marker (Aesthetic only) */}
                <div className={`
                  w-12 h-12 rounded-full border-2 p-2 shadow-2xl flex items-center justify-center
                  ${zone.status === 'online' ? zoneIspData.color.replace('text-', 'ring-') + ' ' + zone.bg : 'border-slate-700 bg-slate-800/80'}
                `}>
                    <Home size={20} className={zone.status === 'online' ? zoneIspData.color : 'text-slate-500'}/>
                </div>
              </div>
            );
        })}
        
        {/* BGP Status Indicator */}
        <div className="absolute top-[5%] left-1/2 transform -translate-x-1/2 z-40 bg-slate-800/80 border text-xs px-3 py-1 rounded-lg flex items-center gap-1">
            <Zap size={12} className={`${isBGPReady ? 'text-green-400 animate-pulse' : 'text-red-400'}`} />
            <span className={`${isBGPReady ? 'text-green-300' : 'text-red-300'}`}>{isBGPReady ? 'Global BGP UP' : 'BGP DOWN'}</span>
            <span className='text-yellow-300 font-mono ml-2'>| A-Pref: {ispAConfig.localPref} | B-Pref: {ispBConfig.localPref}</span>
        </div>

      </div>

      {/* RIGHT SIDE: DASHBOARD & CONTROLS */}
      <div className="w-full md:w-[450px] bg-slate-800 border-l border-slate-700 flex flex-col shadow-2xl z-40">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 border-b border-slate-700 flex flex-col gap-2">
          <div className='flex justify-between items-start'>
            <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent flex items-center gap-2">
                <Globe className="text-cyan-400" size={24} />
                BGP Policy City
                </h1>
                <p className="text-slate-400 text-xs mt-1">AS Policy, iBGP, eBGP, and VLSM Simulator</p>
            </div>
            <div className="text-right">
                <div className="text-xs text-slate-500 uppercase font-bold">Score</div>
                <div className="text-2xl font-mono text-green-400">{score}</div>
            </div>
          </div>
          <button 
            onClick={resetGame}
            className="w-full bg-red-700 hover:bg-red-600 text-white text-sm font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw size={14} />
            Reset Simulation
          </button>
        </div>
        
        {/* Tab Navigation */}
        <div className="p-2 border-b border-slate-700 bg-slate-900 grid grid-cols-5 text-sm font-semibold">
            <button 
                onClick={() => setActiveTab('A')}
                className={`py-2 rounded-lg transition-colors flex items-center justify-center gap-1 ${activeTab === 'A' ? 'bg-green-700 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
            >
                <Network size={16} /> ISP A
            </button>
            <button 
                onClick={() => setActiveTab('B')}
                className={`py-2 rounded-lg transition-colors flex items-center justify-center gap-1 ${activeTab === 'B' ? 'bg-blue-700 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
            >
                <Network size={16} /> ISP B
            </button>
            <button 
                onClick={() => setActiveTab('eBGP')}
                className={`py-2 rounded-lg transition-colors flex items-center justify-center gap-1 ${activeTab === 'eBGP' ? 'bg-orange-700 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
            >
                <Zap size={16} /> eBGP
            </button>
            <button 
                onClick={() => { setActiveTab('zone'); if (!selectedZoneId) setSelectedZoneId(zones[0].id); }}
                className={`py-2 rounded-lg transition-colors flex items-center justify-center gap-1 ${activeTab === 'zone' ? 'bg-cyan-700 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
            >
                <Home size={16} /> Zones
            </button>
            <button 
                onClick={() => setActiveTab('calc')}
                className={`py-2 rounded-lg transition-colors flex items-center justify-center gap-1 ${activeTab === 'calc' ? 'bg-teal-700 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
            >
                <Binary size={16} /> Calc
            </button>
        </div>

        {/* Main Configuration Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          <NetworkAdvisor 
            currentTab={activeTab} 
            ispAConfig={ispAConfig} 
            ispBConfig={ispBConfig} 
            peeringConfig={peeringConfig}
            selectedZone={selectedZone}
            ispAData={ispAData}
            ispBData={ispBData}
          />
          
          {/* Render Active Tab Content */}
          {activeTab === 'A' && <ISPConfigPanel 
            ispId="A" 
            config={ispAConfig} 
            setConfig={setIspAConfig} 
            handleConfigure={handleConfigureIBGP} 
            ispData={ispAData}
          />}
          
          {activeTab === 'B' && <ISPConfigPanel 
            ispId="B" 
            config={ispBConfig} 
            setConfig={setIspBConfig} 
            handleConfigure={handleConfigureIBGP} 
            ispData={ispBData}
          />}
          
          {activeTab === 'eBGP' && <EBGPConfigPanel />}

          {activeTab === 'calc' && <IPv4BinaryCalculator />}
          
          {activeTab === 'zone' && (
            <div className='space-y-4'>
                <div className="p-4 border-b border-slate-700 bg-slate-700 rounded-lg">
                    <button 
                        onClick={() => setIsListExpanded(!isListExpanded)}
                        className="w-full text-sm font-bold text-slate-300 hover:text-white flex items-center justify-between transition-colors"
                    >
                        <span className='flex items-center gap-2'><LayoutList size={16} /> Select Customer Locality ({zones.filter(z => z.status === 'online').length}/{zones.length})</span>
                        <ChevronDown size={18} className={`transition-transform ${isListExpanded ? 'rotate-180' : 'rotate-0'}`} />
                    </button>
                    
                    {isListExpanded && (
                        <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
                            {zones.map(zone => {
                                const zoneIspData = zone.ispId === 'A' ? ispAData : ispBData;
                                return (
                                <div 
                                    key={zone.id}
                                    onClick={() => setSelectedZoneId(zone.id)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-200
                                        ${selectedZoneId === zone.id ? 'bg-cyan-900/40 border-cyan-500 ring-2 ring-cyan-500' : 'bg-slate-600 hover:bg-slate-500'}
                                    `}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-white">{zone.name}</span>
                                        {zone.status === 'online' ? <CheckCircle size={16} className="text-green-400" /> : 
                                         <AlertCircle size={16} className="text-red-400" />}
                                    </div>
                                    <div className="text-xs text-slate-400 mt-1 flex justify-between">
                                        <span>Hosts: <span className='font-bold text-white'>{zone.hostsRequired}</span> | AS: <span className={`font-bold ${zone.ispId === 'A' ? 'text-green-400' : 'text-blue-400'}`}>{zoneIspData.as}</span></span>
                                        <span>Req. Class: <span className='font-bold text-yellow-400'>{zone.reqClass}</span></span>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                {selectedZoneId ? <ZoneConfigPanel /> : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4 pt-10">
                        <Home size={48} className="opacity-20" />
                        <p className="text-center px-8">Select a locality to configure its subnet and advertise its route.</p>
                    </div>
                )}
            </div>
          )}

        </div>

        {/* Footer / Help Toggle */}
        <div className="p-4 bg-slate-900 border-t border-slate-700">
           <button 
             onClick={() => setShowHelp(!showHelp)}
             className="text-xs text-slate-400 hover:text-white flex items-center gap-2 transition-colors"
           >
             <BookOpen size={14} />
             {showHelp ? "Hide Detailed IP Reference" : "Show Detailed IP Reference"}
           </button>
           
           {showHelp && (
            <div className="mt-4 p-3 bg-slate-800 rounded border border-slate-600 text-xs space-y-2">
                <h4 className="font-bold text-cyan-400 mb-2">IP Classful Network Summary</h4>
                <div className="grid grid-cols-4 gap-2 border-b border-slate-700 pb-2 mb-2 font-bold text-slate-400">
                  <span>Class</span>
                  <span>1st Octet Range</span>
                  <span>Default CIDR</span>
                  <span>Private Range</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-slate-300">
                  <span className="text-green-400 font-bold">A</span>
                  <span>1 - 126</span>
                  <span>/8</span>
                  <span className='font-mono text-green-400'>10.0.0.0/8</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-slate-300">
                  <span className="text-blue-400 font-bold">B</span>
                  <span>128 - 191</span>
                  <span>/16</span>
                  <span>172.16.0.0/12</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-slate-300">
                  <span className="text-orange-400 font-bold">C</span>
                  <span>192 - 223</span>
                  <span>/24</span>
                  <span>192.168.0.0/16</span>
                </div>
                <p className="text-xs text-slate-500 mt-2 italic">Note: ISP A uses 10.x.x.x, ISP B uses 172.16.x.x, and the eBGP link uses 192.168.x.x.</p>
           </div>
           )}
        </div>

      </div>

      {/* Global Style for CSS Animations */}
      <style>{`
        @keyframes dash-flow {
          to {
            stroke-dashoffset: -20;
          }
        }
        @keyframes dash-flow-horizontal {
          to {
            stroke-dashoffset: -8;
          }
        }
        .animate-dash-flow {
          animation: dash-flow 1s linear infinite;
        }
        .animate-dash-flow-horizontal {
          animation: dash-flow-horizontal 0.5s linear infinite;
        }
        /* Tailwind Fix for range input in Safari/iOS */
        input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: #06b6d4; /* cyan-500 */
            cursor: pointer;
            margin-top: -6px; /* Adjusting thumb position */
        }
        input[type=range] {
            height: 8px;
            background: #334155; /* slate-700 */
            border-radius: 4px;
        }
      `}</style>
    </div>
  );
}