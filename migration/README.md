# ha-bridge Migration Tools

This directory contains utilities to help migrate from ha-bridge to the Matterbridge Webhooks plugin.

## Quick Start

### Using the Node.js Script (Recommended)

```bash
node migrate-habridge.js device.db config.json
```

This will:

1. Parse your ha-bridge device.db JSON export
2. Map device types to plugin equivalents
3. Convert URL endpoints to the plugin format
4. Generate a complete plugin configuration
5. Skip any inactive devices

## Input Format

The migration tools expect a `device.db` file that is a JSON array of device objects.

Each device object should have:

```json
{
  "id": 1,
  "name": "Living Room Light",
  "deviceType": "light",
  "onUrl": "[{\"item\":\"http://192.168.1.100/api/lights/1/on\"}]",
  "offUrl": "[{\"item\":\"http://192.168.1.100/api/lights/1/off\"}]",
  "dimUrl": "[{\"item\":\"http://192.168.1.100/api/lights/1/bri?value=${brightness}\"}]",
  "colorUrl": "[{\"item\":\"http://192.168.1.100/api/lights/1/color?hex=${color}\"}]",
  "inactive": false
}
```

### URL Array Format

ha-bridge uses this array format for URLs:

```json
[
  {"item": "http://..."},
  {"type": "..."}
]
```

The migration tools parse this automatically.

## Device Type Mapping

The migration tools intelligently map ha-bridge device types:

| ha-bridge Type   | Mapped Type        | Conditions             |
| ---------------- | ------------------ | ---------------------- |
| `switch`         | Switch             | No dimming             |
| `switch`         | Outlet             | No dimming             |
| `light`          | Light              | Simple on/off          |
| `light`          | DimmableLight      | Has brightness control |
| `light`          | ExtendedColorLight | Has color support      |
| `dimmer`         | DimmableLight      | Always has dimming     |
| `scene`          | Scene              | Scene trigger          |
| `cover`, `blind` | CoverLift          | Position/blind control |
| `lock`           | DoorLock           | Lock device            |
| `thermostat`     | ThermostatAuto     | Temperature control    |

## Output Format

The migration generates a complete plugin configuration:

```json
{
  "name": "matterbridge-webhooks",
  "type": "DynamicPlatform",
  "version": "1.0.0",
  "whiteList": [],
  "blackList": [],
  "timeout": 5000,
  "webhooks": {
    "Living Room Light": {
      "deviceType": "ExtendedColorLight",
      "on": {
        "method": "GET",
        "url": "http://192.168.1.100/api/lights/1/on"
      },
      "off": {
        "method": "GET",
        "url": "http://192.168.1.100/api/lights/1/off"
      },
      "brightness": {
        "method": "GET",
        "url": "http://192.168.1.100/api/lights/1/bri?value=${brightness}"
      }
    }
  }
}
```

## Usage Examples

### Export device.db from ha-bridge

1. Open ha-bridge web interface
2. Go to Settings → Backup/Export
3. Export the device database as JSON
4. Save as `device.db`

### Run the migration

````bash
# Migrate with specific output file
node migrate-habridge.js device.db matterbridge-config.json

# Migrate with default output (device-migrated.json)
node migrate-habridge.js device.db

### Post-Migration Steps

1. **Review the output**

   ```bash
   cat device-migrated.json | less
````

2. **Verify URL correctness**
   - Check that endpoints are using correct URLs
   - Verify HTTP methods (GET/POST) are appropriate
   - Test a few devices manually

3. **Adjust device types if needed**
   - Some devices may be mapped incorrectly
   - Update `deviceType` field for any mismatches

4. **Add optional settings**

   ```json
   {
     "webhooks": {
       "Device Name": {
         "deviceType": "Switch",
         "timeout": 10000,
         "on": { "method": "GET", "url": "..." }
       }
     }
   }
   ```

5. **Copy to configuration**

   ```bash
   # Back up existing config
   cp matterbridge-webhooks.config.json matterbridge-webhooks.config.json.backup

   # Copy migrated config (merge if you have existing devices)
   cp device-migrated.json matterbridge-webhooks.config.json
   ```

6. **Restart the plugin**
   - Restart Matterbridge
   - Check the logs for any errors

## Troubleshooting

### "Input file not found"

Ensure the `device.db` file path is correct and the file exists.

### Device type seems wrong

Device type mapping is based on available endpoints (on/off/dim/color). You can:

- Manually edit the generated JSON
- Update the mapping logic if many devices are incorrect

### URLs appear malformed

Check that the original ha-bridge export is valid JSON. Some ha-bridge versions may format URLs differently.

### Some devices are skipped

The migration skips:

- Inactive devices (`"inactive": true`)
- Devices with no action URLs
- Devices with parse errors

Check the console output for details.

## Advanced Usage

### Filter specific device types

Edit the output JSON to remove or modify devices:

```bash
# Extract only Switch devices
node -e "const cfg = require('./device-migrated.json');
for (let [k, v] of Object.entries(cfg.webhooks))
  if (v.deviceType !== 'Switch') delete cfg.webhooks[k];
console.log(JSON.stringify(cfg, null, 2))" > switches-only.json
```

### Merge with existing config

```bash
# Combine two configs
node -e "const base = require('./matterbridge-webhooks.config.json');
const migrated = require('./device-migrated.json');
base.webhooks = {...base.webhooks, ...migrated.webhooks};
console.log(JSON.stringify(base, null, 2))" > merged.json
```

## See Also

- [CONFIGURATION_GUIDE.md](../docs/CONFIGURATION_GUIDE.md) - Complete configuration reference
- [DEVICE_TYPES.md](../docs/DEVICE_TYPES.md) - Supported device types
- [matterbridge-webhooks.config.json](../matterbridge-webhooks.config.json) - Example configuration

## Support

For issues with the migration:

1. Check this README for troubleshooting
2. Review the migration output for obvious issues
3. Test individual devices manually
4. Open an issue with:
   - A sample `device.db` excerpt
   - The generated configuration snippet
   - Expected vs. actual results
