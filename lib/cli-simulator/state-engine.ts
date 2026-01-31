import { CLIState } from '@/types';

// ==========================================
// STATE ENGINE: PURE FUNCTIONS FOR MUTATION
// ==========================================

export function cloneState(state: CLIState): CLIState {
    return JSON.parse(JSON.stringify(state));
}

export function updateHostname(state: CLIState, newHostname: string): CLIState {
    const nextState = cloneState(state);
    nextState.hostname = newHostname;
    const modeChar = getModePromptChar(nextState.mode);
    nextState.prompt = `${newHostname}${modeChar}`;
    return nextState;
}

export function transitionMode(state: CLIState, newMode: CLIState['mode']): CLIState {
    const nextState = cloneState(state);
    nextState.mode = newMode;
    const modeChar = getModePromptChar(newMode);
    let promptPrefix = nextState.hostname;

    switch (newMode) {
        case 'global_config': promptPrefix += '(config)'; break;
        case 'interface_config': promptPrefix += '(config-if)'; break;
        case 'router_config': promptPrefix += '(config-router)'; break;
        case 'line_config': promptPrefix += '(config-line)'; break;
        case 'vlan_config': promptPrefix += '(config-vlan)'; break;
        case 'dhcp_config': promptPrefix += '(dhcp-config)'; break;
        case 'acl_config': promptPrefix += '(config-ext-nacl)'; break;
    }

    nextState.prompt = `${promptPrefix}${modeChar}`;
    if (newMode !== 'interface_config') nextState.currentInterface = undefined;

    return nextState;
}

function getModePromptChar(mode: CLIState['mode']): string {
    return mode === 'user' ? '>' : '#';
}

// ============ INTERFACE CONFIG ============

export function setInterfaceIp(state: CLIState, ifaceName: string, ip: string, mask: string): CLIState {
    const nextState = cloneState(state);
    const targetIface = Object.keys(nextState.interfaces).find(k => k.toLowerCase() === ifaceName.toLowerCase());

    if (targetIface && nextState.interfaces[targetIface]) {
        nextState.interfaces[targetIface].ip = ip;
        nextState.interfaces[targetIface].mask = mask;
        return calculateRoutingTable(nextState);
    }
    return nextState;
}

export function setInterfaceStatus(state: CLIState, ifaceName: string, status: 'up' | 'administratively down'): CLIState {
    const nextState = cloneState(state);
    const targetIface = Object.keys(nextState.interfaces).find(k => k.toLowerCase() === ifaceName.toLowerCase());

    if (targetIface && nextState.interfaces[targetIface]) {
        nextState.interfaces[targetIface].status = status;
        return calculateRoutingTable(nextState);
    }
    return nextState;
}

// ============ VLAN CONFIG ============

export function configureVlan(state: CLIState, vlanId: number, name?: string): CLIState {
    const nextState = cloneState(state);
    if (!nextState.vlans) nextState.vlans = [];

    const existingIndex = nextState.vlans.findIndex(v => v.id === vlanId);

    if (existingIndex >= 0) {
        if (name) nextState.vlans[existingIndex].name = name;
    } else {
        nextState.vlans.push({
            id: vlanId,
            name: name || `VLAN${vlanId.toString().padStart(4, '0')}`,
            ports: []
        });
        nextState.vlans.sort((a, b) => a.id - b.id);
    }
    return nextState;
}

// ============ STATIC ROUTING ============

export function addStaticRoute(state: CLIState, network: string, mask: string, nextHop: string): CLIState {
    const nextState = cloneState(state);
    if (!nextState.staticRoutes) nextState.staticRoutes = [];

    // Idempotency
    const exists = nextState.staticRoutes.some(r => r.network === network && r.mask === mask && r.nextHop === nextHop);
    if (!exists) {
        nextState.staticRoutes.push({ network, mask, nextHop });
    }
    return calculateRoutingTable(nextState);
}

export function removeStaticRoute(state: CLIState, network: string, mask: string, nextHop: string): CLIState {
    const nextState = cloneState(state);
    if (nextState.staticRoutes) {
        nextState.staticRoutes = nextState.staticRoutes.filter(r => !(r.network === network && r.mask === mask && r.nextHop === nextHop));
    }
    return calculateRoutingTable(nextState);
}

