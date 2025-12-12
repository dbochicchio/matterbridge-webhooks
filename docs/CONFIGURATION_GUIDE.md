# Matterbridge HTTP Configuration Guide

This guide explains how to configure devices with HTTP endpoints for Matterbridge.

## Overview

The plugin now supports per-device configuration with multiple HTTP endpoints for different actions. You can map various device types (lights, outlets, switches, scenes) to Matterbridge and use HTTP endpoints (GET/POST/PUT) as actions.

## Supported Device Types

- **Outlet** - Simple on/off outlet/plug
- **Switch** - Generic on/off switch
- **Light** - Simple on/off light
- **DimmableLight** - Light with brightness control (0-100%)
- **Scene** - Momentary trigger (automatically turns off after activation)

## Configuration Structure

### Basic Example (Light)

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

### Dimmable Light Example

```json
{
  "webhooks": {
    "Bedroom Light": {
      "deviceType": "DimmableLight",
      "on": {
        "method": "POST",
        "url": "http://192.168.1.101/api/light",
        "params": {
          "state": "on"
        }
      },
      "off": {
        "method": "POST",
        "url": "http://192.168.1.101/api/light",
        "params": {
          "state": "off"
        }
      },
      "brightness": {
        "method": "PUT",
        "url": "http://192.168.1.101/api/light",
        "params": {
          "brightness": 0
        }
      }
    }
  }
}
```

**Note**: For brightness endpoint, the `brightness` (0-100) and `level` (0-254) values are automatically included in the request.

### Scene Example

```json
{
  "webhooks": {
    "Good Night": {
      "deviceType": "Scene",
      "on": {
        "method": "POST",
        "url": "http://192.168.1.103/api/scene/goodnight",
        "params": {
          "trigger": true
        }
      }
    }
  }
}
```

**Note**: Scenes only need an `on` endpoint. They automatically turn off after 1 second.

## HTTP Methods

### GET
- Parameters are added to the URL as query parameters
- Example: `http://device/api?state=on&value=100`

### POST
- Parameters are sent in the request body as JSON
- URL placeholders like `${brightness}` are replaced with actual values
- Example: `{"state": "on", "brightness": 75}`

### PUT
- Works the same as POST
- Use based on your API requirements

## Parameter Substitution

You can use placeholders in URLs and parameters that get replaced with actual values:

### URL Placeholders

```json
{
  "brightness": {
    "method": "GET",
    "url": "http://192.168.1.100/brightness?value=${brightness}"
  }
}
```

When brightness is set to 75%, the URL becomes:
`http://192.168.1.100/brightness?value=75`

### Parameter Placeholders

```json
{
  "brightness": {
    "method": "POST",
    "url": "http://192.168.1.100/api",
    "params": {
      "level": "${level}",
      "percentage": "${brightness}"
    }
  }
}
```

Request body becomes:
```json
{
  "level": 191,
  "percentage": 75
}
```

## Available Variables

### Standard Variables

For **brightness** endpoint:
- `${brightness}` - Brightness percentage (0-100)
- `${level}` - Matter brightness level (0-254)

For **color** endpoints:
- `${hue}` - Hue in degrees (0-360)
- `${saturation}` - Saturation percentage (0-100)
- `${colorX}` - CIE X coordinate (0-1)
- `${colorY}` - CIE Y coordinate (0-1)
- `${colorTemperatureMireds}` - Color temperature in mireds

For **cover** endpoints:
- `{position}` - Cover position percentage (0-100)
- `{tilt}` - Tilt angle percentage (0-100)

### ha-bridge Intensity Replacements

For advanced integration with ha-bridge, the plugin now supports the complete set of intensity replacement patterns. These are especially useful for devices that expect complex brightness calculations:

#### Current Intensity Values

- `${intensity.percent}` - Whole number percentage (0-100)
- `${intensity.decimal_percent}` - Decimal percentage (0.00-1.00)
- `${intensity.byte}` - Byte value (0-254)
- `${intensity.percent.hex}` - Hex percentage (00-64 in hex)
- `${intensity.byte.hex}` - Hex byte (00-fe in hex)

#### Previous Intensity Values

Useful for creating transitions or detecting changes:

- `${intensity.previous_percent}` - Previous percentage (0-100)
- `${intensity.previous_decimal_percent}` - Previous decimal percentage (0.00-1.00)
- `${intensity.previous_byte}` - Previous byte value (0-254)

#### Math Functions

Apply mathematical operations to intensity:

- `${intensity.math(floor)}` - Floor value
- `${intensity.math(ceil)}` - Ceiling value
- `${intensity.math(round)}` - Rounded value
- `${intensity.math(abs)}` - Absolute value
- `${intensity.math(sqrt)}` - Square root

