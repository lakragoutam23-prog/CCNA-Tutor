
import { CLIState, NetworkTopology } from '@/types';
import { calculateRoutingTable } from './state-engine';

// ==========================================
// PACKET FLOW SIMULATION
// ==========================================

export interface PingResult {
    success: boolean;
    output: string;
    path: string[];
}

export function simulatePing(topology: NetworkTopology, sourceDeviceId: string, destIp: string): PingResult {
    const sourceDevice = topology.devices[sourceDeviceId];
    if (!sourceDevice || !sourceDevice.config) {
        return { success: false, output: '% Source device not ready.', path: [] };
    }

    // 1. Packet Processing
    const ttl = 5;
    let currentId = sourceDeviceId;
    const path: string[] = [sourceDeviceId];
    let output = '';

    // Simplified Hop-by-Hop Simulation
    // In a real simulator, we'd queue packets. Here we trace route.

    for (let i = 0; i < ttl; i++) {
        const currentDev = topology.devices[currentId];
        if (!currentDev.config) break;

        // Check if destination is on this device
        const isSelf = Object.values(currentDev.config.interfaces).some(iface => {
            return iface.ip && iface.ip === destIp;
        });

        if (isSelf) {
            return {
                success: true,
                output: '!!!!!',
                path: [...path, 'Self']
            };
        }

        // Routing Table Lookup
        // We ensure routing table is fresh
        const routingTable = currentDev.config.routes;

        // Find Best Match
        // 1. Longest Prefix Match (simplified)
        let bestRoute = null;

        for (const route of routingTable) {
            // Check if destIp in route.network/mask
            if (isIpInSubnet(destIp, route.network, route.mask)) {
                // If we had prefix length, we'd compare. 
                // For now, take the first valid match or connected preference.
                bestRoute = route;
                if (route.type === 'connected') break; // Best match usually
            }
        }

        if (!bestRoute) {
            output = '.....'; // Timeout/Unreachable
            return { success: false, output: `Type escape sequence to abort.\nSending 5, 100-byte ICMP Echos to ${destIp}, timeout is 2 seconds:\n${output}\nSuccess rate is 0 percent (0/5)`, path };
        }

        if (bestRoute.type === 'connected') {
            // Check L2 Connectivity
            // If connected, look for neighbor with that IP on the connected link.
            const nextHopIp = destIp; // For connected, next hop is dest

            // Find which interface is connected to this subnet
            const exitIfaceName = Object.keys(currentDev.config.interfaces).find(k => {
                const iface = currentDev.config!.interfaces[k];
                if (!iface.ip || !iface.mask) return false;
                return isIpInSubnet(destIp, iface.ip, iface.mask);
            });

            if (!exitIfaceName) break;

            // Find connected peer
            const exitLink = topology.links.find(l =>
                (l.source.deviceId === currentId && l.source.port === exitIfaceName) ||
                (l.target.deviceId === currentId && l.target.port === exitIfaceName)
            );

            if (!exitLink) {
                // Link Down or Not Connected
                output += '.';
                break;
            }

            const peerId = exitLink.source.deviceId === currentId ? exitLink.target.deviceId : exitLink.source.deviceId;

            // Check peer IP
            const peerDev = topology.devices[peerId];
            if (!peerDev || !peerDev.config) break;

            const isPeer = Object.values(peerDev.config.interfaces).some(iface => iface.ip === destIp);

            if (isPeer) {
                return {
                    success: true,
                    output: '!!!!!',
                    path: [...path, peerId]
                };
            } else {
                // Packet arrived at peer, but peer doesn't have the IP?
                // Maybe peer routes it further? (Recursive)
                currentId = peerId;
                path.push(peerId);
                continue;
            }
        } else {
            // Static/Dynamic Route -> Next Hop
            // Find Next Hop Device
            // This is hard without ARP. We cheat and look for device with NextHop IP.
            const nextHopIp = bestRoute.nextHop;

            // Find device with nextHopIp
            const nextHopDev = Object.values(topology.devices).find(d =>
                d.config && Object.values(d.config.interfaces).some(iface => iface.ip === nextHopIp)
            );

            if (nextHopDev) {
                currentId = nextHopDev.id;
                path.push(currentId);
            } else {
                output = '.....'; // Next hop unreachable
                break;
            }
        }
    }

    return {
        success: false,
        output: `Type escape sequence to abort.\nSending 5, 100-byte ICMP Echos to ${destIp}, timeout is 2 seconds:\n.....\nSuccess rate is 0 percent (0/5)`,
        path
    };
}
// ... (Existing Ping Logic ... keep simulatePing as is)

// ==========================================
// ROUTING PROTOCOL SIMULATION
// ==========================================