// ============ DYNAMIC ROUTING (RIP/OSPF) ============

export function configureRip(state: CLIState): CLIState {
    const nextState = cloneState(state);
    if (!nextState.ripConfig) {
        nextState.ripConfig = { version: 2, networks: [], autoSummary: false };
    }
    return nextState;
}

export function addRipNetwork(state: CLIState, network: string): CLIState {
    const nextState = cloneState(state);
    if (nextState.ripConfig && !nextState.ripConfig.networks.includes(network)) {
        nextState.ripConfig.networks.push(network);
    }
    return calculateRoutingTable(nextState);
}

export function configureOspf(state: CLIState, processId: number): CLIState {
    const nextState = cloneState(state);
    if (!nextState.ospfConfig) {
        nextState.ospfConfig = { processId, networks: [] };
    } else if (nextState.ospfConfig.processId !== processId) {
        // Switch process? For now just overwrite or update ID (simplified)
        nextState.ospfConfig.processId = processId;
    }
    return nextState;
}

export function addOspfNetwork(state: CLIState, network: string, wildcard: string, area: number): CLIState {
    const nextState = cloneState(state);
    if (nextState.ospfConfig) {
        const exists = nextState.ospfConfig.networks.some(n => n.network === network && n.wildcard === wildcard && n.area === area);
        if (!exists) {
            nextState.ospfConfig.networks.push({ network, wildcard, area });
        }
    }
    return calculateRoutingTable(nextState);
}

// ============ ROUTING TABLE CALCULATION ============

export function calculateRoutingTable(state: CLIState): CLIState {
    // 1. Reset Active Routes
    const newRoutes: CLIState['routes'] = [];
    const connectedSubnets: Array<{ net: string, mask: string, iface: string }> = [];

    // 2. Connected Routes (AD 0)
    // Only if Status is UP and IP is valid
    Object.entries(state.interfaces).forEach(([name, iface]) => {
        if (iface.status === 'up' && iface.ip && iface.ip !== 'unassigned' && iface.mask) {
            const network = calculateNetworkAddress(iface.ip, iface.mask);
            newRoutes.push({
                network,
                mask: iface.mask,
                nextHop: name, // specific format for connected
                type: 'connected'
            });
            connectedSubnets.push({ net: network, mask: iface.mask, iface: name });
        }
    });

    // 3. Static Routes (AD 1)
    state.staticRoutes?.forEach(r => {
        newRoutes.push({
            network: r.network,
            mask: r.mask,
            nextHop: r.nextHop,
            type: 'static'
        });
    });

    // 4. Dynamic (RIP - AD 120, OSPF - AD 110)
    // PRESERVE Existing Dynamic Routes (Managed by network-simulator.ts)
    if (state.routes) {
        state.routes.filter(r => ['ospf', 'rip', 'eigrp', 'bgp'].includes(r.type)).forEach(r => {
            newRoutes.push(r);
        });
    }

    state.routes = newRoutes;
    return state;
}


// ============ HELPERS ============

function calculateNetworkAddress(ip: string, mask: string): string {
    const ipOctets = ip.split('.').map(Number);
    const maskOctets = mask.split('.').map(Number);
    const networkOctets = ipOctets.map((octet, i) => octet & maskOctets[i]);
    return networkOctets.join('.');
}

// ==========================================
// SWITCHING LOGIC
// ==========================================

export function setSwitchportMode(state: CLIState, iface: string, mode: 'access' | 'trunk'): CLIState {
    const nextState = cloneState(state);
    if (nextState.interfaces[iface]) {
        nextState.interfaces[iface].switchportMode = mode;
    }
    return nextState;
}

export function setAccessVlan(state: CLIState, iface: string, vlanId: number): CLIState {
    const nextState = cloneState(state);
    if (nextState.interfaces[iface]) {
        nextState.interfaces[iface].accessVlan = vlanId;
    }
    return nextState;
}

// ============ EIGRP CONFIG ============

