# Color Control Patterns

This guide shows you how to use color patterns in your device configurations.

## What Are Color Patterns?

Color patterns automatically convert the device's color into the format your API needs. For example, `${color.r}` gives you the red value, `${color.rgbx}` gives you the full RGB hex color.

## Quick Reference Table

| Replacement     | Format          | Example Value (Red: Hue=0°) | Use Case              |
| --------------- | --------------- | --------------------------- | --------------------- |
| `${color.r}`    | 0-255 (integer) | `255`                       | RGB red component     |
| `${color.g}`    | 0-255 (integer) | `0`                         | RGB green component   |
| `${color.b}`    | 0-255 (integer) | `0`                         | RGB blue component    |
| `${color.rx}`   | 00-ff (hex)     | `ff`                        | RGB red in hex        |
| `${color.gx}`   | 00-ff (hex)     | `00`                        | RGB green in hex      |
| `${color.bx}`   | 00-ff (hex)     | `00`                        | RGB blue in hex       |
| `${color.rgbx}` | rrggbb (hex)    | `ff0000`                    | Full RGB hex color    |
| `${color.hsb}`  | h,s,b format    | `0,100,100`                 | HSB format string     |
| `${color.h}`    | 0-360 (degrees) | `0`                         | Hue in degrees        |
| `${color.s}`    | 0-100 (percent) | `100`                       | Saturation percentage |
| `${color.b}`    | 0-100 (percent) | `100`                       | Brightness percentage |

## Time Replacement

| Replacement      | Format       | Example Value   | Use Case                          |
| ---------------- | ------------ | --------------- | --------------------------------- |
| `${time.millis}` | milliseconds | `1699564234567` | Current Unix time in milliseconds |

## Placeholder Format

The Matterbridge HTTP plugin supports multiple placeholder formats:

- **Standard format**: `${brightness}` (backward compatible)
- **ha-bridge format**: `${intensity.*}`, `${color.*}`, `${time.*}` (new)

Both formats can be used together in the same configuration.

## Color Replacements - Detailed Reference

### RGB Integer Values (0-255)

These provide direct RGB color component values suitable for APIs that expect 8-bit color channels.

#### `${color.r}` - Red Component

- **Range**: 0 to 255
- **Format**: Whole number integer
- **Use**: RGB color APIs, JSON payloads with RGB channels
- **Example**: Red color → `255`
- **Example**: Green color → `0`

```json
{
  "colorLight": {
    "deviceType": "ColorLight",
    "color": {
      "method": "POST",
      "url": "http://device.local/api/color",
      "params": {
        "r": "${color.r}",
        "g": "${color.g}",
        "b": "${color.b}"
      }
    }
  }
}
```

#### `${color.g}` - Green Component

- **Range**: 0 to 255
- **Format**: Whole number integer
- **Use**: Green channel in RGB color models
- **Example**: Green color → `255`

#### `${color.b}` - Blue Component

- **Range**: 0 to 255
- **Format**: Whole number integer
- **Use**: Blue channel in RGB color models
- **Example**: Blue color → `255`

### RGB Hexadecimal Values (00-FF)

These provide RGB color values as lowercase hexadecimal strings, useful for hex-based APIs.

#### `${color.rx}` - Red Component (Hex)

- **Range**: 00 to ff (hexadecimal)
- **Format**: Two-digit hex (lowercase)
- **Use**: Hex-based color APIs, hex string builders
- **Example**: Red color → `ff`
- **Example**: Green color → `00`

```json
{
  "colorLight": {
    "deviceType": "ColorLight",
    "color": {
      "method": "GET",
      "url": "http://device.local/color?r=${color.rx}&g=${color.gx}&b=${color.bx}"
    }
  }
}
```

#### `${color.gx}` - Green Component (Hex)

- **Range**: 00 to ff (hexadecimal)
- **Format**: Two-digit hex (lowercase)
- **Example**: Green color → `ff`

#### `${color.bx}` - Blue Component (Hex)

- **Range**: 00 to ff (hexadecimal)
- **Format**: Two-digit hex (lowercase)
- **Example**: Blue color → `ff`

### Full RGB Hex Color

#### `${color.rgbx}` - Complete RGB Hex Color (RRGGBB)

- **Range**: 000000 to ffffff (hexadecimal)
- **Format**: Six-digit hex (lowercase) - RRGGBB format
- **Use**: Web colors, CSS-style colors, hex-based APIs
- **Example**: Red → `ff0000`
- **Example**: Green → `00ff00`
- **Example**: Blue → `0000ff`
- **Example**: Purple → `ff00ff`
- **Example**: White → `ffffff`