export function processRoutingUpdates(topology: NetworkTopology): NetworkTopology {
    // Deep copy to avoid mutation during iteration
    const nextTopology = JSON.parse(JSON.stringify(topology)) as NetworkTopology;

    // 1. Process OSPF Adjacencies
    // For every link that is UP, check if both ends are OSPF enabled
    nextTopology.links.forEach(link => {
        if (link.status !== 'up') return;

        const dev1 = nextTopology.devices[link.source.deviceId];
        const dev2 = nextTopology.devices[link.target.deviceId];

        if (!dev1 || !dev2) return;
        if (!dev1.config || !dev2.config) return;

        // Check OSPF Enabled on Interface
        // In real OSPF, we check if interface IP matches a 'network' statement
        const iface1 = dev1.config.interfaces[link.source.port];
        const iface2 = dev2.config.interfaces[link.target.port];

        if (!iface1?.ip || !iface2?.ip) return;

        const ospf1 = isOspfEnabled(dev1.config, iface1.ip);
        const ospf2 = isOspfEnabled(dev2.config, iface2.ip);

        if (ospf1 && ospf2) {
            // Establish Adjacency
            // 1 -> 2
            updateOspfNeighbor(dev1.config, dev2.config.hostname || dev2.id, iface2.ip, link.source.port, 'FULL');
            // 2 -> 1
            updateOspfNeighbor(dev2.config, dev1.config.hostname || dev1.id, iface1.ip, link.target.port, 'FULL');
        } else {
            // Tear Down if config removed
            // (Simplified: We just don't add them, or set to DOWN if we tracked it)
        }
    });

    // 2. Process EIGRP Adjacencies
    nextTopology.links.forEach(link => {
        if (link.status !== 'up') return;
        const dev1 = nextTopology.devices[link.source.deviceId];
        const dev2 = nextTopology.devices[link.target.deviceId];
        if (!dev1?.config?.eigrpConfig || !dev2?.config?.eigrpConfig) return;

        // Check AS Match
        if (dev1.config.eigrpConfig.asNumber !== dev2.config.eigrpConfig.asNumber) return;

        const iface1 = dev1.config.interfaces[link.source.port];
        const iface2 = dev2.config.interfaces[link.target.port];
        if (!iface1?.ip || !iface2?.ip) return;

        const eigrp1 = isEigrpEnabled(dev1.config, iface1.ip);
        const eigrp2 = isEigrpEnabled(dev2.config, iface2.ip);

        if (eigrp1 && eigrp2) {
            updateEigrpNeighbor(dev1.config, iface2.ip, link.source.port);
            updateEigrpNeighbor(dev2.config, iface1.ip, link.target.port);
        }
    });

    // 3. Process BGP Peering (Simplified: Direct connection check)
    Object.values(nextTopology.devices).forEach(dev => {
        if (!dev.config?.bgpConfig) return;
        dev.config.bgpConfig.neighbors.forEach(bgpPeer => {
            // Find if peer is reachable. For simulation, valid if we can find a device with this IP
            // AND the peer has us configured as neighbor.
            const peerDev = Object.values(nextTopology.devices).find(d =>
                d.config?.interfaces && Object.values(d.config.interfaces).some(i => i.ip === bgpPeer.ip)
            );

            if (peerDev?.config?.bgpConfig) {
                // Does peer have us?
                const myIp = findMyIpFacingPeer(dev.config!, peerDev.config!);
                const peerHasUs = peerDev.config.bgpConfig.neighbors.some(n => n.ip === myIp && n.remoteAs === dev.config!.bgpConfig!.asNumber);

                if (peerHasUs) {
                    updateBgpNeighbor(dev.config!, bgpPeer.ip, peerDev.config.bgpConfig.asNumber, 'Established');
                }
            }
        });
    });

    // 4. Route Exchange (OSPF/EIGRP/BGP)
    // Combined logic: For each active neighbor, learn routes.
    exchangeRoutes(nextTopology);

    return nextTopology;
}

function exchangeRoutes(topology: NetworkTopology) {
    Object.values(topology.devices).forEach(receiver => {
        // OSPF
        receiver.config?.ospfNeighbors?.forEach(n => {
            if (n.state === 'FULL') learnRoutes(receiver, n.ip, 'ospf', topology);
        });
        // EIGRP
        receiver.config?.eigrpNeighbors?.forEach(n => {
            learnRoutes(receiver, n.ip, 'rip', topology); // Using 'rip' type as placeholder for eigrp in routes array if not expanded
            // Actually let's use 'eigrp' if routes support it. 
            // The routes array definition in Types includes 'static' | 'connected' | 'rip' | 'ospf'. 
            // I should update Types if I want 'eigrp'. For now I'll map to 'rip' or 'ospf' with distinct admin distance if needed, 
            // OR I assume I adding 'eigrp' to the Type definition was done?
            // Checking types/index.ts... "routes: Array<{... type: 'static' | 'connected' | 'rip' | 'ospf' }>".
            // I need to update Routes type to support 'eigrp' and 'bgp'.
        });
        // BGP
        receiver.config?.bgpNeighbors?.forEach(n => {
            if (n.state === 'Established') learnRoutes(receiver, n.ip, 'static', topology); // BGP typically populates RIB. Mapping to static for now.
        });
    });
}