export function configureEigrp(state: CLIState, asNumber: number): CLIState {
    const next = cloneState(state);
    if (!next.eigrpConfig) {
        next.eigrpConfig = { asNumber, networks: [], noAutoSummary: true, passiveInterfaces: [] };
    } else if (next.eigrpConfig.asNumber !== asNumber) {
        next.eigrpConfig = { asNumber, networks: [], noAutoSummary: true, passiveInterfaces: [] };
    }
    return next;
}

export function addEigrpNetwork(state: CLIState, network: string): CLIState {
    const next = cloneState(state);
    if (next.eigrpConfig && !next.eigrpConfig.networks.includes(network)) {
        next.eigrpConfig.networks.push(network);
    }
    return next;
}

// ============ BGP CONFIG ============

export function configureBgp(state: CLIState, asNumber: number): CLIState {
    const next = cloneState(state);
    if (!next.bgpConfig) {
        next.bgpConfig = { asNumber, neighbors: [], networks: [] };
    } else if (next.bgpConfig.asNumber !== asNumber) {
        next.bgpConfig = { asNumber, neighbors: [], networks: [] };
    }
    return next;
}

export function addBgpNeighbor(state: CLIState, ip: string, remoteAs: number): CLIState {
    const next = cloneState(state);
    if (next.bgpConfig) {
        const existing = next.bgpConfig.neighbors.find(n => n.ip === ip);
        if (existing) {
            existing.remoteAs = remoteAs;
        } else {
            next.bgpConfig.neighbors.push({ ip, remoteAs });
        }
    }
    return next;
}

// ============ NAT CONFIG ============

export function configureNatInside(state: CLIState, iface: string): CLIState {
    const next = cloneState(state);
    if (!next.natConfig) next.natConfig = { insideInterfaces: [], outsideInterfaces: [], staticMappings: [], pools: [], overload: false };
    if (!next.natConfig.insideInterfaces.includes(iface)) next.natConfig.insideInterfaces.push(iface);
    next.natConfig.outsideInterfaces = next.natConfig.outsideInterfaces.filter(i => i !== iface);
    return next;
}

export function configureNatOutside(state: CLIState, iface: string): CLIState {
    const next = cloneState(state);
    if (!next.natConfig) next.natConfig = { insideInterfaces: [], outsideInterfaces: [], staticMappings: [], pools: [], overload: false };
    if (!next.natConfig.outsideInterfaces.includes(iface)) next.natConfig.outsideInterfaces.push(iface);
    next.natConfig.insideInterfaces = next.natConfig.insideInterfaces.filter(i => i !== iface);
    return next;
}

export function addNatStaticMapping(state: CLIState, local: string, global: string): CLIState {
    const next = cloneState(state);
    if (!next.natConfig) next.natConfig = { insideInterfaces: [], outsideInterfaces: [], staticMappings: [], pools: [], overload: false };
    // Check if mapping exists to avoid duplicates
    const exists = next.natConfig.staticMappings.some(m => m.local === local && m.global === global);
    if (!exists) next.natConfig.staticMappings.push({ local, global });
    return next;
}

// ============ ACL CONFIG ============

export function addAclRule(state: CLIState, id: string, rule: any): CLIState {
    const next = cloneState(state);
    if (!next.acls) next.acls = {};
    if (!next.acls[id]) {
        const type = parseInt(id) >= 100 && parseInt(id) < 200 ? 'extended' : 'standard';
        next.acls[id] = { type, rules: [] };
    }
    next.acls[id].rules.push(rule);
    return next;
}

// ============ STP CONFIG ============

export function configureStpMode(state: CLIState, mode: 'pvst' | 'rapid-pvst'): CLIState {
    const next = cloneState(state);
    if (!next.stpConfig) next.stpConfig = { mode, vlanPriorities: {} };
    next.stpConfig.mode = mode;
    return next;
}

// ============ DHCP CONFIG ============

export function configureDhcpPool(state: CLIState, name: string): CLIState {
    const next = cloneState(state);
    if (!next.dhcpPools) next.dhcpPools = [];
    const pool = next.dhcpPools.find(p => p.name === name);
    if (!pool) {
        next.dhcpPools.push({ name, dns: [] });
    }
    return next;
}

