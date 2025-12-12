# How Brightness Patterns Work (Technical Reference)

## Overview

This document explains the technical details behind brightness patterns. Most users should see [HA_BRIDGE_INTENSITY_REFERENCE.md](HA_BRIDGE_INTENSITY_REFERENCE.md) for how to use them.

## Technical Implementation

### 1. Core Implementation in `src/module.ts`

#### New Class Properties

- `private deviceIntensity = new Map<string, number>()` - Stores current intensity (0-254) for each device to support previous value tracking

#### New Method: `substituteHaBridgeIntensity()`

Complete implementation of ha-bridge intensity replacement patterns:

```typescript
private substituteHaBridgeIntensity(text: string, currentIntensity: number, previousIntensity: number): string
```

| Pattern                                            | Description          | Range     | Example (75%) |
| -------------------------------------------------- | -------------------- | --------- | ------------- |
| `${intensity.percent}`                             | Percentage           | 0-100     | 75            |
| `${intensity.decimal_percent}`                     | Decimal              | 0.00-1.00 | 0.75          |
| `${intensity.byte}`                                | Byte value           | 0-254     | 191           |
| `${intensity.percent.hex}`                         | Hex percentage       | 00-64     | 4b            |
| `${intensity.byte.hex}`                            | Hex byte             | 00-fe     | bf            |
| `${intensity.previous_percent}`                    | Previous percentage  | 0-100     | 50            |
| `${intensity.previous_decimal_percent}`            | Previous decimal     | 0.00-1.00 | 0.50          |
| `${intensity.previous_byte}`                       | Previous byte        | 0-254     | 127           |
| `${intensity.math(floor\|ceil\|round\|abs\|sqrt)}` | Math functions       | Varies    | 8             |
| `${intensity.math(X).hex}`                         | Math with hex output | Varies    | 8             |

#### Updated Method: `executeHttpRequest()`

Enhanced signature to accept optional intensity parameter:

```typescript
private async executeHttpRequest(
  deviceName: string,
  endpoint: HttpEndpoint,
  params: Record<string, string | number | boolean>,
  intensity?: number  // New parameter for ha-bridge replacements
): Promise<void>
```

**New functionality:**

1. Retrieves previous intensity from `deviceIntensity` map
2. Applies intensity replacements to URL
3. Applies intensity replacements to all string parameter values
4. Stores current intensity for next call
5. Works alongside standard `{placeholder}` format

### 2. Handler Updates

All brightness-related command handlers updated to pass intensity:

#### Updated Handlers:

- `addBrightnessHandlers()` - Passes `level` (0-254) as intensity
- `addColorTemperatureHandlers()` - Passes current level as intensity
- `addColorHandlers()` - Passes current level for hue/saturation
- `addColorXYHandlers()` - Passes current level for XY color
- `addCoverHandlers()` - Passes position converted to intensity (0-254)

### 3. Documentation

#### New File: `HA_BRIDGE_INTENSITY_REFERENCE.md`

Comprehensive 500+ line reference guide including:

- Quick reference table with all patterns
- Detailed explanation of each replacement
- 7+ real-world integration examples
- Common conversion formulas
- Best practices
- Troubleshooting guide
- Compatibility information

#### Updated Files:

**`CONFIGURATION_GUIDE.md`**

- Added complete "ha-bridge Intensity Replacements" section
- Included all pattern documentation
- Added 5 practical use case examples
- Explained standard vs ha-bridge format

**`QUICK_REFERENCE.md`**

- Added "ha-bridge Intensity Replacements (Advanced)" section
- 5 ready-to-use configuration examples
- Links to full reference documentation

**`README.md`**

- Updated Features list to mention ha-bridge intensity replacements
- Added ha-bridge Intensity Reference to Quick Start links

## Implementation Details

### Intensity Value Flow

```
User sets brightness to 75%
    ↓
Command handler calculates level (0-254) = 191
    ↓
Pass level as intensity parameter to executeHttpRequest()
    ↓
Get previous intensity from deviceIntensity map (default: 0)
    ↓
Apply substitutions:
  ${intensity.percent} → "75"
  ${intensity.byte} → "191"
  ${intensity.previous_percent} → "0"
  etc.
    ↓
Store current level in deviceIntensity map for next call
    ↓
Send HTTP request with substituted values
```