All math functions support `.hex` suffix for hexadecimal output:
- `${intensity.math(floor).hex}` - Floor value as hex

#### Example: ha-bridge Intensity Replacement

```json
{
  "webhooks": {
    "Advanced Light": {
      "deviceType": "DimmableLight",
      "brightness": {
        "method": "GET",
        "url": "http://192.168.1.100/api?brightness=${intensity.percent}&level=${intensity.byte}&prev=${intensity.previous_percent}"
      }
    }
  }
}
```

When brightness is set to 75%:
- URL becomes: `http://192.168.1.100/api?brightness=75&level=191&prev=0`

For POST/PUT requests, intensity replacements work in parameter values:

```json
{
  "brightness": {
    "method": "POST",
    "url": "http://192.168.1.100/api",
    "params": {
      "value": "${intensity.percent}",
      "hex": "${intensity.byte.hex}",
      "decimal": "${intensity.decimal_percent}"
    }
  }
}
```

Request body becomes:
```json
{
  "value": "75",
  "hex": "bf",
  "decimal": "0.75"
}
```

#### Practical Use Cases

**PWM Control (0-255 scale):**
```json
{
  "brightness": {
    "method": "GET",
    "url": "http://esp32.local/pwm?value=${intensity.byte}"
  }
}
```

**Percentage-based API:**
```json
{
  "brightness": {
    "method": "PUT",
    "url": "http://device.local/brightness",
    "params": {
      "percent": "${intensity.percent}"
    }
  }
}
```

**Logarithmic dimming:**
```json
{
  "brightness": {
    "method": "POST",
    "url": "http://driver.local/dim",
    "params": {
      "level": "${intensity.math(sqrt)}"
    }
  }
}
```

**Transition detection:**
```json
{
  "brightness": {
    "method": "GET",
    "url": "http://api.local/light?from=${intensity.previous_percent}&to=${intensity.percent}"
  }
}
```

You can also include custom static parameters in the `params` object.

## Real-World Examples

### Shelly Device (Gen 1)

```json
{
  "webhooks": {
    "Shelly Light": {
      "deviceType": "Light",
      "on": {
        "method": "GET",
        "url": "http://192.168.1.155/light/0?turn=on"
      },
      "off": {
        "method": "GET",
        "url": "http://192.168.1.155/light/0?turn=off"
      }
    }
  }
}
```

### Home Assistant Light

```json
{
  "webhooks": {
    "HA Light": {
      "deviceType": "DimmableLight",
      "on": {
        "method": "POST",
        "url": "http://homeassistant.local:8123/api/services/light/turn_on",
        "params": {
          "entity_id": "light.living_room"
        }
      },
      "off": {
        "method": "POST",
        "url": "http://homeassistant.local:8123/api/services/light/turn_off",
        "params": {
          "entity_id": "light.living_room"
        }
      },
      "brightness": {
        "method": "POST",
        "url": "http://homeassistant.local:8123/api/services/light/turn_on",
        "params": {
          "entity_id": "light.living_room",
          "brightness": 0
        }
      }
    }
  }
}
```

### Node-RED Webhook

```json
{
  "webhooks": {
    "NodeRED Scene": {
      "deviceType": "Scene",
      "on": {
        "method": "POST",
        "url": "http://nodered.local:1880/scene/morning",
        "params": {
          "source": "matterbridge",
          "timestamp": "auto"
        }
      }
    }
  }
}
```

### REST API with Authentication

```json
{
  "webhooks": {
    "API Light": {
      "deviceType": "DimmableLight",
      "on": {
        "method": "PUT",
        "url": "http://api.example.com/devices/light1/power?state=on&token=YOUR_TOKEN"
      },
      "off": {
        "method": "PUT",
        "url": "http://api.example.com/devices/light1/power?state=off&token=YOUR_TOKEN"
      },
      "brightness": {
        "method": "PUT",
        "url": "http://api.example.com/devices/light1/brightness?value=${brightness}&token=YOUR_TOKEN"
      }
    }
  }
}
```

## Multiple Commands Per Endpoint

You can specify multiple commands to be executed sequentially for a single endpoint action. This is useful when you need to perform multiple HTTP requests in sequence, such as turning on a device and then setting its brightness in one action.

### Syntax

Use an array of command objects instead of a single command object:

```json
{
  "webhooks": {
    "Device Name": {
      "deviceType": "DimmableLight",
      "on": [
        {
          "method": "GET",
          "url": "http://device/power?state=on"
        },
        {
          "method": "GET",
          "url": "http://device/brightness?value=100"
        }
      ]
    }
  }
}
```

### Sequential Execution

Commands in the array are executed sequentially (one after another). If a command fails, subsequent commands in the sequence are still attempted.

### Using Placeholders with Multiple Commands

Each command in the sequence has access to the same placeholders and substitutions:

