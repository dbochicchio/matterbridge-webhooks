# Quick Reference: Common HTTP Device Configurations

## Simple On/Off Light (Shelly Gen 1)

```json
{
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
```

## Dimmable Light with URL Parameters

```json
{
  "Bedroom Light": {
    "deviceType": "DimmableLight",
    "on": {
      "method": "GET",
      "url": "http://192.168.1.101/api?state=on"
    },
    "off": {
      "method": "GET",
      "url": "http://192.168.1.101/api?state=off"
    },
    "brightness": {
      "method": "GET",
      "url": "http://192.168.1.101/api?brightness=$${brightness}"
    }
  }
}
```

## Dimmable Light with JSON Body (POST)

```json
{
  "Kitchen Light": {
    "deviceType": "DimmableLight",
    "on": {
      "method": "POST",
      "url": "http://192.168.1.102/api/light",
      "params": {
        "power": "on",
        "transition": 500
      }
    },
    "off": {
      "method": "POST",
      "url": "http://192.168.1.102/api/light",
      "params": {
        "power": "off",
        "transition": 500
      }
    },
    "brightness": {
      "method": "POST",
      "url": "http://192.168.1.102/api/light",
      "params": {
        "brightness": 0,
        "transition": 300
      }
    }
  }
}
```

## Smart Outlet/Plug

```json
{
  "Coffee Maker": {
    "deviceType": "Outlet",
    "on": {
      "method": "GET",
      "url": "http://192.168.1.103/relay/0?turn=on"
    },
    "off": {
      "method": "GET",
      "url": "http://192.168.1.103/relay/0?turn=off"
    }
  }
}
```

## Scene/Automation Trigger

```json
{
  "Good Morning": {
    "deviceType": "Scene",
    "on": {
      "method": "POST",
      "url": "http://192.168.1.104/api/scenes/morning",
      "params": {
        "trigger": true,
        "source": "matter"
      }
    }
  }
}
```

## Node-RED Webhook

```json
{
  "NodeRED Trigger": {
    "deviceType": "Scene",
    "on": {
      "method": "POST",
      "url": "http://192.168.1.105:1880/webhook/trigger",
      "params": {
        "device": "matterbridge",
        "action": "activate"
      }
    }
  }
}
```

## Home Assistant Light

```json
{
  "HA Living Room": {
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
        "brightness_pct": 0
      }
    }
  }
}
```

## RGBW Light with Fixed Color Temperature

```json
{
  "RGBW Strip": {
    "deviceType": "DimmableLight",
    "on": {
      "method": "PUT",
      "url": "http://192.168.1.106/api/light",
      "params": {
        "state": "on",
        "color_temp": 4000
      }
    },
    "off": {
      "method": "PUT",
      "url": "http://192.168.1.106/api/light",
      "params": {
        "state": "off"
      }
    },
    "brightness": {
      "method": "PUT",
      "url": "http://192.168.1.106/api/light",
      "params": {
        "state": "on",
        "brightness": 0,
        "color_temp": 4000
      }
    }
  }
}
```

## RESTful API with Token Authentication

```json
{
  "API Light": {
    "deviceType": "Light",
    "on": {
      "method": "POST",
      "url": "http://api.example.com/v1/devices/light1/power",
      "params": {
        "state": "on",
        "api_token": "YOUR_API_TOKEN_HERE"
      }
    },
    "off": {
      "method": "POST",
      "url": "http://api.example.com/v1/devices/light1/power",
      "params": {
        "state": "off",
        "api_token": "YOUR_API_TOKEN_HERE"
      }
    }
  }
}
```

## Multiple Shelly Devices

```json
{
  "Shelly Light 1": {
    "deviceType": "Light",
    "on": {
      "method": "GET",
      "url": "http://192.168.1.110/light/0?turn=on"
    },
    "off": {
      "method": "GET",
      "url": "http://192.168.1.110/light/0?turn=off"
    }
  },
  "Shelly Plug 1": {
    "deviceType": "Outlet",
    "on": {
      "method": "GET",
      "url": "http://192.168.1.111/relay/0?turn=on"
    },
    "off": {
      "method": "GET",
      "url": "http://192.168.1.111/relay/0?turn=off"
    }
  },
  "Shelly Dimmer": {
    "deviceType": "DimmableLight",
    "on": {
      "method": "GET",
      "url": "http://192.168.1.112/light/0?turn=on"
    },
    "off": {
      "method": "GET",
      "url": "http://192.168.1.112/light/0?turn=off"
    },
    "brightness": {
      "method": "GET",
      "url": "http://192.168.1.112/light/0?brightness=$${brightness}"
    }
  }
}
```

