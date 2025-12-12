# ha-bridge Intensity Replacement Reference

This guide provides a complete reference for using ha-bridge intensity replacement patterns with the Matterbridge HTTP plugin.

## Overview

The plugin now supports the complete set of **ha-bridge intensity replacements**, enabling advanced brightness handling for devices with complex requirements. These replacements work in both URLs and parameter values for all brightness-related endpoints.

## Quick Reference Table

| Replacement | Range | Example Value (75% brightness) | Use Case |
|---|---|---|---|
| `$${brightness}` ⭐ | 0-100 | `75` | Brightness alias (convenience) |
| `${intensity.percent}` | 0-100 | `75` | Percentage-based APIs |
| `${intensity.decimal_percent}` | 0.00-1.00 | `0.75` | Normalized brightness |
| `${intensity.byte}` | 0-254 | `191` | PWM/8-bit control |
| `${intensity.percent.hex}` | 00-64 | `4b` | Hex percentage |
| `${intensity.byte.hex}` | 00-fe | `bf` | Hex brightness |
| `${intensity.previous_percent}` | 0-100 | `50` | Transition tracking |
| `${intensity.previous_decimal_percent}` | 0.00-1.00 | `0.50` | Previous state |
| `${intensity.previous_byte}` | 0-254 | `127` | Previous byte |
| `${intensity.math(floor)}` | varies | `75` | Floor calculation |
| `${intensity.math(ceil)}` | varies | `75` | Ceiling calculation |
| `${intensity.math(round)}` | varies | `75` | Rounding |
| `${intensity.math(abs)}` | varies | `75` | Absolute value |
| `${intensity.math(sqrt)}` | varies | `8.66` | Square root |

All math functions support `.hex` suffix (e.g., `${intensity.math(floor).hex}`)

⭐ **NEW**: `$${brightness}` is a convenient alias for `${intensity.percent}` - use it for cleaner, shorter config

## Placeholder Format

The Matterbridge HTTP plugin supports multiple placeholder formats:

- **Standard format** (backward compatible): `${brightness}` 
- **ha-bridge format** (new): `${intensity.*}`, `$${brightness}`, `${color.*}`, `${time.millis}`

Both formats can be used together in the same configuration:

```json
{
  "Light": {
    "brightness": {
      "method": "GET",
      "url": "http://device.local/brightness?old_format=${brightness}&new_format=$${brightness}&byte=${intensity.byte}"
    }
  }
}
```

## Detailed Replacements

### Current Intensity Values

These represent the current brightness level being set:

#### `$${brightness}` - Brightness Percentage Alias ⭐
- **Range**: 0 to 100
- **Format**: Whole number integer
- **Equivalent to**: `${intensity.percent}`
- **Use**: Convenience placeholder, shorter and clearer than `${intensity.percent}`
- **Example**: 75% brightness → `75`

```json
{
  "Light": {
    "brightness": {
      "method": "GET",
      "url": "http://device.local/brightness?value=$${brightness}"
    }
  }
}
```

#### `${intensity.percent}` - Percentage (0-100)
- **Range**: 0 to 100
- **Format**: Whole number integer
- **Use**: Most device APIs expect percentages
- **Example**: 75% brightness → `75`

```json
{
  "brightness": {
    "method": "GET",
    "url": "http://device.local/brightness?value=${intensity.percent}"
  }
}
```

#### `${intensity.decimal_percent}` - Decimal Percentage (0.00-1.00)
- **Range**: 0.00 to 1.00
- **Format**: Two decimal places
- **Use**: Normalized APIs (MQTT, some REST endpoints)
- **Example**: 75% brightness → `0.75`

```json
{
  "brightness": {
    "method": "POST",
    "url": "http://device.local/api",
    "params": {
      "brightness": "${intensity.decimal_percent}"
    }
  }
}
```

#### `${intensity.byte}` - Byte Value (0-254)
- **Range**: 0 to 254 (Matter standard)
- **Format**: Whole number integer
- **Use**: PWM drivers, digital controllers
- **Example**: 75% brightness → `191`

```json
{
  "brightness": {
    "method": "GET",
    "url": "http://esp32.local/pwm?level=${intensity.byte}"
  }
}
```

#### `${intensity.percent.hex}` - Hex Percentage (00-64)
- **Range**: 00 to 64 in hexadecimal
- **Format**: Two-digit hex (lowercase)
- **Use**: Hex-based APIs
- **Example**: 75% brightness → `4b` (hex)

```json
{
  "brightness": {
    "method": "GET",
    "url": "http://device.local/cmd?brightness_hex=${intensity.percent.hex}"
  }
}
```