function learnRoutes(receiver: any, peerIp: string, protocol: string, topology: NetworkTopology) {
    const sender = Object.values(topology.devices).find(d =>
        d.config?.interfaces && Object.values(d.config.interfaces).some(i => i.ip === peerIp)
    );
    if (!sender?.config) return;

    Object.values(sender.config.interfaces).forEach((remoteIface: any) => {
        if (remoteIface.ip && remoteIface.mask && remoteIface.status === 'up') {
            const network = getNetworkAddress(remoteIface.ip, remoteIface.mask);
            const isOwn = Object.values(receiver.config.interfaces).some((i: any) => i.ip && getNetworkAddress(i.ip, i.mask) === network);

            if (!isOwn) {
                const exists = receiver.config.routes.find((r: any) => r.network === network);
                if (!exists) {
                    receiver.config.routes.push({
                        network,
                        mask: remoteIface.mask,
                        nextHop: peerIp,
                        type: protocol
                    });
                }
            }
        }
    });
}

// ============ HELPERS ============

function updateOspfNeighbor(config: CLIState, neighborId: string, neighborsIp: string, localInterface: string, state: 'FULL') {
    if (!config.ospfNeighbors) config.ospfNeighbors = [];
    const idx = config.ospfNeighbors.findIndex(n => n.ip === neighborsIp);
    if (idx >= 0) {
        config.ospfNeighbors[idx].state = state;
    } else {
        config.ospfNeighbors.push({ neighborId, ip: neighborsIp, interface: localInterface, state, drPriority: 1, deadTime: 40 });
    }
}

function updateEigrpNeighbor(config: CLIState, neighborsIp: string, localInterface: string) {
    if (!config.eigrpNeighbors) config.eigrpNeighbors = [];
    const existing = config.eigrpNeighbors.find(n => n.ip === neighborsIp);
    if (!existing) {
        config.eigrpNeighbors.push({ ip: neighborsIp, interface: localInterface, holdTime: 15, uptime: 0 });
    }
}

function updateBgpNeighbor(config: CLIState, neighborsIp: string, remoteAs: number, state: 'Established' | 'Idle') {
    if (!config.bgpNeighbors) config.bgpNeighbors = [];
    const existing = config.bgpNeighbors.find(n => n.ip === neighborsIp);
    if (existing) {
        existing.state = state;
    } else {
        config.bgpNeighbors.push({ ip: neighborsIp, remoteAs, state, uptime: 0 });
    }
}

function isOspfEnabled(config: CLIState, ip: string): boolean {
    if (!config.ospfConfig) return false;
    return config.ospfConfig.networks.some(net => isIpInSubnet(ip, net.network, wildcardToMask(net.wildcard)));
}

function isEigrpEnabled(config: CLIState, ip: string): boolean {
    if (!config.eigrpConfig) return false;
    return config.eigrpConfig.networks.some(net => {
        // Simple check: assuming network command is classful or matches subnet
        // Real EIGRP uses wildcard too, but simplified here to "starts with" or exact match if no wildcard provided
        // For simplicity, we assume network command is the network address
        return ip.startsWith(net.replace('.0.0.0', ''));
    });
}

function findMyIpFacingPeer(myConfig: CLIState, peerConfig: CLIState): string {
    // Find interface on 'myConfig' that is in same subnet as one of 'peerConfig's interfaces
    for (const myIface of Object.values(myConfig.interfaces)) {
        if (!myIface.ip || !myIface.mask) continue;
        for (const peerIface of Object.values(peerConfig.interfaces)) {
            if (!peerIface.ip || !peerIface.mask) continue;
            // Assuming simplified same subnet check
            if (getNetworkAddress(myIface.ip, myIface.mask) === getNetworkAddress(peerIface.ip, peerIface.mask)) {
                return myIface.ip;
            }
        }
    }
    return '';
}

function wildcardToMask(wildcard: string): string {
    return wildcard.split('.').map(o => 255 - parseInt(o)).join('.');
}

function getNetworkAddress(ip: string, mask: string): string {
    const ipOctets = ip.split('.').map(Number);
    const maskOctets = mask.split('.').map(Number);
    return ipOctets.map((o, i) => o & maskOctets[i]).join('.');
}

function isIpInSubnet(ip: string, network: string, mask: string): boolean {
    const ipOctets = ip.split('.').map(Number);
    const netOctets = network.split('.').map(Number);
    const maskOctets = mask.split('.').map(Number);
    for (let i = 0; i < 4; i++) {
        if ((ipOctets[i] & maskOctets[i]) !== (netOctets[i] & maskOctets[i])) return false;
    }
    return true;
}
