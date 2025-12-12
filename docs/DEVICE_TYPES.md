# Complete Device Types Reference

This document provides detailed information about all supported device types and their HTTP endpoint configurations.

## Table of Contents

- [Switches & Outlets](#switches--outlets)
- [Lights](#lights)
- [Sensors](#sensors)
- [Covers](#covers)
- [Locks](#locks)
- [Thermostats](#thermostats)
- [Mode Select](#mode-select)
- [Mounted Switches](#mounted-switches)

---

## Switches & Outlets

### Outlet

Simple on/off outlet/plug device.

**Endpoints:**

- `on` - Turn outlet on
- `off` - Turn outlet off

**Example:**

```json
{
  "Coffee Maker": {
    "deviceType": "Outlet",
    "on": {
      "method": "GET",
      "url": "http://192.168.1.100/relay/0?turn=on"
    },
    "off": {
      "method": "GET",
      "url": "http://192.168.1.100/relay/0?turn=off"
    }
  }
}
```

### Switch

Generic on/off switch.

**Endpoints:**

- `on` - Turn switch on
- `off` - Turn switch off

**Example:**

```json
{
  "Garden Light Switch": {
    "deviceType": "Switch",
    "on": {
      "method": "POST",
      "url": "http://192.168.1.101/api/switch",
      "params": { "state": "on" }
    },
    "off": {
      "method": "POST",
      "url": "http://192.168.1.101/api/switch",
      "params": { "state": "off" }
    }
  }
}
```

### Scene

Momentary trigger that automatically turns off after activation (1 second).

**Endpoints:**

- `on` - Trigger the scene

**Example:**

```json
{
  "Good Night Scene": {
    "deviceType": "Scene",
    "on": {
      "method": "POST",
      "url": "http://192.168.1.102/api/scenes/goodnight",
      "params": { "trigger": true }
    }
  }
}
```

---

## Lights

### Light

Simple on/off light.

**Endpoints:**

- `on` - Turn light on
- `off` - Turn light off

**Example:**

```json
{
  "Porch Light": {
    "deviceType": "Light",
    "on": {
      "method": "GET",
      "url": "http://192.168.1.110/light?state=on"
    },
    "off": {
      "method": "GET",
      "url": "http://192.168.1.110/light?state=off"
    }
  }
}
```

### DimmableLight

Light with brightness control (0-100%).

**Endpoints:**

- `on` - Turn light on
- `off` - Turn light off
- `brightness` - Set brightness (0-100)

**Variables:**

- `${brightness}` - 0-100 percentage
- `${level}` - 0-254 Matter level

**Example:**

```json
{
  "Living Room Dimmer": {
    "deviceType": "DimmableLight",
    "on": {
      "method": "POST",
      "url": "http://192.168.1.111/api/light",
      "params": { "power": "on" }
    },
    "off": {
      "method": "POST",
      "url": "http://192.168.1.111/api/light",
      "params": { "power": "off" }
    },
    "brightness": {
      "method": "PUT",
      "url": "http://192.168.1.111/api/light/brightness",
      "params": { "value": 0 }
    }
  }
}
```

### ColorTemperatureLight

Dimmable light with color temperature control (warm to cool white).

**Endpoints:**

- `on` - Turn light on
- `off` - Turn light off
- `brightness` - Set brightness (0-100)
- `colorTemperature` - Set color temperature (mireds)

**Variables:**

- `${brightness}` - 0-100
- `${level}` - 0-254
- `${colorTemperatureMireds}` - Color temperature in mireds (153-500)

**Example:**

```json
{
  "Office CT Light": {
    "deviceType": "ColorTemperatureLight",
    "on": {
      "method": "POST",
      "url": "http://192.168.1.112/api/light",
      "params": { "state": "on" }
    },
    "off": {
      "method": "POST",
      "url": "http://192.168.1.112/api/light",
      "params": { "state": "off" }
    },
    "brightness": {
      "method": "PUT",
      "url": "http://192.168.1.112/api/light",
      "params": { "brightness": 0 }
    },
    "colorTemperature": {
      "method": "PUT",
      "url": "http://192.168.1.112/api/light",
      "params": { "ct": 0 }
    }
  }
}
```

### ExtendedColorLight

Full-featured RGBW light with XY, HS color control and color temperature.

**Endpoints:**

- `on` - Turn light on
- `off` - Turn light off
- `brightness` - Set brightness
- `colorHue` - Set color (hue and saturation combined). Automatically converts to RGB. This is the recommended single endpoint for color control.
- `colorXY` - Set color using XY coordinates
- `colorTemperature` - Set color temperature

**Variables:**

- `${brightness}` - 0-100
- `${hue}` - 0-360 degrees
- `${saturation}` - 0-100%
- `${color.r}`, `${color.g}`, `${color.b}` - RGB values 0-255
- `${color.rx}`, `${color.gx}`, `${color.bx}` - RGB hex values (00-FF)
- `${color.rgbx}` - Combined RGB hex (RRGGBB)
- `${color.h}` - Hue (0-254 Matter format)
- `${color.s}` - Saturation (0-254 Matter format)
- `${colorX}` - 0-1
- `${colorY}` - 0-1
- `${colorTemperatureMireds}` - mireds

**Example:**

```json
{
  "RGB Strip": {
    "deviceType": "ExtendedColorLight",
    "on": {
      "method": "POST",
      "url": "http://192.168.1.113/api/light",
      "params": { "state": "on" }
    },
    "off": {
      "method": "POST",
      "url": "http://192.168.1.113/api/light",
      "params": { "state": "off" }
    },
    "brightness": {
      "method": "PUT",
      "url": "http://192.168.1.113/api/light",
      "params": { "brightness": 0 }
    },
    "colorHue": {
      "method": "PUT",
      "url": "http://192.168.1.113/api/light",
      "params": { "r": "${color.r}", "g": "${color.g}", "b": "${color.b}" }
    },
    "colorTemperature": {
      "method": "PUT",
      "url": "http://192.168.1.113/api/light",
      "params": { "ct": 0 }
    }
  }
}
```

### ColorLightHS

Color light with Hue/Saturation control (no XY).

**Endpoints:**

- Same as ExtendedColorLight but without `colorXY`

### ColorLightXY

Color light with XY color control.

**Endpoints:**

- Same as ExtendedColorLight but focus on `colorXY`

---

## Sensors

All sensors support polling for state updates via the `pollState` endpoint.

### ContactSensor

Door/window contact sensor.

**Endpoints:**

- `pollState` - Poll sensor state

**Expected Response:**

```json
{
  "state": true,  // or "contact": true
  // true = closed, false = open
}
```

**Example:**

```json
{
  "Front Door": {
    "deviceType": "ContactSensor",
    "pollState": {
      "method": "GET",
      "url": "http://192.168.1.120/api/door/front"
    },
    "pollInterval": 30
  }
}
```

### MotionSensor

PIR motion sensor.

**Endpoints:**

- `pollState` - Poll sensor state

**Expected Response:**

```json
{
  "occupied": true,  // or "motion": true
  // true = motion detected
}
```

**Example:**

```json
{
  "Hallway Motion": {
    "deviceType": "MotionSensor",
    "pollState": {
      "method": "GET",
      "url": "http://192.168.1.121/api/motion/hallway"
    },
    "pollInterval": 10
  }
}
```

### IlluminanceSensor

Light level sensor (lux).

**Endpoints:**

- `pollState` - Poll sensor state

**Expected Response:**

```json
{
  "illuminance": 450,  // or "lux": 450
  // value in lux
}
```

**Example:**

```json
{
  "Living Room Light Sensor": {
    "deviceType": "IlluminanceSensor",
    "pollState": {
      "method": "GET",
      "url": "http://192.168.1.122/api/sensor/light"
    },
    "pollInterval": 60
  }
}
```

### TemperatureSensor

Temperature sensor (°C).

**Endpoints:**

- `pollState` - Poll sensor state

**Expected Response:**

```json
{
  "temperature": 22.5
  // value in °C
}
```

**Example:**

```json
{
  "Outdoor Temp": {
    "deviceType": "TemperatureSensor",
    "pollState": {
      "method": "GET",
      "url": "http://192.168.1.123/api/sensor/temperature"
    },
    "pollInterval": 120
  }
}
```

### HumiditySensor

Relative humidity sensor (%).

**Endpoints:**

- `pollState` - Poll sensor state

**Expected Response:**

```json
{
  "humidity": 65
  // value in percentage
}
```

**Example:**

```json
{
  "Bathroom Humidity": {
    "deviceType": "HumiditySensor",
    "pollState": {
      "method": "GET",
      "url": "http://192.168.1.124/api/sensor/humidity"
    },
    "pollInterval": 60
  }
}
```

### PressureSensor

Atmospheric pressure sensor (hPa).

**Endpoints:**

- `pollState` - Poll sensor state

**Expected Response:**

```json
{
  "pressure": 1013.25
  // value in hPa (hectopascals)
}
```

**Example:**

```json
{
  "Weather Station": {
    "deviceType": "PressureSensor",
    "pollState": {
      "method": "GET",
      "url": "http://192.168.1.125/api/sensor/pressure"
    },
    "pollInterval": 300
  }
}
```

### ClimateSensor

Combined temperature, humidity, and pressure sensor.

**Endpoints:**

- `pollState` - Poll sensor state

**Expected Response:**

```json
{
  "temperature": 22.5,
  "humidity": 65,
  "pressure": 1013.25
}
```

**Example:**

```json
{
  "Climate Monitor": {
    "deviceType": "ClimateSensor",
    "pollState": {
      "method": "GET",
      "url": "http://192.168.1.126/api/climate"
    },
    "pollInterval": 60
  }
}
```

---

## Covers

### CoverLift

Window covering with lift/open-close control.

**Endpoints:**

- `coverPosition` - Set position (0-100, 0=open, 100=closed)

**Variables:**

- `{position}` - 0-100 percentage

**Example:**

```json
{
  "Living Room Blinds": {
    "deviceType": "CoverLift",
    "coverPosition": {
      "method": "PUT",
      "url": "http://192.168.1.130/api/cover",
      "params": { "position": 0 }
    }
  }
}
```

### CoverLiftTilt

Window covering with both lift and tilt control.

**Endpoints:**

- `coverPosition` - Set lift position (0-100)
- `coverTilt` - Set tilt position (0-100)

**Variables:**

- `{position}` - 0-100
- `{tilt}` - 0-100

**Example:**

```json
{
  "Bedroom Venetian Blinds": {
    "deviceType": "CoverLiftTilt",
    "coverPosition": {
      "method": "PUT",
      "url": "http://192.168.1.131/api/cover/position",
      "params": { "lift": 0 }
    },
    "coverTilt": {
      "method": "PUT",
      "url": "http://192.168.1.131/api/cover/tilt",
      "params": { "angle": 0 }
    }
  }
}
```

---

## Locks

### DoorLock

Smart door lock.

**Endpoints:**

- `lock` - Lock the door
- `unlock` - Unlock the door

**Example:**

```json
{
  "Front Door Lock": {
    "deviceType": "DoorLock",
    "lock": {
      "method": "POST",
      "url": "http://192.168.1.140/api/lock",
      "params": { "state": "locked" }
    },
    "unlock": {
      "method": "POST",
      "url": "http://192.168.1.140/api/lock",
      "params": { "state": "unlocked" }
    }
  }
}
```

---

## Thermostats

### ThermostatAuto

Thermostat with auto mode (heating and cooling).

**Endpoints:**

- `setHeatingPoint` - Set heating setpoint temperature
- `setCoolingPoint` - Set cooling setpoint temperature
- `setMode` - Set thermostat mode

**Variables:**

- `${temperature}` - Temperature in °C
- `{mode}` - Thermostat mode

**Example:**

```json
{
  "Living Room Thermostat": {
    "deviceType": "ThermostatAuto",
    "setHeatingPoint": {
      "method": "PUT",
      "url": "http://192.168.1.150/api/thermostat/heating",
      "params": { "temp": 0 }
    },
    "setCoolingPoint": {
      "method": "PUT",
      "url": "http://192.168.1.150/api/thermostat/cooling",
      "params": { "temp": 0 }
    },
    "setMode": {
      "method": "PUT",
      "url": "http://192.168.1.150/api/thermostat/mode",
      "params": { "mode": 0 }
    }
  }
}
```

### ThermostatHeat

Heating-only thermostat.

**Endpoints:**

- `setHeatingPoint` - Set heating setpoint

**Example:**

```json
{
  "Bedroom Heater": {
    "deviceType": "ThermostatHeat",
    "setHeatingPoint": {
      "method": "PUT",
      "url": "http://192.168.1.151/api/heater/setpoint",
      "params": { "temperature": 0 }
    }
  }
}
```

### ThermostatCool

Cooling-only thermostat (air conditioner).

**Endpoints:**

- `setCoolingPoint` - Set cooling setpoint

**Example:**

```json
{
  "Bedroom AC": {
    "deviceType": "ThermostatCool",
    "setCoolingPoint": {
      "method": "PUT",
      "url": "http://192.168.1.152/api/ac/setpoint",
      "params": { "temperature": 0 }
    }
  }
}
```

---

## Mode Select

### ModeSelect

Device with multiple selectable modes.

**Endpoints:**

- `setModeValue` - Set the current mode

**Configuration:**

- `modes` - Array of available modes

**Variables:**

- `{mode}` - Mode number

**Example:**

```json
{
  "Fan Speed": {
    "deviceType": "ModeSelect",
    "modes": [
      { "label": "Off", "mode": 0 },
      { "label": "Low", "mode": 1 },
      { "label": "Medium", "mode": 2 },
      { "label": "High", "mode": 3 }
    ],
    "setModeValue": {
      "method": "PUT",
      "url": "http://192.168.1.160/api/fan/mode",
      "params": { "speed": 0 }
    }
  }
}
```

---

## Mounted Switches

These are physical switches mounted on walls that control other devices.

### OnOffMountedSwitch

Wall-mounted on/off switch.

**Endpoints:**

- `on` - Switch on
- `off` - Switch off

**Example:**

```json
{
  "Wall Switch 1": {
    "deviceType": "OnOffMountedSwitch",
    "on": {
      "method": "POST",
      "url": "http://192.168.1.170/api/switch/1",
      "params": { "state": "on" }
    },
    "off": {
      "method": "POST",
      "url": "http://192.168.1.170/api/switch/1",
      "params": { "state": "off" }
    }
  }
}
```

### DimmerMountedSwitch

Wall-mounted dimmer switch.

**Endpoints:**

- `on` - Switch on
- `off` - Switch off
- `brightness` - Set brightness level

**Example:**

```json
{
  "Wall Dimmer 1": {
    "deviceType": "DimmerMountedSwitch",
    "on": {
      "method": "POST",
      "url": "http://192.168.1.171/api/dimmer/1",
      "params": { "state": "on" }
    },
    "off": {
      "method": "POST",
      "url": "http://192.168.1.171/api/dimmer/1",
      "params": { "state": "off" }
    },
    "brightness": {
      "method": "PUT",
      "url": "http://192.168.1.171/api/dimmer/1/level",
      "params": { "level": 0 }
    }
  }
}
```

---

## General Notes

### Polling Intervals

- Default: 60 seconds
- Minimum recommended: 10 seconds
- Maximum recommended: 300 seconds (5 minutes)
- Set via `pollInterval` (in seconds)

### Parameter Substitution

All endpoints support parameter substitution using `{variableName}` syntax in URLs and params.

### HTTP Methods

- **GET**: Best for simple URL-based APIs, parameters become query strings
- **POST**: Parameters sent as JSON in request body
- **PUT**: Similar to POST, use based on API requirements

### Error Handling

All HTTP requests have a 5-second timeout. Failed requests are logged but don't prevent the device from functioning.

### Testing

Use the `test: true` configuration option and the "Test" button in the Matterbridge UI to verify endpoints before deployment.
