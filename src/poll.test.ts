/**
 * Tests for poll template path extraction
 */

import { describe, it, expect } from '@jest/globals';

// Mock the WebhooksPlatform class extractValueFromPath method
class PathExtractor {
  extractValueFromPath(obj: any, path: string): any {
    if (!path || !obj) return undefined;
    
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      
      // Handle array indexing like "values[0]"
      const arrayMatch = part.match(/^([^[]+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, key, index] = arrayMatch;
        current = current[key];
        if (current === null || current === undefined) return undefined;
        current = current[parseInt(index)];
      } else {
        current = current[part];
      }
    }
    
    return current;
  }
}

describe('Poll Template Path Extraction', () => {
  const extractor = new PathExtractor();

  it('should extract simple field', () => {
    const data = { temperature: 22.5 };
    expect(extractor.extractValueFromPath(data, 'temperature')).toBe(22.5);
  });

  it('should extract nested field', () => {
    const data = {
      sensors: {
        indoor: {
          temperature: 22.5
        }
      }
    };
    expect(extractor.extractValueFromPath(data, 'sensors.indoor.temperature')).toBe(22.5);
  });

  it('should extract from array by index', () => {
    const data = {
      sensors: [
        { type: 'temperature', value: 22.5 },
        { type: 'humidity', value: 65 }
      ]
    };
    expect(extractor.extractValueFromPath(data, 'sensors[0].value')).toBe(22.5);
    expect(extractor.extractValueFromPath(data, 'sensors[1].value')).toBe(65);
  });

  it('should extract deeply nested object', () => {
    const data = {
      result: {
        data: {
          readings: [
            {
              timestamp: '2025-12-12T10:30:00Z',
              values: {
                temperature: 22.5,
                humidity: 65
              }
            }
          ]
        }
      }
    };
    expect(extractor.extractValueFromPath(data, 'result.data.readings[0].values.temperature')).toBe(22.5);
  });

  it('should return undefined for missing path', () => {
    const data = { temperature: 22.5 };
    expect(extractor.extractValueFromPath(data, 'humidity')).toBeUndefined();
  });

  it('should return undefined for missing nested path', () => {
    const data = { sensors: { indoor: {} } };
    expect(extractor.extractValueFromPath(data, 'sensors.outdoor.temperature')).toBeUndefined();
  });

  it('should return undefined for invalid array index', () => {
    const data = { sensors: [{ value: 22.5 }] };
    expect(extractor.extractValueFromPath(data, 'sensors[5].value')).toBeUndefined();
  });

  it('should handle null values in path', () => {
    const data = { sensors: null };
    expect(extractor.extractValueFromPath(data, 'sensors.temperature')).toBeUndefined();
  });

  it('should extract object', () => {
    const data = {
      climate: {
        temperature: 22.5,
        humidity: 65,
        pressure: 1013.25
      }
    };
    const result = extractor.extractValueFromPath(data, 'climate');
    expect(result).toEqual({
      temperature: 22.5,
      humidity: 65,
      pressure: 1013.25
    });
  });

  it('should extract boolean values', () => {
    const data = {
      sensors: {
        motion: true,
        contact: false
      }
    };
    expect(extractor.extractValueFromPath(data, 'sensors.motion')).toBe(true);
    expect(extractor.extractValueFromPath(data, 'sensors.contact')).toBe(false);
  });

  it('should extract string values', () => {
    const data = {
      status: {
        state: 'on'
      }
    };
    expect(extractor.extractValueFromPath(data, 'status.state')).toBe('on');
  });

  it('should handle Home Assistant API response', () => {
    const data = {
      entity_id: 'sensor.living_room_temperature',
      state: '22.5',
      attributes: {
        unit_of_measurement: '°C',
        friendly_name: 'Living Room Temperature'
      }
    };
    expect(extractor.extractValueFromPath(data, 'state')).toBe('22.5');
  });

  it('should handle Shelly status response', () => {
    const data = {
      wifi_sta: { connected: true, ssid: 'MyWiFi', ip: '192.168.1.100' },
      cloud: { enabled: false },
      mqtt: { connected: false },
      time: '10:30',
      serial: 1,
      has_update: false,
      mac: 'AABBCCDDEEFF',
      tmp: { tC: 22.5, tF: 72.5, is_valid: true }
    };
    expect(extractor.extractValueFromPath(data, 'tmp.tC')).toBe(22.5);
  });

  it('should handle Tasmota Status 8 response', () => {
    const data = {
      StatusSNS: {
        Time: '2025-12-12T10:30:00',
        BME280: {
          Temperature: 22.5,
          Humidity: 65.3,
          Pressure: 1013.25
        }
      }
    };
    expect(extractor.extractValueFromPath(data, 'StatusSNS.BME280.Temperature')).toBe(22.5);
    const climate = extractor.extractValueFromPath(data, 'StatusSNS.BME280');
    expect(climate).toEqual({
      Temperature: 22.5,
      Humidity: 65.3,
      Pressure: 1013.25
    });
  });
});