```json
{
  "webhooks": {
    "Smart Light": {
      "deviceType": "DimmableLight",
      "brightness": [
        {
          "method": "POST",
          "url": "http://device/api/state",
          "params": {
            "action": "prepare",
            "device": "light1"
          }
        },
        {
          "method": "POST",
          "url": "http://device/api/brightness",
          "params": {
            "level": "${level.percent}",
            "fade": "true"
          }
        },
        {
          "method": "POST",
          "url": "http://device/api/confirm",
          "params": {
            "status": "complete"
          }
        }
      ]
    }
  }
}
```

### Real-World Examples

#### Turn On and Set Brightness (Single Command)

Instead of two separate actions, combine them:

```json
{
  "webhooks": {
    "Living Room Light": {
      "deviceType": "DimmableLight",
      "on": [
        {
          "method": "GET",
          "url": "http://192.168.1.100/light/turn/on"
        },
        {
          "method": "GET",
          "url": "http://192.168.1.100/light/brightness?value=100"
        }
      ],
      "brightness": {
        "method": "GET",
        "url": "http://192.168.1.100/light/brightness?value=${brightness}"
      }
    }
  }
}
```

#### Complex Device with Warmup Sequence

```json
{
  "webhooks": {
    "Heating Lamp": {
      "deviceType": "DimmableLight",
      "on": [
        {
          "method": "POST",
          "url": "http://192.168.1.110/api/device",
          "params": {
            "state": "warming"
          }
        },
        {
          "method": "POST",
          "url": "http://192.168.1.110/api/device",
          "params": {
            "state": "full_power"
          }
        }
      ],
      "off": {
        "method": "POST",
        "url": "http://192.168.1.110/api/device",
        "params": {
          "state": "off"
        }
      }
    }
  }
}
```

#### Cover with Position Feedback

```json
{
  "webhooks": {
    "Smart Blind": {
      "deviceType": "CoverLift",
      "coverPosition": [
        {
          "method": "POST",
          "url": "http://192.168.1.120/blinds/move",
          "params": {
            "position": "${level.percent}",
            "speed": "normal"
          }
        },
        {
          "method": "POST",
          "url": "http://192.168.1.120/blinds/confirm",
          "params": {
            "target": "${level.percent}"
          }
        }
      ]
    }
  }
}
```

### Notes on Multiple Commands

- **Order matters**: Commands execute in the order specified in the array
- **Error handling**: If one command fails, others still execute (non-blocking)
- **Timing**: Commands execute as fast as the network allows; use your device's API for delays if needed
- **Logging**: Each command is logged separately for troubleshooting
- **Substitution**: All placeholders (${level.*}, ${color.*}, etc.) work in every command

## Backward Compatibility

The old configuration format is still supported:

```json
{
  "deviceType": "Outlet",
  "webhooks": {
    "Old Style Device": {
      "method": "GET",
      "httpUrl": "http://192.168.1.100/relay/0?turn=toggle"
    }
  }
}
```

This will be automatically converted to the new format using the global `deviceType` and creating an `on` endpoint.

## Testing Endpoints

You can test your endpoints directly from the Matterbridge configuration UI:

1. Configure your device with the HTTP endpoints
2. Set `test: true` in the device configuration
3. Click the "Test ON" button in the UI
4. Check the Matterbridge logs for success/failure messages

## Troubleshooting

### Device not responding
- Check the URL is accessible from the Matterbridge host
- Verify the HTTP method matches your API requirements
- Check Matterbridge logs for error messages
- Test the endpoint manually with curl or a browser

### Brightness not working
- Ensure `deviceType` is set to `"DimmableLight"`
- Verify the `brightness` endpoint is configured
- Check if your device expects brightness as 0-100 or 0-254
- Use the correct placeholder: `${brightness}` for percentage, `${level}` for Matter level

### Scene triggers but doesn't turn off
- This is expected behavior - scenes automatically turn off after 1 second
- If you need it to stay on, use `"deviceType": "Switch"` instead

### Parameters not being sent correctly
- For GET requests: parameters become query parameters
- For POST/PUT requests: parameters are sent in the JSON body
- URL placeholders are replaced before parameters are added
- Check your API documentation for expected format

## Tips

1. **Use descriptive device names** - They will appear in your Matter controller
2. **Test each endpoint** - Use the test feature before deploying
3. **Check logs** - Enable debug mode for detailed HTTP request/response logs
4. **URL encoding** - Special characters in URLs should be properly encoded
5. **Timeouts** - HTTP requests timeout after 5 seconds by default
6. **Scenes for automation** - Use Scene device type for triggers that shouldn't maintain state

## Support

For issues and questions:
- Check the Matterbridge logs
- Review the configuration schema in the UI
- Refer to your device's HTTP API documentation
