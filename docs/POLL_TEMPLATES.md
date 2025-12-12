# Sensor Polling with JSON Extraction

This guide shows you how to set up sensors that automatically read values from your device's API responses.

## What Is JSON Extraction?

When your sensor API returns data like `{"temperature": 22.5, "humidity": 65}`, you need to tell the plugin which value to use. JSON extraction lets you specify the path to the value you want using simple dot notation.

## Basic Usage

### Simple Field Extraction

For a JSON response like:

```json
{
  "temperature": 22.5
}
```

Configuration:

```json
{
  "myTemperatureSensor": {
    "deviceType": "TemperatureSensor",
    "pollState": {
      "method": "GET",
      "url": "http://sensor.local/api/status"
    },
    "pollInterval": 60,
    "pollTemplate": "temperature"
  }
}
```

### Nested Object Extraction

For a JSON response like:

```json
{
  "sensors": {
    "indoor": {
      "temperature": 22.5
    }
  }
}
```

Configuration:

```json
{
  "myTemperatureSensor": {
    "deviceType": "TemperatureSensor",
    "pollState": {
      "method": "GET",
      "url": "http://sensor.local/api/status"
    },
    "pollInterval": 60,
    "pollTemplate": "sensors.indoor.temperature"
  }
}
```

### Array Indexing

For a JSON response like:

```json
{
  "sensors": [
    {
      "type": "temperature",
      "value": 22.5
    },
    {
      "type": "humidity",
      "value": 65
    }
  ]
}
```

Configuration:

```json
{
  "myTemperatureSensor": {
    "deviceType": "TemperatureSensor",
    "pollState": {
      "method": "GET",
      "url": "http://sensor.local/api/status"
    },
    "pollInterval": 60,
    "pollTemplate": "sensors[0].value"
  }
}
```

## Device Type Support

The `pollTemplate` works with all sensor types:

### TemperatureSensor

Extracts a number representing temperature in Celsius.

### HumiditySensor

Extracts a number representing relative humidity percentage (0-100).

### PressureSensor

Extracts a number representing pressure in hPa.

### IlluminanceSensor

Extracts a number representing illuminance in lux.

### ContactSensor

Extracts a boolean representing contact state (true = contact, false = no contact).

### MotionSensor

Extracts a boolean representing motion state (true = motion detected, false = no motion).

### ClimateSensor

Can extract either:

- A single number (treated as temperature)
- An object with `temperature`, `humidity`, and/or `pressure` fields

Example for object extraction:

```json
{
  "mySensor": {
    "deviceType": "ClimateSensor",
    "pollState": {
      "method": "GET",
      "url": "http://sensor.local/api/climate"
    },
    "pollInterval": 60,
    "pollTemplate": "data.climate"
  }
}
```

Expected response:

```json
{
  "data": {
    "climate": {
      "temperature": 22.5,
      "humidity": 65,
      "pressure": 1013.25
    }
  }
}
```

## Backward Compatibility

If `pollTemplate` is not specified, the plugin will fall back to the legacy behavior of looking for common field names:

- Temperature: `temperature`
- Humidity: `humidity`
- Pressure: `pressure`
- Illuminance: `illuminance` or `lux`
- Contact: `state` or `contact`
- Motion: `occupied` or `motion`

## Examples

### Home Assistant REST API

```json
{
  "haTemperature": {
    "deviceType": "TemperatureSensor",
    "pollState": {
      "method": "GET",
      "url": "http://homeassistant.local:8123/api/states/sensor.living_room_temperature",
      "params": {
        "Authorization": "Bearer YOUR_TOKEN"
      }
    },
    "pollInterval": 30,
    "pollTemplate": "state"
  }
}
```

### Shelly Device

```json
{
  "shellyTemperature": {
    "deviceType": "TemperatureSensor",
    "pollState": {
      "method": "GET",
      "url": "http://shelly-device.local/status"
    },
    "pollInterval": 60,
    "pollTemplate": "tmp.tC"
  }
}
```

### Tasmota Device

```json
{
  "tasmotaSensor": {
    "deviceType": "TemperatureSensor",
    "pollState": {
      "method": "GET",
      "url": "http://tasmota-device.local/cm?cmnd=Status%208"
    },
    "pollInterval": 60,
    "pollTemplate": "StatusSNS.BME280.Temperature"
  }
}
```

### Custom API with Nested Data

```json
{
  "customSensor": {
    "deviceType": "ClimateSensor",
    "pollState": {
      "method": "GET",
      "url": "http://api.example.com/v1/devices/12345/readings"
    },
    "pollInterval": 120,
    "pollTemplate": "result.latest.climate"
  }
}
```

Expected API response:

```json
{
  "result": {
    "latest": {
      "timestamp": "2025-12-12T10:30:00Z",
      "climate": {
        "temperature": 22.5,
        "humidity": 65,
        "pressure": 1013.25
      }
    }
  }
}
```

## Template Syntax

The template uses dot notation to navigate through the JSON structure:

- Use `.` to access nested objects: `parent.child.grandchild`
- Use `[n]` to access array elements: `array[0]` or `nested.array[5].field`
- Combine both: `sensors[0].readings.temperature`

## Error Handling

If the template path cannot be resolved in the response:

- A warning will be logged
- The sensor attribute will not be updated
- The previous value is retained

## Tips

1. **Test your API first**: Use tools like `curl` or Postman to examine the JSON structure before configuring the template.
2. **Use debug logging**: Enable debug logging to see the extracted values and troubleshoot template paths.
3. **Start simple**: Begin with a simple template and gradually add nesting as needed.
4. **Check array indices**: Remember that arrays are 0-indexed.