export function setDhcpNetwork(state: CLIState, poolName: string, network: string, mask: string): CLIState {
    const next = cloneState(state);
    if (next.dhcpPools) {
        const pool = next.dhcpPools.find(p => p.name === poolName);
        if (pool) {
            pool.network = `${network} ${mask}`; // Storing as string "IP Mask" for simplicity or split it
        }
    }
    return next;
}

export function setDhcpDefaultRouter(state: CLIState, poolName: string, routerIp: string): CLIState {
    const next = cloneState(state);
    if (next.dhcpPools) {
        const pool = next.dhcpPools.find(p => p.name === poolName);
        if (pool) {
            pool.defaultRouter = routerIp;
        }
    }
    return next;
}

export function setDhcpDnsServer(state: CLIState, poolName: string, dnsIp: string): CLIState {
    const next = cloneState(state);
    if (next.dhcpPools) {
        const pool = next.dhcpPools.find(p => p.name === poolName);
        if (pool) {
            if (!pool.dns) pool.dns = [];
            pool.dns.push(dnsIp);
        }
    }
    return next;
}

// ============ ETHERCHANNEL CONFIG ============

export function configureChannelGroup(state: CLIState, iface: string, channelId: number, mode: 'on' | 'active' | 'passive' | 'desirable' | 'auto'): CLIState {
    const next = cloneState(state);
    if (!next.etherChannels) next.etherChannels = {};

    // Determine protocol
    let protocol: 'lacp' | 'pagp' | 'on' = 'on';
    if (mode === 'active' || mode === 'passive') protocol = 'lacp';
    if (mode === 'auto' || mode === 'desirable') protocol = 'pagp';

    // Init Group if needed
    if (!next.etherChannels[channelId]) {
        next.etherChannels[channelId] = { protocol, members: [] };
        // Create Port-channel Interface automatically
        const poName = `Port-channel${channelId}`;
        if (!next.interfaces[poName]) {
            next.interfaces[poName] = {
                status: 'down', // Defaults to down until members are up
                description: `EtherChannel ${channelId}`
            };
        }
    }

    // Add Member
    if (!next.etherChannels[channelId].members.includes(iface)) {
        next.etherChannels[channelId].members.push(iface);
    }

    return next;
}

// ============ PORT SECURITY ============

export function enablePortSecurity(state: CLIState, iface: string): CLIState {
    const next = cloneState(state);
    if (!next.interfaces[iface]) return next;
    if (!next.interfaces[iface].portSecurity) {
        next.interfaces[iface].portSecurity = { enabled: true, violation: 'shutdown', maximum: 1, macAddresses: [] };
    } else {
        next.interfaces[iface].portSecurity!.enabled = true;
    }
    return next;
}

export function setPortSecurityMax(state: CLIState, iface: string, max: number): CLIState {
    const next = cloneState(state);
    if (next.interfaces[iface]?.portSecurity) {
        next.interfaces[iface].portSecurity!.maximum = max;
    }
    return next;
}

export function setPortSecurityViolation(state: CLIState, iface: string, action: 'protect' | 'restrict' | 'shutdown'): CLIState {
    const next = cloneState(state);
    if (next.interfaces[iface]?.portSecurity) {
        next.interfaces[iface].portSecurity!.violation = action;
    }
    return next;
}

export function addPortSecurityMac(state: CLIState, iface: string, mac: string): CLIState {
    const next = cloneState(state);
    if (next.interfaces[iface]?.portSecurity) {
        if (!next.interfaces[iface].portSecurity!.macAddresses) next.interfaces[iface].portSecurity!.macAddresses = [];
        if (!next.interfaces[iface].portSecurity!.macAddresses!.includes(mac)) {
            next.interfaces[iface].portSecurity!.macAddresses!.push(mac);
        }
    }
    return next;
}

export function setPortSecuritySticky(state: CLIState, iface: string): CLIState {
    const next = cloneState(state);
    if (next.interfaces[iface]?.portSecurity) {
        next.interfaces[iface].portSecurity!.sticky = true;
    }
    return next;
}