```json
{
  "colorLight": {
    "deviceType": "ColorLight",
    "color": {
      "method": "GET",
      "url": "http://device.local/color?hex=${color.rgbx}"
    }
  }
}
```

### HSB Format String

#### `${color.hsb}` - HSB Format String

- **Format**: `h,s,b` (comma-separated)
- **Hue**: 0-360 degrees
- **Saturation**: 0-100 percentage
- **Brightness**: 0-100 percentage
- **Use**: APIs that expect HSB color format
- **Example**: Red at full brightness → `0,100,100`
- **Example**: Green at full brightness → `120,100,100`
- **Example**: Blue at full brightness → `240,100,100`
- **Example**: Dim red → `0,100,50`

```json
{
  "colorLight": {
    "deviceType": "ColorLight",
    "color": {
      "method": "POST",
      "url": "http://device.local/api",
      "params": {
        "color_hsb": "${color.hsb}"
      }
    }
  }
}
```

### Individual HSB Components

#### `${color.h}` - Hue Degrees

- **Range**: 0 to 360
- **Format**: Whole number integer (degrees)
- **Use**: APIs that accept hue in degrees
- **Color Examples**:
  - Red: `0`
  - Yellow: `60`
  - Green: `120`
  - Cyan: `180`
  - Blue: `240`
  - Magenta: `300`

```json
{
  "colorLight": {
    "deviceType": "ColorLight",
    "hue": {
      "method": "GET",
      "url": "http://device.local/hue?value=${color.h}"
    }
  }
}
```

#### `${color.s}` - Saturation Percentage

- **Range**: 0 to 100
- **Format**: Whole number integer (percentage)
- **Use**: APIs that accept saturation as percentage
- **Example**: Fully saturated → `100`
- **Example**: Pastel (50% saturated) → `50`
- **Example**: Gray (no saturation) → `0`

```json
{
  "colorLight": {
    "deviceType": "ColorLight",
    "saturation": {
      "method": "GET",
      "url": "http://device.local/saturation?value=${color.s}"
    }
  }
}
```

#### `${color.b}` - Brightness Percentage

- **Range**: 0 to 100
- **Format**: Whole number integer (percentage)
- **Note**: Also available as `$${brightness}` for convenience
- **Use**: APIs that accept brightness as percentage
- **Example**: Full brightness → `100`
- **Example**: Half brightness → `50`
- **Example**: Off → `0`

```json
{
  "colorLight": {
    "deviceType": "ColorLight",
    "brightness": {
      "method": "GET",
      "url": "http://device.local/brightness?value=${color.b}"
    }
  }
}
```

## Time Replacement

#### `${time.millis}` - Current Time in Milliseconds

- **Format**: Milliseconds since Unix epoch (JavaScript/TypeScript style)
- **Use**: Timestamped color changes, API rate limiting, logging
- **Example**: `1699564234567`

```json
{
  "colorLight": {
    "deviceType": "ColorLight",
    "color": {
      "method": "POST",
      "url": "http://device.local/api",
      "params": {
        "color": "${color.rgbx}",
        "timestamp": "${time.millis}",
        "brightness": "$${brightness}"
      }
    }
  }
}
```

## Brightness Alias

#### `$${brightness}` - Brightness Percentage (Alias)

- **Equivalent to**: `${color.b}` or `${intensity.percent}`
- **Range**: 0 to 100
- **Format**: Whole number integer
- **Use**: Convenience placeholder for brightness
- **Backward Compatibility**: Also works with standard format `${brightness}`

```json
{
  "colorLight": {
    "deviceType": "ColorLight",
    "brightness": {
      "method": "GET",
      "url": "http://device.local/brightness?value=$${brightness}"
    }
  }
}
```

## Complete Examples

### Example 1: RGB Light with Separate Channels

```json
{
  "RGB Light": {
    "deviceType": "ColorLight",
    "on": {
      "method": "GET",
      "url": "http://192.168.1.100/light/on"
    },
    "off": {
      "method": "GET",
      "url": "http://192.168.1.100/light/off"
    },
    "brightness": {
      "method": "GET",
      "url": "http://192.168.1.100/brightness?value=$${brightness}"
    },
    "color": {
      "method": "POST",
      "url": "http://192.168.1.100/color",
      "params": {
        "r": "${color.r}",
        "g": "${color.g}",
        "b": "${color.b}"
      }
    }
  }
}
```

### Example 2: Light with Hex Color API