#### `${intensity.byte.hex}` - Hex Byte (00-FE)
- **Range**: 00 to fe in hexadecimal
- **Format**: Two-digit hex (lowercase)
- **Use**: Hex-based PWM or byte commands
- **Example**: 75% brightness → `bf` (hex)

```json
{
  "brightness": {
    "method": "GET",
    "url": "http://driver.local/set?pwm=${intensity.byte.hex}"
  }
}
```

### Previous Intensity Values

These represent the brightness level from the previous command. Useful for:
- Creating smooth transitions
- Detecting state changes
- Comparing old vs new brightness

#### `${intensity.previous_percent}` - Previous Percentage (0-100)
- **Range**: 0 to 100
- **Example**: If previous was 50%, → `50`

```json
{
  "brightness": {
    "method": "POST",
    "url": "http://device.local/transition",
    "params": {
      "from": "${intensity.previous_percent}",
      "to": "${intensity.percent}"
    }
  }
}
```

#### `${intensity.previous_decimal_percent}` - Previous Decimal (0.00-1.00)
- **Range**: 0.00 to 1.00
- **Example**: If previous was 50%, → `0.50`

#### `${intensity.previous_byte}` - Previous Byte (0-254)
- **Range**: 0 to 254
- **Example**: If previous was 50%, → `127`

### Math Functions

Apply mathematical operations to the current intensity:

#### `${intensity.math(floor)}` - Floor Function
- **Operation**: Rounds down to nearest integer
- **Example**: 75.9% → `75`

```json
{
  "brightness": {
    "method": "GET",
    "url": "http://device.local/brightness?value=${intensity.math(floor)}"
  }
}
```

#### `${intensity.math(ceil)}` - Ceiling Function
- **Operation**: Rounds up to nearest integer
- **Example**: 75.1% → `76`

#### `${intensity.math(round)}` - Round Function
- **Operation**: Rounds to nearest integer
- **Example**: 75.4% → `75`, 75.6% → `76`

#### `${intensity.math(abs)}` - Absolute Value
- **Operation**: Always positive value
- **Example**: 75% → `75` (always positive)

#### `${intensity.math(sqrt)}` - Square Root
- **Operation**: Square root of the value
- **Example**: 75% → `8.66`

#### Math Functions with Hex
All math functions support `.hex` suffix:

```json
{
  "brightness": {
    "method": "GET",
    "url": "http://device.local/cmd?val=${intensity.math(sqrt).hex}"
  }
}
```

## Integration Examples

### Example 1: Simple Percentage API

**Device**: Light controller expecting percentage (0-100)

```json
{
  "Living Room": {
    "deviceType": "DimmableLight",
    "brightness": {
      "method": "GET",
      "url": "http://192.168.1.100/light?brightness=${intensity.percent}"
    }
  }
}
```

**When brightness is set to 75%:**
- Request: `http://192.168.1.100/light?brightness=75`

### Example 2: PWM Control

**Device**: ESP32 with PWM support (0-254)

```json
{
  "LED Strip": {
    "deviceType": "DimmableLight",
    "brightness": {
      "method": "PUT",
      "url": "http://192.168.1.150/pwm",
      "params": {
        "pin": "D5",
        "value": "${intensity.byte}"
      }
    }
  }
}
```

**When brightness is set to 75%:**
- Request body: `{"pin": "D5", "value": 191}`

### Example 3: Multiple Formats

**Device**: API accepting multiple brightness formats

```json
{
  "Multi Format": {
    "deviceType": "DimmableLight",
    "brightness": {
      "method": "POST",
      "url": "http://192.168.1.200/brightness",
      "params": {
        "percent": "${intensity.percent}",
        "decimal": "${intensity.decimal_percent}",
        "byte": "${intensity.byte}",
        "hex": "${intensity.byte.hex}"
      }
    }
  }
}
```

**When brightness is set to 75%:**
```json
{
  "percent": "75",
  "decimal": "0.75",
  "byte": "191",
  "hex": "bf"
}
```

### Example 4: Transition Detection

**Device**: Supports smooth transitions

```json
{
  "Smart Light": {
    "deviceType": "DimmableLight",
    "brightness": {
      "method": "POST",
      "url": "http://192.168.1.180/fade",
      "params": {
        "from": "${intensity.previous_percent}",
        "to": "${intensity.percent}",
        "duration": 500
      }
    }
  }
}
```

**First time (from 0% to 75%):**
- `{"from": "0", "to": "75", "duration": 500}`

**Second time (from 75% to 50%):**
- `{"from": "75", "to": "50", "duration": 500}`

### Example 5: Logarithmic Dimming

**Device**: Supports non-linear brightness scaling

