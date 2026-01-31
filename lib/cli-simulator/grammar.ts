export type CommandHandler = (args: string[], state: any) => any;

export interface CommandNode {
    token: string;
    description?: string;
    handler?: CommandHandler;
    children?: Record<string, CommandNode>;
    isArgument?: boolean; // If true, matches any token (e.g. <ip>, <name>)
    argName?: string;
    minMode?: string; // Minimum mode required
}

export type CLIContext = 'user' | 'privileged' | 'global_config' | 'interface_config' | 'router_config' | 'line_config' | 'vlan_config';

/**
 * grammar.ts
 * Defines the strict command tree for the simulator.
 */
export const COMMAND_GRAMMAR: Record<CLIContext, Record<string, CommandNode>> = {
    // ==========================================
    // 1. USER EXEC MODE
    // ==========================================
    user: {
        'enable': { token: 'enable', description: 'Turn on privileged commands' },
        'en': { token: 'en', description: 'Turn on privileged commands' }, // Alias
        'exit': { token: 'exit', description: 'Exit the terminal' },
        'ping': {
            token: 'ping',
            children: {
                '<target>': { token: '<target>', isArgument: true, argName: 'target' }
            }
        },
        'show': {
            token: 'show',
            children: {
                'version': { token: 'version' },
                'clock': { token: 'clock' }
            }
        }
    },

    // ==========================================
    // 2. PRIVILEGED EXEC MODE
    // ==========================================
    privileged: {
        'configure': {
            token: 'configure',
            children: {
                'terminal': { token: 'terminal', description: 'Configure from the terminal' }
            }
        },
        'conf': { // Alias
            token: 'conf',
            children: {
                't': { token: 't' },
                'terminal': { token: 'terminal' }
            }
        },
        'exit': { token: 'exit' },
        'disable': { token: 'disable' },
        'show': {
            token: 'show',
            children: {
                'run': { token: 'run' },
                'running-config': { token: 'running-config' },
                'ip': {
                    token: 'ip',
                    children: {
                        'interface': {
                            token: 'interface',
                            children: {
                                'brief': { token: 'brief' },
                                'br': { token: 'br' } // Alias
                            }
                        },
                        'route': { token: 'route' }
                    }
                },
                'vlan': {
                    token: 'vlan',
                    children: {
                        'brief': { token: 'brief' },
                        'br': { token: 'br' }
                    }
                },
                'version': { token: 'version' }
            }
        },
        'sh': { // Alias root for show
            token: 'sh',
            children: {
                // Clone of show structure (simplified for brevity, full impl in processor loops usually)
                'run': { token: 'run' },
                'ip': {
                    token: 'ip',
                    children: {
                        'int': {
                            token: 'int',
                            children: { 'br': { token: 'br' } }
                        },
                        'route': { token: 'route' },
                        'eigrp': {
                            token: 'eigrp',
                            children: { 'neighbors': { token: 'neighbors' } }
                        },
                        'bgp': {
                            token: 'bgp',
                            children: { 'summary': { token: 'summary' } }
                        },
                        'nat': {
                            token: 'nat',
                            children: {
                                'translations': { token: 'translations' },
                                'statistics': { token: 'statistics' }
                            }
                        }
                    }
                },
                'vlan': { token: 'vlan', children: { 'br': { token: 'br' } } },
                'spanning-tree': { token: 'spanning-tree' },
                'access-lists': { token: 'access-lists' },
                'port-security': { token: 'port-security' }
            }
        },
        'write': { token: 'write', description: 'Save configuration' },
        'wr': { token: 'wr' }
    },

    // ==========================================
    // 3. GLOBAL CONFIG MODE
    // ==========================================
    global_config: {
        'hostname': {
            token: 'hostname',
            children: {
                '<name>': { token: '<name>', isArgument: true, argName: 'name' }
            }
        },
        'interface': {
            token: 'interface',
            children: {
                '<iface>': { token: '<iface>', isArgument: true, argName: 'iface' }
            }
        },
        'int': { // Alias
            token: 'int',
            children: {
                '<iface>': { token: '<iface>', isArgument: true, argName: 'iface' }
            }
        },
        'vlan': {
            token: 'vlan',
            children: {
                '<id>': { token: '<id>', isArgument: true, argName: 'id' }
            }
        },
        'ip': {
            token: 'ip',
            children: {
                'route': {
                    token: 'route',
                    children: {
                        '<network>': {
                            token: '<network>', isArgument: true, argName: 'network',
                            children: {
                                '<mask>': {
                                    token: '<mask>', isArgument: true, argName: 'mask',
                                    children: {
                                        '<nexthop>': { token: '<nexthop>', isArgument: true, argName: 'nexthop' }
                                    }
                                }
                            }
                        }
                    }
                },
                'dhcp': {
                    token: 'dhcp',
                    children: {
                        'pool': {
                            token: 'pool',
                            children: {
                                '<name>': { token: '<name>', isArgument: true, argName: 'poolName' }
                            }
                        },
                        'excluded-address': {
                            token: 'excluded-address',
                            children: {
                                '<ip>': { token: '<ip>', isArgument: true, children: { '<end_ip>': { token: '<end_ip>', isArgument: true } } }
                            }
                        }
                    }
                },
                'nat': {
                    token: 'nat',
                    children: {
                        'inside': {
                            token: 'inside',
                            children: {
                                'source': {
                                    token: 'source',
                                    children: {
                                        'static': {
                                            token: 'static',
                                            children: {
                                                '<local>': { token: '<local>', isArgument: true, children: { '<global>': { token: '<global>', isArgument: true } } }
                                            }
                                        },
                                        'list': {
                                            token: 'list',
                                            children: {
                                                '<acl>': {
                                                    token: '<acl>', isArgument: true,
                                                    children: {
                                                        'pool': {
                                                            token: 'pool',
                                                            children: {
                                                                '<pool_name>': {
                                                                    token: '<pool_name>', isArgument: true,
                                                                    children: { 'overload': { token: 'overload' } }
                                                                }
                                                            }
                                                        },
                                                        'interface': {
                                                            token: 'interface',
                                                            children: {
                                                                '<iface>': {
                                                                    token: '<iface>', isArgument: true,
                                                                    children: { 'overload': { token: 'overload' } }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                'pool': {
                                    token: 'pool',
                                    children: {
                                        '<name>': {
                                            token: '<name>', isArgument: true,
                                            children: {
                                                '<start>': {
                                                    token: '<start>', isArgument: true,
                                                    children: {
                                                        '<end>': {
                                                            token: '<end>', isArgument: true,
                                                            children: {
                                                                'netmask': {
                                                                    token: 'netmask',
                                                                    children: { '<mask>': { token: '<mask>', isArgument: true } }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        'router': {
            token: 'router',
            children: {
                'rip': { token: 'rip' },
                'ospf': {
                    token: 'ospf',
                    children: {
                        '<id>': { token: '<id>', isArgument: true, argName: 'processId' }
                    }
                },
                'eigrp': {
                    token: 'eigrp',
                    children: {
                        '<as>': { token: '<as>', isArgument: true, argName: 'asNumber' }
                    }
                },
                'bgp': {
                    token: 'bgp',
                    children: {
                        '<as>': { token: '<as>', isArgument: true, argName: 'asNumber' }
                    }
                }
            }
        },
        'access-list': {
            token: 'access-list',
            children: {
                '<id>': {
                    token: '<id>', isArgument: true, argName: 'aclId',
                    children: {
                        'permit': {
                            token: 'permit',
                            children: {
                                '<source>': { token: '<source>', isArgument: true, children: { '<wildcard>': { token: '<wildcard>', isArgument: true } } }
                            }
                        },
                        'deny': {
                            token: 'deny',
                            children: {
                                '<source>': { token: '<source>', isArgument: true, children: { '<wildcard>': { token: '<wildcard>', isArgument: true } } }
                            }
                        }
                    }
                }
            }
        },
        'spanning-tree': {
            token: 'spanning-tree',
            children: {
                'mode': {
                    token: 'mode',
                    children: {
                        'pvst': { token: 'pvst' },
                        'rapid-pvst': { token: 'rapid-pvst' }
                    }
                },
                'vlan': {
                    token: 'vlan',
                    children: {
                        '<vlan_list>': {
                            token: '<vlan_list>', isArgument: true,
                            children: {
                                'priority': {
                                    token: 'priority',
                                    children: { '<prio>': { token: '<prio>', isArgument: true } }
                                },
                                'root': {
                                    token: 'root',
                                    children: { 'primary': { token: 'primary' }, 'secondary': { token: 'secondary' } }
                                }
                            }
                        }
                    }
                }
            }
        },
        'exit': { token: 'exit' },
        'end': { token: 'end' },
        'do': {
            token: 'do',
            // Special handling in processor: execute sub-command as privileged
        }
    },

    // ==========================================
    // 4. INTERFACE CONFIG MODE
    // ==========================================
    interface_config: {
        'ip': {
            token: 'ip',
            children: {
                'address': {
                    token: 'address',
                    children: {
                        '<ip>': {
                            token: '<ip>', isArgument: true, argName: 'ip',
                            children: {
                                '<mask>': { token: '<mask>', isArgument: true, argName: 'mask' }
                            }
                        }
                    }
                },
                'add': { // Alias
                    token: 'add',
                    children: {
                        '<ip>': {
                            token: '<ip>', isArgument: true, argName: 'ip',
                            children: {
                                '<mask>': { token: '<mask>', isArgument: true, argName: 'mask' }
                            }
                        }
                    }
                },
                'nat': {
                    token: 'nat',
                    children: {
                        'inside': { token: 'inside' },
                        'outside': { token: 'outside' }
                    }
                },
                'access-group': {
                    token: 'access-group',
                    children: {
                        '<id>': {
                            token: '<id>', isArgument: true, argName: 'aclId',
                            children: {
                                'in': { token: 'in' },
                                'out': { token: 'out' }
                            }
                        }
                    }
                }
            }
        },
        'shutdown': { token: 'shutdown' },
        'shut': { token: 'shut' },
        'no': {
            token: 'no',
            children: {
                'shutdown': { token: 'shutdown' },
                'shut': { token: 'shut' },
                'ip': {
                    token: 'ip',
                    children: {
                        'address': { token: 'address' },
                        'nat': {
                            token: 'nat',
                            children: { 'inside': { token: 'inside' }, 'outside': { token: 'outside' } }
                        },
                        'access-group': {
                            token: 'access-group',
                            children: { '<id>': { token: '<id>', isArgument: true } }
                        }
                    }
                },
                'switchport': {
                    token: 'switchport',
                    children: {
                        'port-security': { token: 'port-security' }
                    }
                }
            }
        },
        'description': {
            token: 'description',
            children: {
                '<text>': { token: '<text>', isArgument: true, argName: 'description' }
            }
        },
        'switchport': {
            token: 'switchport',
            children: {
                'mode': {
                    token: 'mode',
                    children: {
                        'access': { token: 'access' },
                        'trunk': { token: 'trunk' },
                        'dynamic': {
                            token: 'dynamic',
                            children: { 'auto': { token: 'auto' }, 'desirable': { token: 'desirable' } }
                        }
                    }
                },
                'access': {
                    token: 'access',
                    children: {
                        'vlan': {
                            token: 'vlan',
                            children: {
                                '<vlan_id>': { token: '<vlan_id>', isArgument: true, argName: 'vlanId' }
                            }
                        }
                    }
                },
                'trunk': {
                    token: 'trunk',
                    children: {
                        'allowed': {
                            token: 'allowed',
                            children: {
                                'vlan': {
                                    token: 'vlan',
                                    children: {
                                        '<vlan_list>': { token: '<vlan_list>', isArgument: true, argName: 'vlanList' }
                                    }
                                }
                            }
                        },
                        'native': {
                            token: 'native',
                            children: {
                                'vlan': {
                                    token: 'vlan',
                                    children: { '<id>': { token: '<id>', isArgument: true } }
                                }
                            }
                        }
                    }
                },
                'port-security': {
                    token: 'port-security',
                    children: {
                        'maximum': {
                            token: 'maximum',
                            children: { '<count>': { token: '<count>', isArgument: true } }
                        },
                        'mac-address': {
                            token: 'mac-address',
                            children: {
                                'sticky': { token: 'sticky' },
                                '<mac>': { token: '<mac>', isArgument: true }
                            }
                        },
                        'violation': {
                            token: 'violation',
                            children: {
                                'protect': { token: 'protect' },
                                'restrict': { token: 'restrict' },
                                'shutdown': { token: 'shutdown' }
                            }
                        }
                    }
                }
            }
        },
        'channel-group': {
            token: 'channel-group',
            children: {
                '<id>': {
                    token: '<id>', isArgument: true, argName: 'channelId',
                    children: {
                        'mode': {
                            token: 'mode',
                            children: {
                                'on': { token: 'on' },
                                'active': { token: 'active' },
                                'passive': { token: 'passive' },
                                'desirable': { token: 'desirable' },
                                'auto': { token: 'auto' }
                            }
                        }
                    }
                }
            }
        },
        'exit': { token: 'exit' },
        'end': { token: 'end' }
    },

    // ==========================================
    // 5. VLAN CONFIG MODE
    // ==========================================
    vlan_config: {
        'name': {
            token: 'name',
            children: {
                '<name>': { token: '<name>', isArgument: true, argName: 'name' }
            }
        },
        'do': { token: 'do' },
        'exit': { token: 'exit' },
        'end': { token: 'end' }
    },

    // Placeholders for other modes
    router_config: {
        'version': {
            token: 'version',
            children: { '<ver>': { token: '<ver>', isArgument: true } }
        },
        'network': {
            token: 'network',
            children: {
                '<net>': {
                    token: '<net>', isArgument: true, argName: 'network',
                    children: {
                        '<wildcard>': {
                            token: '<wildcard>', isArgument: true, argName: 'wildcard',
                            children: {
                                'area': {
                                    token: 'area',
                                    children: { '<area>': { token: '<area>', isArgument: true, argName: 'area' } }
                                }
                            }
                        },
                        'mask': { // For BGP
                            token: 'mask',
                            children: { '<mask>': { token: '<mask>', isArgument: true } }
                        }
                    }
                }
            }
        },
        'neighbor': {
            token: 'neighbor',
            children: {
                '<ip>': {
                    token: '<ip>', isArgument: true,
                    children: {
                        'remote-as': {
                            token: 'remote-as',
                            children: { '<as>': { token: '<as>', isArgument: true } }
                        }
                    }
                }
            }
        },
        'no': {
            token: 'no',
            children: {
                'auto-summary': { token: 'auto-summary' }
            }
        },
        'passive-interface': {
            token: 'passive-interface',
            children: { '<iface>': { token: '<iface>', isArgument: true } }
        },
        'exit': { token: 'exit' },
        'end': { token: 'end' }
    },
    line_config: {
        'password': {
            token: 'password',
            children: { '<pwd>': { token: '<pwd>', isArgument: true } }
        },
        'login': {
            token: 'login',
            children: { 'local': { token: 'local' } }
        },
        'transport': {
            token: 'transport',
            children: {
                'input': {
                    token: 'input',
                    children: {
                        'ssh': { token: 'ssh' },
                        'telnet': { token: 'telnet' },
                        'all': { token: 'all' },
                        'none': { token: 'none' }
                    }
                }
            }
        },
        'exit': { token: 'exit' },
        'end': { token: 'end' }
    },
    dhcp_config: {
        'network': {
            token: 'network',
            children: {
                '<ip>': {
                    token: '<ip>', isArgument: true, argName: 'networkIp',
                    children: {
                        '<mask>': { token: '<mask>', isArgument: true, argName: 'mask' }
                    }
                }
            }
        },
        'default-router': {
            token: 'default-router',
            children: {
                '<ip>': { token: '<ip>', isArgument: true, argName: 'routerIp' }
            }
        },
        'dns-server': {
            token: 'dns-server',
            children: {
                '<ip>': { token: '<ip>', isArgument: true, argName: 'dnsIp' }
            }
        },
        'exit': { token: 'exit' },
        'end': { token: 'end' }
    }
};
