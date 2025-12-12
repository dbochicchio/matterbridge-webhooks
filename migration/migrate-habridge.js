#!/usr/bin/env node

/**
 * Migration Tool: ha-bridge device.db to Matterbridge Webhooks Configuration
 * 
 * Converts ha-bridge device.db JSON exports to the matterbridge-webhooks plugin format.
 *
 * Usage:
 *   node migrate-habridge.js <input-device.db> [output-config.json]
 *   
 * Examples:
 *   node migrate-habridge.js device.db config.json
 *   node migrate-habridge.js device.db  # outputs to device-migrated.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m',
    dim: '\x1b[2m'
};

/**
 * Generate a consistent unique ID from a device name (using simple hash)
 * Same algorithm as used in module.ts
 */
function generateUniqueId(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        const char = name.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    // Convert to positive hex string
    return 'webhook-' + (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Main migration function
 */
function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.error(`${colors.red}Error: No input file specified${colors.reset}`);
        console.error('Usage: node migrate-habridge.js <input-device.db> [output-config.json]');
        console.error('');
        console.error('Example:');
        console.error('  node migrate-habridge.js device.db config.json');
        process.exit(1);
    }
    
    const inputFile = args[0];
    const outputFile = args[1] || path.join(path.dirname(inputFile), 
                                            path.basename(inputFile, path.extname(inputFile)) + '-migrated.json');
    
    // Verify input file exists
    if (!fs.existsSync(inputFile)) {
        console.error(`${colors.red}Error: Input file '${inputFile}' not found${colors.reset}`);
        process.exit(1);
    }
    
    console.log(`${colors.blue}=== ha-bridge to Matterbridge Webhooks Migration ===${colors.reset}`);
    console.log(`${colors.blue}Input:  ${inputFile}${colors.reset}`);
    console.log(`${colors.blue}Output: ${outputFile}${colors.reset}`);
    console.log('');
    
    try {
        // Read and parse the device.db file
        const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
        
        if (!Array.isArray(data)) {
            throw new Error('Input file is not a JSON array of devices');
        }
        
        // Perform migration
        const result = migrateDevices(data);
        
        // Write the output configuration
        fs.writeFileSync(outputFile, JSON.stringify(result.config, null, 2), 'utf8');
        
        // Print summary
        console.log(`${colors.green}✓ Migration complete!${colors.reset}`);
        console.log(`  Converted: ${result.convertedCount} devices`);
        console.log(`  Skipped:   ${result.skippedCount} devices`);
        console.log(`  Output:    ${outputFile}`);
        console.log('');
        console.log(`${colors.dim}Next steps:${colors.reset}`);
        console.log('  1. Review the generated configuration in ' + outputFile);
        console.log('  2. Verify URLs are correctly mapped');
        console.log('  3. Adjust device types if needed');
        console.log('  4. Copy to matterbridge-webhooks.config.json');
        
    } catch (err) {
        console.error(`${colors.red}Error: ${err.message}${colors.reset}`);
        process.exit(1);
    }
}

/**
 * Migrate all devices from ha-bridge format
 */
function migrateDevices(devices) {
    // Initialize the new configuration
    const config = {
        name: 'matterbridge-webhooks',
        type: 'DynamicPlatform',
        version: '1.0.0',
        whiteList: [],
        blackList: [],
        timeout: 5000,
        webhooks: {}
    };
    
    let convertedCount = 0;
    let skippedCount = 0;
    
    // Process each device
    devices.forEach((device) => {
        try {
            const name = device.name || `Device ${device.id}`;
            
            // Skip inactive devices
            if (device.inactive === true) {
                console.log(`${colors.dim}⊘${colors.reset} Skipping inactive: ${name}`);
                skippedCount++;
                return;
            }
            
            // Determine device type mapping
            const deviceType = mapDeviceType(device.deviceType, device);
            
            // Parse URLs from array format
            const onUrl = parseUrlArray(device.onUrl);
            const offUrl = parseUrlArray(device.offUrl);
            const dimUrl = parseUrlArray(device.dimUrl);
            const colorUrl = parseUrlArray(device.colorUrl);
            
            // Skip if no action URLs
            if (!onUrl && !offUrl && !dimUrl) {
                console.log(`${colors.dim}⊘${colors.reset} Skipping (no URLs): ${name}`);
                skippedCount++;
                return;
            }
            
            // Determine uniqueId: use device.uniqueid from ha-bridge if available, otherwise generate from name
            let uniqueId;
            if (device.uniqueid) {
                // Use ha-bridge uniqueid with habridge- prefix to distinguish from hash-based IDs
                uniqueId = 'habridge-' + device.uniqueid.replace(/:/g, '');
            } else {
                // Fall back to hash-based generation from device name
                uniqueId = generateUniqueId(name);
            }
            
            // Build the webhook config
            const webhook = {
                deviceType: deviceType,
                uniqueId: uniqueId
            };
            
            // Add on endpoint
            if (onUrl) {
                webhook.on = parseEndpoint(onUrl, device);
            }
            
            // Add off endpoint
            if (offUrl) {
                webhook.off = parseEndpoint(offUrl, device);
            }
            
            // Add dimming/position
            if (dimUrl) {
                if (deviceType === 'DimmableLight') {
                    webhook.brightness = parseEndpoint(dimUrl, device);
                } else if (deviceType.includes('Cover')) {
                    // For covers, map dimUrl to lift position, not brightness
                    webhook.coverPosition = parseEndpoint(dimUrl, device);
                }
            }
            
            // Add color control
            if (colorUrl) {
                if (deviceType.includes('Color')) {
                    // Parse color URL for RGB endpoints
                    const colorEndpoint = parseEndpoint(colorUrl, device);
                    webhook.colorHue = colorEndpoint;
                }
            }
            
            // Add the webhook to config
            config.webhooks[name] = webhook;
            console.log(`${colors.green}✓${colors.reset} ${name} → ${deviceType}`);
            convertedCount++;
            
        } catch (err) {
            console.log(`${colors.red}✗${colors.reset} Error processing '${device.name}': ${err.message}`);
            skippedCount++;
        }
    });
    
    return { config, convertedCount, skippedCount };
}

