# 📑 Documentation Index

Your complete guide to configuring the Matterbridge Webhooks plugin with 26+ device types, advanced brightness control, color support, and sensor polling.

## 🚀 Quick Start by Task

### I want to configure a...

**Simple Light or Switch**
→ [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Copy a basic example and adapt

**Dimmable Light with Brightness Control**
→ [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - See PWM and percentage examples

**Color Light (RGB, Hue, Temperature)**
→ [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Color control examples with real devices

**Temperature or Humidity Sensor**
→ [POLL_TEMPLATES.md](POLL_TEMPLATES.md) - Polling setup with JSON extraction

**Complex Multi-Step Device**
→ [CONFIGURATION_GUIDE.md](CONFIGURATION_GUIDE.md) - Multiple commands per endpoint

**Window Blinds, Lock, or Thermostat**
→ [DEVICE_TYPES.md](DEVICE_TYPES.md) - Device-specific configuration options

---

## 📚 Core Configuration Guides

### Getting Started

- **[README.md](README.md)** - Feature overview and quick links

### Configuration Reference

- **[CONFIGURATION_GUIDE.md](CONFIGURATION_GUIDE.md)** - Complete setup guide with examples for all features
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - 10+ copy-paste ready configurations
- **[DEVICE_TYPES.md](DEVICE_TYPES.md)** - All 26 device types with clusters and endpoints

### Advanced Features

- **[HA_BRIDGE_INTENSITY_REFERENCE.md](HA_BRIDGE_INTENSITY_REFERENCE.md)** - 13 brightness patterns (percentages, bytes, hex, transitions, math)
- **[HA_BRIDGE_COLOR_REFERENCE.md](HA_BRIDGE_COLOR_REFERENCE.md)** - 11 color patterns (RGB, hex, HSB)
- **[POLL_TEMPLATES.md](POLL_TEMPLATES.md)** - JSON path extraction for sensor APIs
- **[MULTI_COMMAND_FEATURE.md](MULTI_COMMAND_FEATURE.md)** - Sequential command execution

### Reference Guides

All the guides above contain complete reference information - no separate implementation guide needed.

- **[HA_BRIDGE_IMPLEMENTATION.md](HA_BRIDGE_IMPLEMENTATION.md)** - Technical architecture (for developers)
- **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)** - What changed from previous versions

---

## � Configuration by Feature

### Basic Device Control

These guides cover on/off, brightness, and color:

| Feature                | Guide                                                                                                           | Best For               |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------- |
| **On/Off Switches**    | [QUICK_REFERENCE.md](QUICK_REFERENCE.md)                                                                        | Simple relay devices   |
| **Brightness Control** | [QUICK_REFERENCE.md](QUICK_REFERENCE.md) + [HA_BRIDGE_INTENSITY_REFERENCE.md](HA_BRIDGE_INTENSITY_REFERENCE.md) | Dimmable lights, PWM   |
| **Color Control**      | [QUICK_REFERENCE.md](QUICK_REFERENCE.md) + [HA_BRIDGE_COLOR_REFERENCE.md](HA_BRIDGE_COLOR_REFERENCE.md)         | RGB/RGBW lights        |
| **Color Temperature**  | [QUICK_REFERENCE.md](QUICK_REFERENCE.md)                                                                        | Warm/cool white lights |

### Sensor Configuration

| Sensor Type        | Setup Guide                            | Use Case               |
| ------------------ | -------------------------------------- | ---------------------- |
| **Temperature**    | [POLL_TEMPLATES.md](POLL_TEMPLATES.md) | Weather, environmental |
| **Humidity**       | [POLL_TEMPLATES.md](POLL_TEMPLATES.md) | Moisture monitoring    |
| **Motion/Contact** | [POLL_TEMPLATES.md](POLL_TEMPLATES.md) | Security sensors       |
| **Illuminance**    | [POLL_TEMPLATES.md](POLL_TEMPLATES.md) | Light level sensing    |
| **Multi-Sensor**   | [POLL_TEMPLATES.md](POLL_TEMPLATES.md) | Climate sensors        |

### Advanced Device Control

| Device Type            | Configuration                                        | Examples                |
| ---------------------- | ---------------------------------------------------- | ----------------------- |
| **Window Blinds**      | [DEVICE_TYPES.md](DEVICE_TYPES.md)                   | Position & tilt control |
| **Door Locks**         | [DEVICE_TYPES.md](DEVICE_TYPES.md)                   | Lock/unlock endpoints   |
| **Thermostats**        | [DEVICE_TYPES.md](DEVICE_TYPES.md)                   | Heating & cooling       |
| **Mode Switches**      | [DEVICE_TYPES.md](DEVICE_TYPES.md)                   | Multi-option devices    |
| **Multi-Step Actions** | [MULTI_COMMAND_FEATURE.md](MULTI_COMMAND_FEATURE.md) | Sequential commands     |

---

## 🔍 Finding What You Need

### By Device

Looking for a specific device type?
→ See [DEVICE_TYPES.md](DEVICE_TYPES.md) for complete list with all options

### By API Integration

Working with a specific service or device?
→ Check [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for Shelly, Home Assistant, Tasmota, Node-RED examples

### By Brightness Format

Need to convert between formats?
→ See [HA_BRIDGE_INTENSITY_REFERENCE.md](HA_BRIDGE_INTENSITY_REFERENCE.md) - conversion formulas and examples

### By Color Space

Working with RGB, HSB, or XY colors?
→ See [HA_BRIDGE_COLOR_REFERENCE.md](HA_BRIDGE_COLOR_REFERENCE.md) - all color formats explained

### By Sensor API

Polling a REST API for sensor data?
→ See [POLL_TEMPLATES.md](POLL_TEMPLATES.md) - JSON path extraction examples

---

## ✅ What's Included

✅ 26+ device types (lights, sensors, covers, locks, thermostats)  
✅ 13 brightness patterns + 11 color patterns  
✅ Sensor polling with JSON path extraction  
✅ Sequential multi-command execution  
✅ 20+ ready-to-use examples  
✅ Full backward compatibility  
✅ Zero breaking changes  
✅ Production ready

---

## 🆘 Common Tasks & Solutions

### "My brightness values aren't in the right range"

→ Check [HA_BRIDGE_INTENSITY_REFERENCE.md](HA_BRIDGE_INTENSITY_REFERENCE.md#common-conversion-formulas) for conversion formulas

### "My color RGB values look wrong"

→ See [HA_BRIDGE_COLOR_REFERENCE.md](HA_BRIDGE_COLOR_REFERENCE.md) - RGB/HSV conversion section

### "My sensor isn't updating values"

→ Review [POLL_TEMPLATES.md](POLL_TEMPLATES.md) - JSON path extraction section

### "I need to execute multiple commands for one action"

→ Check [MULTI_COMMAND_FEATURE.md](MULTI_COMMAND_FEATURE.md) for examples

### "I'm not sure which endpoint to use"

→ Find your device type in [DEVICE_TYPES.md](DEVICE_TYPES.md)

### "My existing configuration stopped working"

→ See [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) for backward compatibility info

---

## 📊 Quick Feature Overview

**Device Types**: Outlets, switches, lights, color lights, sensors (7 types), covers, locks, thermostats, mode select, mounted switches

**Brightness Control**: Percentages, byte values, hex, decimal, transitions, math operations

**Color Support**: RGB (integer & hex), HSB, color temperature, XY color space

**Sensors**: Temperature, humidity, pressure, illuminance, motion, contact, combined climate

**Advanced**: Multiple commands per endpoint, JSON path extraction, full ha-bridge pattern support