```json
{
  "Logarithmic": {
    "deviceType": "DimmableLight",
    "brightness": {
      "method": "GET",
      "url": "http://192.168.1.170/log?brightness=${intensity.math(sqrt)}"
    }
  }
}
```

**When brightness is set to 75%:**
- Request: `http://192.168.1.170/log?brightness=8.66`

### Example 6: Hex-based Protocol

**Device**: Legacy system using hex protocol

```json
{
  "Legacy": {
    "deviceType": "DimmableLight",
    "brightness": {
      "method": "GET",
      "url": "http://192.168.1.160/cmd?brightness_hex=${intensity.byte.hex}"
    }
  }
}
```

**When brightness is set to 75%:**
- Request: `http://192.168.1.160/cmd?brightness_hex=bf`

### Example 7: Complex Calculation

**Device**: Requires multiple parameters with different formats

```json
{
  "Complex": {
    "deviceType": "DimmableLight",
    "brightness": {
      "method": "POST",
      "url": "http://192.168.1.190/api",
      "params": {
        "brightness_percent": "${intensity.percent}",
        "brightness_255": "${intensity.byte}",
        "brightness_hex": "${intensity.byte.hex}",
        "previous": "${intensity.previous_percent}",
        "change_percent": "${intensity.math(abs)}"
      }
    }
  }
}
```

## Common Conversion Formulas

If you need to convert between formats:

| From | To | Formula | Example |
|---|---|---|---|
| Percent | Decimal | percent / 100 | 75 → 0.75 |
| Percent | Byte | (percent / 100) * 254 | 75 → 191 |
| Byte | Percent | (byte / 254) * 100 | 191 → 75 |
| Percent | Hex | percent.toString(16) | 75 → 4b |
| Byte | Hex | byte.toString(16) | 191 → bf |

## Best Practices

### 1. Choose the Right Format
- Use **percent** for human-readable APIs
- Use **byte** for PWM or digital control
- Use **decimal** for normalized/MQTT APIs
- Use **hex** for legacy or binary protocols

### 2. Test Before Deploying
```json
{
  "test": true,
  "brightness": {
    "method": "GET",
    "url": "http://device.local/brightness?value=${intensity.percent}"
  }
}
```

### 3. Handle Edge Cases
- Test with brightness 0% (minimum)
- Test with brightness 100% (maximum)
- Test with brightness 50% (middle range)

### 4. Use Previous Values for Transitions
When brightness is expected to transition smoothly:
```json
{
  "params": {
    "from": "${intensity.previous_percent}",
    "to": "${intensity.percent}",
    "duration": 500
  }
}
```

### 5. Combine Multiple Formats
If an API accepts multiple formats, send the most appropriate one:
```json
{
  "params": {
    "brightness": "${intensity.percent}",
    "brightness_raw": "${intensity.byte}"
  }
}
```

## Troubleshooting

### Intensity replacements not working
- Ensure you're using `${...}` (ha-bridge format), not `{...}` (standard format)
- Check that the endpoint supports brightness control
- Verify the device type is `DimmableLight` or similar

### Wrong values being sent
- Check which format your device expects
- Compare with manual API tests
- Use percent for most cases (0-100)
- Use byte for PWM (0-254)

### Math functions producing unexpected results
- Math functions are applied to the intensity value
- Floor/ceil/round may produce the same result for whole numbers
- Sqrt of 75 ≈ 8.66 (correct, not an error)

### Previous value always zero
- On first command, previous value is 0 (not set yet)
- Use previous values for transitions between commands
- Check device logs for actual values sent

## Compatibility

- **ha-bridge compatible**: Uses standard ha-bridge intensity syntax
- **Works with**: All HTTP methods (GET, POST, PUT)
- **Works in**: URLs and parameter values
- **Device Types**: All brightness-related endpoints

## Examples by Device Type

### DimmableLight
- Supports: percent, byte, decimal
- Primary use: `${intensity.percent}` or `${intensity.byte}`

### ExtendedColorLight / ColorLightHS / ColorLightXY
- Supports: percent, byte, decimal (for brightness)
- Also uses: `${hue}`, `${saturation}`, `${colorX}`, `${colorY}` (standard format)

### CoverLift / CoverLiftTilt
- Supports: percent, byte (for position/tilt)
- Primary use: `${intensity.percent}` for 0-100% position

## References

- [ha-bridge Documentation](https://github.com/bwssytems/ha-bridge)
- [Matter Specification](https://csa-iot.org/csa_iot_wp-content/uploads/2022/01/Matter-Core-Specification-v1.0-TIP.pdf)
- [Matterbridge Documentation](https://github.com/Luligu/matterbridge)