## Tasmota Device

```json
{
  "Tasmota Light": {
    "deviceType": "DimmableLight",
    "on": {
      "method": "GET",
      "url": "http://192.168.1.120/cm?cmnd=Power%20On"
    },
    "off": {
      "method": "GET",
      "url": "http://192.168.1.120/cm?cmnd=Power%20Off"
    },
    "brightness": {
      "method": "GET",
      "url": "http://192.168.1.120/cm?cmnd=Dimmer%20$${brightness}"
    }
  }
}
```

## ESP8266/ESP32 Custom Firmware

```json
{
  "ESP Light": {
    "deviceType": "DimmableLight",
    "on": {
      "method": "GET",
      "url": "http://192.168.1.130/led?state=1"
    },
    "off": {
      "method": "GET",
      "url": "http://192.168.1.130/led?state=0"
    },
    "brightness": {
      "method": "GET",
      "url": "http://192.168.1.130/led?pwm=$${brightness}"
    }
  }
}
```

## ha-bridge Intensity Replacements (Advanced)

### PWM with Byte Value

```json
{
  "LED Strip": {
    "deviceType": "DimmableLight",
    "brightness": {
      "method": "GET",
      "url": "http://192.168.1.200/pwm?value=${intensity.byte}"
    }
  }
}
```

**When brightness is set to 75%:** `http://192.168.1.200/pwm?value=191`

### Percentage-based API

```json
{
  "Smart Light": {
    "deviceType": "DimmableLight",
    "brightness": {
      "method": "POST",
      "url": "http://192.168.1.201/brightness",
      "params": {
        "percent": "${intensity.percent}",
        "decimal": "${intensity.decimal_percent}"
      }
    }
  }
}
```

**Request body:** `{"percent": "75", "decimal": "0.75"}`

### With Previous Value (Transition)

```json
{
  "Fade Light": {
    "deviceType": "DimmableLight",
    "brightness": {
      "method": "POST",
      "url": "http://192.168.1.202/fade",
      "params": {
        "from": "${intensity.previous_percent}",
        "to": "${intensity.percent}",
        "duration": 500
      }
    }
  }
}
```

**Request body:** `{"from": "50", "to": "75", "duration": 500}`

### Hex Format

```json
{
  "Hex Device": {
    "deviceType": "DimmableLight",
    "brightness": {
      "method": "GET",
      "url": "http://192.168.1.203/cmd?brightness=${intensity.byte.hex}"
    }
  }
}
```

**When brightness is set to 75%:** `http://192.168.1.203/cmd?brightness=bf`

### Math Functions

```json
{
  "Logarithmic": {
    "deviceType": "DimmableLight",
    "brightness": {
      "method": "GET",
      "url": "http://192.168.1.204/set?brightness=${intensity.math(sqrt)}"
    }
  }
}
```

**When brightness is set to 75%:** `http://192.168.1.204/set?brightness=8.66`

For complete ha-bridge intensity documentation, see **[ha-bridge Intensity Reference](HA_BRIDGE_INTENSITY_REFERENCE.md)**

## ha-bridge Color Replacements (Advanced)

### RGB Color with Separate Channels

```json
{
  "RGB Light": {
    "deviceType": "ColorLight",
    "color": {
      "method": "POST",
      "url": "http://192.168.1.300/color",
      "params": {
        "r": "${color.r}",
        "g": "${color.g}",
        "b": "${color.b}"
      }
    }
  }
}
```

**When set to red:** `{"r": "255", "g": "0", "b": "0"}`
**When set to green:** `{"r": "0", "g": "255", "b": "0"}`
**When set to blue:** `{"r": "0", "g": "0", "b": "255"}`

### Hex Color String

```json
{
  "Hex Color Light": {
    "deviceType": "ColorLight",
    "color": {
      "method": "GET",
      "url": "http://192.168.1.301/color?hex=${color.rgbx}"
    }
  }
}
```

**When set to red:** `http://192.168.1.301/color?hex=ff0000`
**When set to green:** `http://192.168.1.301/color?hex=00ff00`
**When set to purple:** `http://192.168.1.301/color?hex=ff00ff`

### HSB Format (Hue, Saturation, Brightness)

```json
{
  "HSB Light": {
    "deviceType": "ColorLight",
    "hue": {
      "method": "POST",
      "url": "http://192.168.1.302/api",
      "params": {
        "hsb": "${color.hsb}"
      }
    },
    "saturation": {
      "method": "POST",
      "url": "http://192.168.1.302/api",
      "params": {
        "hsb": "${color.hsb}"
      }
    }
  }
}
```

