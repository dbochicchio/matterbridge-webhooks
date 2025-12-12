# Migration Summary: HTTP Endpoints for Matterbridge

## What Changed

The plugin has been enhanced to support per-device configuration with multiple HTTP endpoints for different actions. This allows you to map various device types to Matterbridge with flexible HTTP control.

## Key New Features

### 1. **Per-Device Type Configuration**
- Each device can now have its own type (Outlet, Switch, Light, DimmableLight, Scene)
- No longer limited to a single global device type

### 2. **Multiple HTTP Endpoints**
- **on**: Endpoint called when turning device ON
- **off**: Endpoint called when turning device OFF
- **brightness**: Endpoint called when adjusting brightness (DimmableLight only)

### 3. **HTTP Method Support**
- **GET**: Parameters as query strings
- **POST**: Parameters in JSON body
- **PUT**: Parameters in JSON body (new!)

### 4. **Dynamic Parameter Substitution**
- Use placeholders like `${brightness}` or `${level}` in URLs
- Placeholders are replaced with actual values when requests are made
- Custom parameters can be included in each endpoint

### 5. **New Device Types**
- **DimmableLight**: Light with brightness control (0-100%)
- **Scene**: Momentary trigger that auto-turns off

## Code Changes

### Modified Files

1. **src/fetch.ts**
   - Added PUT method support
   - Updated type signatures to include 'PUT'

2. **src/module.ts**
   - Complete refactor to support per-device configuration
   - New `HttpEndpoint` interface for endpoint configuration
   - Enhanced `WebhookConfig` interface with new fields
   - Added `executeHttpRequest()` method for unified HTTP handling
   - Dynamic device type selection per device
   - Brightness control support for dimmable lights
   - Scene support with auto-off behavior
   - Backward compatibility with old config format

3. **matterbridge-webhooks.schema.json**
   - Updated schema to reflect new configuration structure
   - Per-device configuration with nested endpoint objects
   - Added descriptions for new features
   - Marked old fields as deprecated

4. **matterbridge-webhooks.config.json**
   - Updated with example configurations
   - Shows Light, DimmableLight, Outlet, and Scene examples
   - Demonstrates different HTTP methods and parameter usage

### New Files

1. **CONFIGURATION_GUIDE.md**
   - Comprehensive guide for configuring devices
   - Examples for different device types
   - Real-world use cases (Shelly, Home Assistant, Node-RED)
   - Troubleshooting tips
   - Parameter substitution documentation

## Configuration Examples

### Before (Old Format)
```json
{
  "deviceType": "Outlet",
  "webhooks": {
    "My Device": {
      "method": "GET",
      "httpUrl": "http://192.168.1.100/toggle"
    }
  }
}
```

### After (New Format)
```json
{
  "webhooks": {
    "My Light": {
      "deviceType": "DimmableLight",
      "on": {
        "method": "POST",
        "url": "http://192.168.1.100/light",
        "params": { "state": "on" }
      },
      "off": {
        "method": "POST",
        "url": "http://192.168.1.100/light",
        "params": { "state": "off" }
      },
      "brightness": {
        "method": "PUT",
        "url": "http://192.168.1.100/light",
        "params": { "brightness": 0 }
      }
    }
  }
}
```

## Backward Compatibility

✅ **Old configurations still work!**
- The plugin automatically converts old format to new format
- Uses global `deviceType` if per-device type is not specified
- Creates `on` endpoint from old `httpUrl` and `method` fields

## Testing

You can test your endpoints:
1. Configure the device in the UI
2. Set `test: true` 
3. Click "Test ON" button
4. Check logs for success/failure

## Use Cases

1. **Smart Home Integration**
   - Control Shelly devices
   - Trigger Home Assistant scenes
   - Control Zigbee lights via HTTP APIs

2. **Custom Automations**
   - Node-RED webhooks
   - Custom Python/Node.js services
   - IFTTT webhooks

3. **Complex Scenarios**
   - Different endpoints for on/off actions
   - Brightness control with custom mapping
   - Scene triggers for multi-device control

## Next Steps

1. Update your configuration to use the new format (optional - old format still works)
2. Explore new device types like DimmableLight and Scene
3. Use parameter substitution for dynamic values
4. Test your endpoints using the built-in test feature

## Benefits

- ✅ More flexible device configuration
- ✅ Per-device type selection
- ✅ Separate endpoints for different actions
- ✅ Parameter substitution support
- ✅ Scene support for momentary triggers
- ✅ Brightness control for dimmable lights
- ✅ PUT method support
- ✅ Backward compatible
- ✅ Better error handling

## Questions?

Refer to CONFIGURATION_GUIDE.md for detailed documentation and examples.
