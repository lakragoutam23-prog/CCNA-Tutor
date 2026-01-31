
import { CLIState, NetworkTopology, NetworkDevice } from '@/types';

// ==========================================
// TOPOLOGY MANAGEMENT
// ==========================================

export function createTopology(id: string, name: string): NetworkTopology {
    return {
        id,
        name,
        devices: {},
        links: []
    };
}

export function addDevice(topology: NetworkTopology, id: string, name: string, type: NetworkDevice['type'], initialConfig: CLIState): NetworkTopology {
    const next = JSON.parse(JSON.stringify(topology));
    next.devices[id] = {
        id,
        name,
        type,
        interfaces: {}, // Hardware interfaces
        config: initialConfig,
        position: { x: 0, y: 0 }
    };
    // Sync hardware interfaces from CLI State
    Object.keys(initialConfig.interfaces).forEach(ifaceName => {
        next.devices[id].interfaces[ifaceName] = {
            name: ifaceName,
            status: 'up', // Default hardware status
            connectedTo: undefined
        };
    });
    return next;
}

export function connectDevices(topology: NetworkTopology, dev1: string, port1: string, dev2: string, port2: string): NetworkTopology {
    const next = JSON.parse(JSON.stringify(topology));

    // Add Link
    next.links.push({
        id: `${dev1}:${port1}-${dev2}:${port2}`,
        source: { deviceId: dev1, port: port1 },
        target: { deviceId: dev2, port: port2 },
        status: 'up'
    });

    // Update Interface References
    if (next.devices[dev1]?.interfaces[port1]) {
        next.devices[dev1].interfaces[port1].connectedTo = { deviceId: dev2, port: port2 };
        next.devices[dev1].interfaces[port1].status = 'up';
    }
    if (next.devices[dev2]?.interfaces[port2]) {
        next.devices[dev2].interfaces[port2].connectedTo = { deviceId: dev1, port: port1 };
        next.devices[dev2].interfaces[port2].status = 'up';
    }

    return next;
}