/**
 * Map ha-bridge device types to Matterbridge device types
 */
function mapDeviceType(haType, device) {
    // Determine capabilities
    const hasDim = !!device.dimUrl;
    const hasColor = !!device.colorUrl;  // Assume color support if colorUrl exists
    const deviceType = device.deviceType || 'switch';
    const deviceName = (device.name || '').toLowerCase();
    
    // Check device name for specific patterns first
    if (deviceName.includes('scena') || deviceName.includes('scene')) {
        return 'Scene';
    }
    
    if (deviceName.includes('vacuum') || deviceName.includes('deebot')) {
        return 'Switch'; // Vacuum treated as switch for on/off control
    }
    
    if (deviceName.includes('tapparella') || deviceName.includes('tenda') || deviceName.includes('tende') || deviceName.includes('lamelle')) {
        return 'CoverLift';
    }
    
    if (deviceName.includes('presa')) {
        return 'Outlet';
    }
    
    // Scene devices
    if (deviceType === 'scene') {
        return 'Scene';
    }
    
    // Color devices (if colorUrl exists, assume color support)
    if (hasColor) {
        return 'ExtendedColorLight';
    }
    
    // Dimmable/brightness devices
    if (hasDim) {
        // Could be dimmer, blind, or light
        if (device.mapId && (device.mapId.includes('position') || device.mapId.includes('blind') || device.mapId.includes('cover'))) {
            return 'CoverLift';
        }
        return 'DimmableLight';
    }
    
    // Simple switches
    switch (haType) {
        case 'switch':
            return 'Switch';
        case 'outlet':
            return 'Outlet';
        case 'light':
            return 'Light';
        case 'scene':
            return 'Scene';
        case 'dimmer':
            return 'DimmableLight';
        case 'cover':
        case 'blind':
            return 'CoverLift';
        case 'lock':
            return 'DoorLock';
        case 'thermostat':
            return 'ThermostatAuto';
        default:
            return 'Switch';
    }
}

/**
 * Parse ha-bridge URL array format: [{"item":"url","type":"..."}]
 */
function parseUrlArray(urlData) {
    if (!urlData) return null;
    
    try {
        // Handle string representation of JSON
        if (typeof urlData === 'string') {
            // Try to parse as JSON
            const parsed = JSON.parse(urlData);
            
            if (Array.isArray(parsed) && parsed.length > 0) {
                // Return the first item's URL
                const item = parsed[0];
                if (item && item.item) {
                    return item.item;
                }
            }
        }
        return null;
    } catch (err) {
        return null;
    }
}

/**
 * Parse a URL into endpoint object
 * Handles URL decoding, HTTP method detection, and placeholder replacement
 */
function parseEndpoint(url, device) {
    if (!url) return null;
    
    try {
        // Decode URL entities
        let cleanUrl = decodeURIComponent(url.trim());
        
        // Replace ${device.mapId} with actual mapId value
        if (cleanUrl.includes('${device.mapId}') && device && device.mapId) {
            cleanUrl = cleanUrl.replace(/\$\{device\.mapId\}/g, device.mapId);
        }
        
        // Default HTTP method is GET (as per ha-bridge documentation)
        let method = 'GET';
        
        // Check if the original URL data contains explicit httpVerb field
        // This would be detected from the ha-bridge device structure
        if (url.includes('"httpVerb":"POST"') || url.includes("'httpVerb':'POST'")) {
            method = 'POST';
        } else if (url.includes('"httpVerb":"PUT"') || url.includes("'httpVerb':'PUT'")) {
            method = 'PUT';
        }
        
        return {
            method: method,
            url: cleanUrl
        };
    } catch (err) {
        return {
            method: 'GET',
            url: url
        };
    }
}

// Run the migration
if (process.argv[1] === __filename) {
    main();
}

export {
    migrateDevices,
    mapDeviceType,
    parseUrlArray,
    parseEndpoint,
    generateUniqueId
};