### Supported Conversions

| Format      | Range     | Calculation             | Example (75%) |
| ----------- | --------- | ----------------------- | ------------- |
| Percent     | 0-100     | Round((level/254)\*100) | 75            |
| Decimal     | 0.00-1.00 | level/254 (2 decimals)  | 0.75          |
| Byte        | 0-254     | Direct value            | 191           |
| Percent Hex | 00-64     | Percent as hex          | 4b            |
| Byte Hex    | 00-fe     | Byte as hex             | bf            |

### Math Functions

All math functions operate on intensity value:

- `floor()` - Rounds down
- `ceil()` - Rounds up
- `round()` - Rounds to nearest
- `abs()` - Absolute value
- `sqrt()` - Square root

All support `.hex` suffix for hexadecimal output.

## Usage Examples

### Example 1: Simple PWM Control

```json
{
  "LED": {
    "deviceType": "DimmableLight",
    "brightness": {
      "method": "GET",
      "url": "http://192.168.1.100/pwm?value=${intensity.byte}"
    }
  }
}
```

### Example 2: Multiple Formats

```json
{
  "Multi": {
    "deviceType": "DimmableLight",
    "brightness": {
      "method": "POST",
      "url": "http://192.168.1.101/brightness",
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

### Example 3: Transition Detection

```json
{
  "Fade": {
    "deviceType": "DimmableLight",
    "brightness": {
      "method": "POST",
      "url": "http://192.168.1.102/fade",
      "params": {
        "from": "${intensity.previous_percent}",
        "to": "${intensity.percent}",
        "duration": 500
      }
    }
  }
}
```

## Backward Compatibility

- ✅ Standard `${brightness}` and `${level}` format still works
- ✅ Can mix both formats in same endpoint
- ✅ No breaking changes to existing configurations
- ✅ Old configurations automatically converted

## Technical Specifications

### Performance

- Regex-based pattern replacement (fast)
- Minimal memory overhead (one Map per platform)
- No additional HTTP requests
- Calculations happen locally

### Error Handling

- Invalid patterns are left unchanged
- Missing intensity values default to 0
- All operations are safe and non-blocking

### Type Safety

- TypeScript interfaces updated
- Proper typing for all parameters
- Optional intensity parameter with defaults

## Testing

### Test Endpoints

Enable testing with:

```json
{
  "test": true,
  "brightness": {
    "method": "GET",
    "url": "http://device.local/brightness?value=${intensity.percent}"
  }
}
```

### Manual Testing

```bash
# Test current intensity (75%)
curl "http://device.local/brightness?value=75"

# Test with hex
curl "http://device.local/brightness?value=bf"

# Test with previous value
curl "http://device.local/fade?from=50&to=75"
```

## Integration Scenarios

### 1. Device with Percentage API

Use: `${intensity.percent}` (0-100)

### 2. PWM Controller

Use: `${intensity.byte}` (0-254)

### 3. ha-bridge Compatible System

Use: Full set of ha-bridge patterns

### 4. Legacy Hex Protocol

Use: `${intensity.byte.hex}` or `${intensity.percent.hex}`

### 5. Transition/Fade Support

Use: Previous values + current values

### 6. Complex Math-based Control

Use: `${intensity.math(sqrt)}`, `${intensity.math(round)}`, etc.

## Compatibility

- ✅ Works with: DimmableLight, ColorLights, Covers, any brightness-related endpoint
- ✅ HTTP Methods: GET, POST, PUT
- ✅ Location: URLs and parameter values
- ✅ Standards: ha-bridge compatible

## References

- **ha-bridge GitHub**: https://github.com/bwssytems/ha-bridge
- **Complete Reference**: `HA_BRIDGE_INTENSITY_REFERENCE.md`
- **Quick Examples**: `QUICK_REFERENCE.md`
- **Configuration Guide**: `CONFIGURATION_GUIDE.md`

## Summary

The ha-bridge intensity replacement implementation provides:

- ✅ Full compatibility with ha-bridge intensity patterns
- ✅ Advanced brightness calculation support
- ✅ Previous value tracking for transitions
- ✅ Math function support for complex scenarios
- ✅ Backward compatibility with existing format
- ✅ Comprehensive documentation with examples
- ✅ Easy integration for users
- ✅ Zero breaking changes