```json
{
  "Hex Color Light": {
    "deviceType": "ColorLight",
    "on": {
      "method": "GET",
      "url": "http://192.168.1.101/api?cmd=on"
    },
    "off": {
      "method": "GET",
      "url": "http://192.168.1.101/api?cmd=off"
    },
    "color": {
      "method": "GET",
      "url": "http://192.168.1.101/api?cmd=color&value=${color.rgbx}"
    }
  }
}
```

### Example 3: Light with HSB Support

```json
{
  "HSB Light": {
    "deviceType": "ColorLight",
    "on": {
      "method": "POST",
      "url": "http://192.168.1.102/api",
      "params": {
        "action": "on"
      }
    },
    "off": {
      "method": "POST",
      "url": "http://192.168.1.102/api",
      "params": {
        "action": "off"
      }
    },
    "hue": {
      "method": "POST",
      "url": "http://192.168.1.102/api",
      "params": {
        "hsb": "${color.hsb}"
      }
    },
    "saturation": {
      "method": "POST",
      "url": "http://192.168.1.102/api",
      "params": {
        "hsb": "${color.hsb}"
      }
    }
  }
}
```

### Example 4: Advanced Light with Time Tracking

```json
{
  "Advanced Color Light": {
    "deviceType": "ColorLight",
    "color": {
      "method": "POST",
      "url": "http://192.168.1.103/api/color",
      "params": {
        "hex": "${color.rgbx}",
        "hue": "${color.h}",
        "saturation": "${color.s}",
        "brightness": "$${brightness}",
        "timestamp": "${time.millis}"
      }
    }
  }
}
```

## Color Space Conversion Details

The plugin automatically converts between color spaces:

### HSV to RGB Conversion

When setting colors via hue/saturation handlers, the plugin internally converts HSV (Hue-Saturation-Value) color space to RGB (Red-Green-Blue):

1. **Hue**: 0-360 degrees (0=red, 60=yellow, 120=green, 180=cyan, 240=blue, 300=magenta)
2. **Saturation**: 0-100% (0=white/gray, 100=fully saturated)
3. **Value/Brightness**: 0-100% (0=black, 100=full intensity)

The conversion algorithm:

- Calculates C (chroma) from saturation and brightness
- Uses hue sector to determine intermediate color component
- Matches to RGB range based on brightness
- Returns normalized 0-255 RGB values

### Examples of HSV to RGB Conversions

| Hue  | Saturation | Brightness | Red | Green | Blue | Hex    |
| ---- | ---------- | ---------- | --- | ----- | ---- | ------ |
| 0°   | 100%       | 100%       | 255 | 0     | 0    | ff0000 |
| 60°  | 100%       | 100%       | 255 | 255   | 0    | ffff00 |
| 120° | 100%       | 100%       | 0   | 255   | 0    | 00ff00 |
| 180° | 100%       | 100%       | 0   | 255   | 255  | 00ffff |
| 240° | 100%       | 100%       | 0   | 0     | 255  | 0000ff |
| 300° | 100%       | 100%       | 255 | 0     | 255  | ff00ff |
| 0°   | 100%       | 50%        | 128 | 0     | 0    | 800000 |
| 0°   | 50%        | 100%       | 255 | 128   | 128  | ff8080 |

## Combining Intensity and Color Replacements

You can use intensity replacements together with color replacements:

```json
{
  "Advanced Light": {
    "deviceType": "ColorLight",
    "color": {
      "method": "POST",
      "url": "http://device.local/api",
      "params": {
        "color": "${color.rgbx}",
        "brightness_percent": "$${brightness}",
        "brightness_byte": "${intensity.byte}",
        "brightness_decimal": "${intensity.decimal_percent}",
        "timestamp": "${time.millis}"
      }
    }
  }
}
```

## Limitations and Considerations

1. **Default Colors**: If hue or saturation are not set on the device, defaults are used:
   - Hue: 0° (red)
   - Saturation: 100% (fully saturated)

2. **Color Devices Only**: Color replacements only work with devices that support color:
   - Color light endpoints (hue, saturation, color XY)
   - Color temperature lights work with intensity but not full color

3. **Brightness Sync**: Brightness in color replacements comes from the current device level, ensuring consistency with intensity replacements

4. **Performance**: HSV to RGB conversion happens on every color change - minimal performance impact

## See Also

- [Intensity Replacements](HA_BRIDGE_INTENSITY_REFERENCE.md) - For brightness-only devices
- [Implementation Guide](HA_BRIDGE_IMPLEMENTATION.md) - For technical details
