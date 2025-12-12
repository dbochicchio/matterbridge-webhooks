# <img src="matterbridge.svg" alt="Matterbridge Logo" width="64px" height="64px">&nbsp;&nbsp;&nbsp;Matterbridge webhooks plugin

[![npm version](https://img.shields.io/npm/v/matterbridge-webhooks.svg)](https://www.npmjs.com/package/matterbridge-webhooks)
[![npm downloads](https://img.shields.io/npm/dt/matterbridge-webhooks.svg)](https://www.npmjs.com/package/matterbridge-webhooks)
[![Docker Version](https://img.shields.io/docker/v/luligu/matterbridge?label=docker%20version&sort=semver)](https://hub.docker.com/r/luligu/matterbridge)
[![Docker Pulls](https://img.shields.io/docker/pulls/luligu/matterbridge.svg)](https://hub.docker.com/r/luligu/matterbridge)
![Node.js CI](https://github.com/Luligu/matterbridge-webhooks/actions/workflows/build-matterbridge-plugin.yml/badge.svg)
![CodeQL](https://github.com/Luligu/matterbridge-webhooks/actions/workflows/codeql.yml/badge.svg)
[![codecov](https://codecov.io/gh/Luligu/matterbridge-webhooks/branch/main/graph/badge.svg)](https://codecov.io/gh/Luligu/mmatterbridge-webhooks)

[![power by](https://img.shields.io/badge/powered%20by-matterbridge-blue)](https://www.npmjs.com/package/matterbridge)
[![power by](https://img.shields.io/badge/powered%20by-matter--history-blue)](https://www.npmjs.com/package/matter-history)
[![power by](https://img.shields.io/badge/powered%20by-node--ansi--logger-blue)](https://www.npmjs.com/package/node-ansi-logger)
[![power by](https://img.shields.io/badge/powered%20by-node--persist--manager-blue)](https://www.npmjs.com/package/node-persist-manager)

---

This plugin allows you to expose HTTP-controlled devices to Matter by mapping them to virtual devices with configurable HTTP endpoints. Supports 25+ device types including lights, sensors, thermostats, covers, locks, and more.

## Features

- **25+ Device Types** - Comprehensive support for switches, lights, sensors, thermostats, covers, locks, mode select, and mounted switches
- **Advanced Light Control** - Full RGB/RGBW support with XY, HS color spaces and color temperature
- **Sensor Polling** - Automatic polling for contact, motion, temperature, humidity, pressure, and illuminance sensors with flexible JSON path extraction
- **Poll Templates** - MQTT Controller-style JSON path extraction for complex API responses (e.g., `sensors.temperature` or `data.values[0].temp`)
- **Per-device Configuration** - Each device can have its own type and endpoints
- **Flexible HTTP Endpoints** - Separate endpoints for different actions (on/off, brightness, color, position, etc.)
- **Multiple HTTP Methods** - GET, POST, and PUT support
- **Dynamic Parameters** - URL placeholder substitution (e.g., `${brightness}`, `${hue}`, `${temperature}`)
- **ha-bridge Intensity Replacements** - Advanced brightness patterns (`${intensity.percent}`, `${intensity.byte}`, `${intensity.math()}`, etc.)
- **ha-bridge Color Replacements** - Advanced color patterns (`${color.r}`, `${color.g}`, `${color.b}`, `${color.rgbx}`, `${color.hsb}`, etc.) with HSV-to-RGB conversion
- **Time Tracking** - Include timestamps in requests (`${time.millis}`)
- **Brightness Alias** - Convenient `${brightness}` placeholder for quick access
- **Multiple Commands Per Endpoint** - Execute sequential commands for complex device control
- **Custom Parameters** - Add custom key-value parameters to requests
- **Easy Configuration** - Configure everything through the Matterbridge frontend
- **Test Functionality** - Test endpoints directly from the config editor
- **Backward Compatible** - Old configuration format still works

## Supported Device Types

### Switches & Outlets

- **Outlet** - Smart plugs/outlets
- **Switch** - Generic on/off switches
- **Scene** - Momentary triggers

### Lights

- **Light** - Simple on/off lights
- **DimmableLight** - Lights with brightness (0-100%)
- **ColorTemperatureLight** - Dimmable + warm/cool white
- **ExtendedColorLight** - Full RGBW with XY, HS, and CT
- **ColorLightHS** - RGBW with Hue/Saturation
- **ColorLightXY** - RGBW with XY color space

### Sensors

- **ContactSensor** - Door/window contact sensors
- **MotionSensor** - PIR motion sensors
- **IlluminanceSensor** - Light level sensors (lux)
- **TemperatureSensor** - Temperature sensors (°C)
- **HumiditySensor** - Humidity sensors (%)
- **PressureSensor** - Pressure sensors (hPa)
- **ClimateSensor** - Combined temp/humidity/pressure

### Covers

- **CoverLift** - Window coverings with lift
- **CoverLiftTilt** - Window coverings with lift and tilt

### Locks

- **DoorLock** - Smart door locks

### Thermostats

- **ThermostatAuto** - Auto mode (heat + cool)
- **ThermostatHeat** - Heating only
- **ThermostatCool** - Cooling only (AC)

### Mode Select

- **ModeSelect** - Devices with multiple modes (fan speeds, etc.)

### Mounted Switches

- **OnOffMountedSwitch** - Wall-mounted on/off switches
- **DimmerMountedSwitch** - Wall-mounted dimmer switches

## Quick Start

📑 **[Documentation Index](docs/index.md)** - Complete documentation map
📖 **[Configuration Guide](docs/CONFIGURATION_GUIDE.md)** - Comprehensive setup guide with examples  
📘 **[Device Types Reference](docs/DEVICE_TYPES.md)** - Complete guide to all 25+ device types  
⚡ **[Quick Reference](docs/QUICK_REFERENCE.md)** - Common device configurations  
🔄 **[Migration Guide](docs/MIGRATION_GUIDE.md)** - Changes and upgrade information  
🌉 **[ha-bridge Intensity Reference](docs/HA_BRIDGE_INTENSITY_REFERENCE.md)** - Advanced ha-bridge intensity replacement patterns  
🎨 **[ha-bridge Color Reference](docs/HA_BRIDGE_COLOR_REFERENCE.md)** - Advanced ha-bridge color replacement patterns  
📊 **[Poll Templates Guide](docs/POLL_TEMPLATES.md)** - JSON path extraction for sensor polling

If you like this project and find it useful, please consider giving it a star on GitHub at https://github.com/Luligu/matterbridge-webhooks and sponsoring it.

<a href="https://www.buymeacoffee.com/luligugithub">
  <img src="bmc-button.svg" alt="Buy me a coffee" width="120">
</a>

## Prerequisites

### Matterbridge

Follow these steps to install or update Matterbridge if it is not already installed and up to date:

```
npm install -g matterbridge --omit=dev
```

on Linux you may need the necessary permissions:

```
sudo npm install -g matterbridge --omit=dev
```

See the complete guidelines on [Matterbridge](https://github.com/Luligu/matterbridge/blob/main/README.md) for more information.

## How to Configure a Device

1. Open the plugin configuration in the Matterbridge frontend
2. Add a new device in the `webhooks` section
3. Set a device name (this will appear in your Matter controller)
4. Select the `deviceType` (Outlet, Switch, Light, DimmableLight, Scene)
5. Configure HTTP endpoints:
   - **on** - Called when turning ON (required)
   - **off** - Called when turning OFF (optional for scenes)
   - **brightness** - Called when adjusting brightness (DimmableLight only)
6. For each endpoint, specify:
   - `method` - HTTP method (GET, POST, PUT)
   - `url` - Endpoint URL (can include `{placeholders}`)
   - `params` - Additional parameters (optional)
7. Test the endpoint using the Test button
8. Save and restart Matterbridge

See **[Quick Reference](QUICK_REFERENCE.md)** for ready-to-use examples!

## Configuration Examples

### Simple Light (Shelly Gen 1)

```json
{
  "webhooks": {
    "Living Room Light": {
      "deviceType": "Light",
      "on": {
        "method": "GET",
        "url": "http://192.168.1.100/light/0?turn=on"
      },
      "off": {
        "method": "GET",
        "url": "http://192.168.1.100/light/0?turn=off"
      }
    }
  }
}
```

### Dimmable Light

```json
{
  "webhooks": {
    "Bedroom Light": {
      "deviceType": "DimmableLight",
      "on": {
        "method": "POST",
        "url": "http://192.168.1.101/api/light",
        "params": { "state": "on" }
      },
      "off": {
        "method": "POST",
        "url": "http://192.168.1.101/api/light",
        "params": { "state": "off" }
      },
      "brightness": {
        "method": "PUT",
        "url": "http://192.168.1.101/api/light",
        "params": { "brightness": 0 }
      }
    }
  }
}
```

### Scene/Automation Trigger

```json
{
  "webhooks": {
    "Good Night": {
      "deviceType": "Scene",
      "on": {
        "method": "POST",
        "url": "http://192.168.1.102/api/scene/goodnight",
        "params": { "trigger": true }
      }
    }
  }
}
```

## More Examples

For more examples including:

- Home Assistant integration
- Node-RED webhooks
- Tasmota devices
- Custom REST APIs
- Authentication with tokens

See **[Quick Reference](QUICK_REFERENCE.md)** for complete examples.

## Device Types

- **Outlet** - Smart plugs/outlets (on/off)
- **Switch** - Generic switches (on/off)
- **Light** - Simple lights (on/off)
- **DimmableLight** - Lights with brightness control (0-100%)
- **Scene** - Momentary triggers (automatically turns off)

## HTTP Methods

- **GET** - Parameters as URL query strings
- **POST** - Parameters in JSON request body
- **PUT** - Parameters in JSON request body

## Parameter Substitution

Use placeholders in URLs that get replaced with actual values:

- `${brightness}` - Brightness percentage (0-100)
- `${level}` - Matter brightness level (0-254)

Example:

```
"url": "http://device/api?brightness=${brightness}"
```

When brightness is 75%, becomes:

```
http://device/api?brightness=75
```

## Testing

You can test endpoints directly from the configuration UI:

1. Set `test: true` in your device configuration
2. Click the "Test ON" button
3. Check Matterbridge logs for results

## Backward Compatibility

Old configuration format is still supported:

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

This automatically converts to the new format.

## Additional Examples from Original README

### Shelly Trv Gen 1

Control a Shelly Trv Gen 1 with boost, schedule, and profiles:

```json
{
  "webhooks": {
    "Boost 30min": {
      "deviceType": "Scene",
      "on": {
        "method": "POST",
        "url": "http://192.168.1.XXX/thermostats/0?boost_minutes=30"
      }
    },
    "Schedule Enable": {
      "deviceType": "Switch",
      "on": {
        "method": "POST",
        "url": "http://192.168.1.XXX/settings/thermostats/0?schedule=1"
      },
      "off": {
        "method": "POST",
        "url": "http://192.168.1.XXX/settings/thermostats/0?schedule=0"
      }
    },
    "Profile Working Day": {
      "deviceType": "Scene",
      "on": {
        "method": "POST",
        "url": "http://192.168.1.XXX/settings/thermostats/0?schedule_profile=1"
      }
    },
    "Profile Holiday": {
      "deviceType": "Scene",
      "on": {
        "method": "POST",
        "url": "http://192.168.1.XXX/settings/thermostats/0?schedule_profile=2"
      }
    }
  }
}
```

_Replace 192.168.1.XXX with your device IP address._