**When set to red (full saturation):** `{"hsb": "0,100,100"}`
**When set to pastel red (50% saturation):** `{"hsb": "0,50,100"}`
**When set to dim red:** `{"hsb": "0,100,50"}`

### Color with Brightness and Timestamp

```json
{
  "Advanced Color": {
    "deviceType": "ColorLight",
    "color": {
      "method": "POST",
      "url": "http://192.168.1.303/api",
      "params": {
        "hex": "${color.rgbx}",
        "brightness": "$${brightness}",
        "hue": "${color.h}",
        "saturation": "${color.s}",
        "timestamp": "${time.millis}"
      }
    }
  }
}
```

**Request body when set to red at 75% brightness:**

```json
{
  "hex": "ff0000",
  "brightness": "75",
  "hue": "0",
  "saturation": "100",
  "timestamp": "1699564234567"
}
```

For complete ha-bridge color documentation, see **[ha-bridge Color Reference](HA_BRIDGE_COLOR_REFERENCE.md)**

## Color Value Reference

| Hue     | Color | Degrees |
| ------- | ----- | ------- |
| Red     | 0°    | `0`     |
| Yellow  | 60°   | `60`    |
| Green   | 120°  | `120`   |
| Cyan    | 180°  | `180`   |
| Blue    | 240°  | `240`   |
| Magenta | 300°  | `300`   |

Common color hex values:

- Pure Red: `ff0000`
- Pure Green: `00ff00`
- Pure Blue: `0000ff`
- White: `ffffff`
- Black: `000000`
- Yellow: `ffff00`
- Cyan: `00ffff`
- Magenta: `ff00ff`

## Multiple Commands Per Endpoint

Execute multiple HTTP requests sequentially for a single action:

```json
{
  "Smart Light": {
    "deviceType": "DimmableLight",
    "on": [
      {
        "method": "GET",
        "url": "http://192.168.1.100/power?state=on"
      },
      {
        "method": "GET",
        "url": "http://192.168.1.100/brightness?value=100"
      }
    ]
  }
}
```

### Use Cases

**Brightness adjustment with fade:**

```json
{
  "brightness": [
    {
      "method": "POST",
      "url": "http://device/api",
      "params": { "fade": "true" }
    },
    {
      "method": "POST",
      "url": "http://device/api",
      "params": { "level": "${level.percent}" }
    }
  ]
}
```

**Multi-step device control:**

```json
{
  "on": [
    { "method": "GET", "url": "http://device/warm-up" },
    { "method": "GET", "url": "http://device/ready" }
  ]
}
```

**Cover with confirmation:**

```json
{
  "coverPosition": [
    {
      "method": "POST",
      "url": "http://device/move",
      "params": { "position": "${level.percent}" }
    },
    {
      "method": "POST",
      "url": "http://device/confirm"
    }
  ]
}
```

## Tips

1. **Replace IP addresses** with your actual device IPs
2. **Test endpoints** before deploying (use `"test": true`)
3. **Check device documentation** for correct API endpoints
4. **Use HTTPS** if your devices support it for security
5. **Placeholder formats**:
   - **Standard format** (backward compatible):
   - `$${brightness}` = 0-100 (percentage)
   - `$${level}` = 0-254 (Matter standard)
   - **ha-bridge format** (advanced):
     - `${intensity.*}` = intensity replacements (13 patterns)
     - `${color.*}` = color replacements (11 patterns)
     - `$${brightness}` = brightness alias for `${intensity.percent}`
     - `${time.millis}` = current time in milliseconds
   - Both formats can be used together in the same configuration
6. **Method selection**:
   - Use GET for simple URL-based APIs
   - Use POST/PUT for JSON-based APIs
7. **Scenes** automatically turn off - perfect for triggers
8. **Parameters** in GET become query strings, in POST/PUT become JSON body
9. **Advanced brightness support** - Use `${intensity.*}` patterns for specialized brightness handling (see [ha-bridge Intensity Reference](HA_BRIDGE_INTENSITY_REFERENCE.md))
10. **Color support** - Use `${color.*}` patterns for RGB/HSB color handling (see [ha-bridge Color Reference](HA_BRIDGE_COLOR_REFERENCE.md))

## Testing Commands

Test an endpoint manually with curl:

```bash
# GET request
curl "http://192.168.1.100/light/0?turn=on"

# POST request
curl -X POST http://192.168.1.100/api/light \
  -H "Content-Type: application/json" \
  -d '{"state":"on"}'

# PUT request
curl -X PUT http://192.168.1.100/api/light \
  -H "Content-Type: application/json" \
  -d '{"brightness":75}'
```
