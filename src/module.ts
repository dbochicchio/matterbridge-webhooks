/**
 * This file contains the class WebhooksPlatform.
 *
 * @file module.ts
 * @author Luca Liguori
 * @version 1.0.0
 * @license Apache-2.0
 *
 * Copyright 2025, 2026, 2027 Luca Liguori.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  bridgedNode,
  MatterbridgeDynamicPlatform,
  MatterbridgeEndpoint,
  onOffLight,
  onOffOutlet,
  onOffSwitch,
  dimmableLight,
  extendedColorLight,
  colorTemperatureLight,
  contactSensor,
  occupancySensor,
  lightSensor,
  temperatureSensor,
  humiditySensor,
  pressureSensor,
  coverDevice,
  doorLockDevice,
  thermostatDevice,
  modeSelect,
  onOffMountedSwitch,
  dimmableMountedSwitch,
  powerSource,
  PlatformConfig,
  PlatformMatterbridge,
} from 'matterbridge';
import { isValidObject } from 'matterbridge/utils';
import { AnsiLogger } from 'matterbridge/logger';

import { fetch } from './fetch.js';

// Matter cluster enum constants
// WindowCovering.MovementStatus values
const WindowCoveringMovementStatus = {
  Stopped: 0,
  Opening: 1,
  Closing: 2,
} as const;

// DoorLock.LockState values
const DoorLockState = {
  NotFullyLocked: 0,
  Locked: 1,
  Unlocked: 2,
} as const;

export interface HttpCommand {
  method: 'POST' | 'GET' | 'PUT';
  url: string;
  params?: Record<string, string | number | boolean>;
}

export type HttpEndpoint = HttpCommand | HttpCommand[];

export interface WebhookConfig {
  deviceType: // Switches and Outlets
  | 'Outlet'
    | 'Switch'
    | 'Scene'
    // Lights
    | 'Light'
    | 'DimmableLight'
    | 'ColorTemperatureLight'
    | 'ExtendedColorLight'
    | 'ColorLightHS'
    | 'ColorLightXY'
    // Sensors
    | 'ContactSensor'
    | 'MotionSensor'
    | 'IlluminanceSensor'
    | 'TemperatureSensor'
    | 'HumiditySensor'
    | 'PressureSensor'
    | 'ClimateSensor'
    // Covers
    | 'CoverLift'
    | 'CoverLiftTilt'
    // Lock
    | 'DoorLock'
    // Thermostats
    | 'ThermostatAuto'
    | 'ThermostatHeat'
    | 'ThermostatCool'
    // Mode Select
    | 'ModeSelect'
    // Mounted Switches
    | 'OnOffMountedSwitch'
    | 'DimmerMountedSwitch';

  // Action endpoints
  on?: HttpEndpoint;
  off?: HttpEndpoint;
  brightness?: HttpEndpoint; // For dimmable lights (0-100)
  colorTemperature?: HttpEndpoint; // For CT lights (mireds)
  colorHue?: HttpEndpoint; // For color lights (0-360)
  colorSaturation?: HttpEndpoint; // For color lights (0-100)
  colorXY?: HttpEndpoint; // For color lights (x: 0-1, y: 0-1)

  // Cover endpoints
  coverPosition?: HttpEndpoint; // For covers (0-100)
  coverTilt?: HttpEndpoint; // For covers with tilt (0-100)

  // Lock endpoints
  lock?: HttpEndpoint;
  unlock?: HttpEndpoint;

  // Thermostat endpoints
  setHeatingPoint?: HttpEndpoint; // For thermostats (temperature)
  setCoolingPoint?: HttpEndpoint; // For thermostats (temperature)
  setMode?: HttpEndpoint; // For thermostats (mode)

  // Mode Select endpoints
  setModeValue?: HttpEndpoint; // For mode select (mode value)

  // Sensor polling
  pollState?: HttpEndpoint; // For sensors - polls current state
  pollInterval?: number; // Poll interval in seconds (default: 60)
  pollTemplate?: string; // Template for extracting value from JSON response (e.g., 'sensors.temperature' or 'data.value')

  // HTTP timeout configuration
  timeout?: number; // Request timeout in milliseconds (default: 5000)

  // Mode select configuration
  modes?: Array<{ label: string; mode: number }>; // For mode select devices

  test?: boolean;

  // Deprecated fields for backward compatibility
  method?: 'POST' | 'GET' | 'PUT';
  httpUrl?: string;
}

export type WebhooksPlatformConfig = PlatformConfig & {
  whiteList: string[];
  blackList: string[];
  deviceType?: 'Outlet' | 'Switch' | 'Light'; // Deprecated - now per-device
  timeout?: number; // Default request timeout in milliseconds (default: 5000)
  webhooks: Record<string, WebhookConfig>;
};

/**
 * This is the standard interface for Matterbridge plugins.
 * Each plugin should export a default function that follows this signature.
 *
 * @param {PlatformMatterbridge} matterbridge - An instance of MatterBridge. This is the main interface for interacting with the MatterBridge system.
 * @param {AnsiLogger} log - An instance of AnsiLogger. This is used for logging messages in a format that can be displayed with ANSI color codes.
 * @param {PlatformConfig} config - The platform configuration.
 * @returns {Platform} - An instance of the SomfyTahomaPlatform. This is the main interface for interacting with the Somfy Tahoma system.
 */
export default function initializePlugin(matterbridge: PlatformMatterbridge, log: AnsiLogger, config: WebhooksPlatformConfig): WebhooksPlatform {
  return new WebhooksPlatform(matterbridge, log, config);
}

export class WebhooksPlatform extends MatterbridgeDynamicPlatform {
  private webhooks: Record<string, WebhookConfig>;
  private defaultTimeout: number; // Default request timeout in milliseconds
  readonly bridgedDevices = new Map<string, MatterbridgeEndpoint>();
  private deviceLevel = new Map<string, number>(); // Store current level (0-254) for ha-bridge replacements

  constructor(matterbridge: PlatformMatterbridge, log: AnsiLogger, config: WebhooksPlatformConfig) {
    super(matterbridge, log, config);

    // Verify that Matterbridge is the correct version
    if (this.verifyMatterbridgeVersion === undefined || typeof this.verifyMatterbridgeVersion !== 'function' || !this.verifyMatterbridgeVersion('3.3.0')) {
      throw new Error(`This plugin requires Matterbridge version >= "3.3.0". Please update Matterbridge to the latest version in the frontend.`);
    }

    this.log.info('Initializing platform:', this.config.name);

    this.webhooks = config.webhooks;
    this.defaultTimeout = config.timeout ?? 5000; // Default to 5 seconds

    this.log.info('Finished initializing platform:', this.config.name);
  }

  override async onStart(reason?: string): Promise<void> {
    this.log.info('onStart called with reason:', reason ?? 'none');

    // Clear all devices select
    await this.ready;
    await this.clearSelect();

    // Register devices
    let i = 0;
    for (const webhookName in this.webhooks) {
      const webhook = this.webhooks[webhookName];

      // Handle backward compatibility for old config format
      if (webhook.httpUrl && webhook.method && !webhook.on && !webhook.deviceType) {
        webhook.deviceType = (this.config.deviceType || 'Outlet') as WebhookConfig['deviceType'];
        webhook.on = { method: webhook.method, url: webhook.httpUrl };
      }

      this.log.debug(`Loading webhook ${++i} ${webhookName} type: ${webhook.deviceType}`);

      this.setSelectDevice('webhook' + i, webhookName, undefined, 'hub');
      if (!this.validateDevice(['webhook' + i, webhookName], true)) continue;

      this.log.info(`Registering device: ${webhookName} as ${webhook.deviceType}`);

      // Determine device type and create appropriate device
      const deviceId = 'webhook' + i;
      let device: MatterbridgeEndpoint;

      switch (webhook.deviceType) {
        // Switches and Outlets
        case 'Outlet':
          device = this.createOutletDevice(webhookName, deviceId, webhook);
          break;
        case 'Switch':
          device = this.createSwitchDevice(webhookName, deviceId, webhook);
          break;
        case 'Scene':
          device = this.createSceneDevice(webhookName, deviceId, webhook);
          break;

        // Lights
        case 'Light':
          device = this.createLightDevice(webhookName, deviceId, webhook);
          break;
        case 'DimmableLight':
          device = this.createDimmableLightDevice(webhookName, deviceId, webhook);
          break;
        case 'ColorTemperatureLight':
          device = this.createColorTemperatureLightDevice(webhookName, deviceId, webhook);
          break;
        case 'ExtendedColorLight':
          device = this.createExtendedColorLightDevice(webhookName, deviceId, webhook);
          break;
        case 'ColorLightHS':
          device = this.createColorLightHSDevice(webhookName, deviceId, webhook);
          break;
        case 'ColorLightXY':
          device = this.createColorLightXYDevice(webhookName, deviceId, webhook);
          break;

        // Sensors
        case 'ContactSensor':
          device = this.createContactSensorDevice(webhookName, deviceId, webhook);
          break;
        case 'MotionSensor':
          device = this.createMotionSensorDevice(webhookName, deviceId, webhook);
          break;
        case 'IlluminanceSensor':
          device = this.createIlluminanceSensorDevice(webhookName, deviceId, webhook);
          break;
        case 'TemperatureSensor':
          device = this.createTemperatureSensorDevice(webhookName, deviceId, webhook);
          break;
        case 'HumiditySensor':
          device = this.createHumiditySensorDevice(webhookName, deviceId, webhook);
          break;
        case 'PressureSensor':
          device = this.createPressureSensorDevice(webhookName, deviceId, webhook);
          break;
        case 'ClimateSensor':
          device = this.createClimateSensorDevice(webhookName, deviceId, webhook);
          break;

        // Covers
        case 'CoverLift':
          device = this.createCoverLiftDevice(webhookName, deviceId, webhook);
          break;
        case 'CoverLiftTilt':
          device = this.createCoverLiftTiltDevice(webhookName, deviceId, webhook);
          break;

        // Lock
        case 'DoorLock':
          device = this.createDoorLockDevice(webhookName, deviceId, webhook);
          break;

        // Thermostats
        case 'ThermostatAuto':
          device = this.createThermostatAutoDevice(webhookName, deviceId, webhook);
          break;
        case 'ThermostatHeat':
          device = this.createThermostatHeatDevice(webhookName, deviceId, webhook);
          break;
        case 'ThermostatCool':
          device = this.createThermostatCoolDevice(webhookName, deviceId, webhook);
          break;

        // Mode Select
        case 'ModeSelect':
          device = this.createModeSelectDevice(webhookName, deviceId, webhook);
          break;

        // Mounted Switches
        case 'OnOffMountedSwitch':
          device = this.createOnOffMountedSwitchDevice(webhookName, deviceId, webhook);
          break;
        case 'DimmerMountedSwitch':
          device = this.createDimmerMountedSwitchDevice(webhookName, deviceId, webhook);
          break;

        default:
          this.log.error(`Unknown device type: ${webhook.deviceType}`);
          continue;
      }

      await this.registerDevice(device);
      this.bridgedDevices.set(webhookName, device);

      // Start polling for sensors
      if (webhook.pollState) {
        this.startSensorPolling(webhookName, device, webhook);
      }
    }
  }

  // ========== DEVICE CREATION METHODS ==========

  // Helper method for common device setup
  private createBaseDevice(name: string, id: string, deviceTypes: any[], webhook: WebhookConfig): MatterbridgeEndpoint {
    return new MatterbridgeEndpoint(deviceTypes as any, { id: name }, this.config.debug as boolean).createDefaultBridgedDeviceBasicInformationClusterServer(
      name,
      id,
      this.matterbridge.aggregatorVendorId,
      'Matterbridge',
      `Matterbridge ${webhook.deviceType}`,
      0,
      this.config.version as string,
    );
  }

  // ===== SWITCHES AND OUTLETS =====

  private createOutletDevice(name: string, id: string, webhook: WebhookConfig): MatterbridgeEndpoint {
    const device = this.createBaseDevice(name, id, [onOffOutlet, bridgedNode, powerSource], webhook)
      .createDefaultIdentifyClusterServer()
      .createDefaultGroupsClusterServer()
      .createDefaultOnOffClusterServer(false)
      .createDefaultPowerSourceWiredClusterServer();

    this.addOnOffHandlers(device, name, webhook);
    return device;
  }

  private createSwitchDevice(name: string, id: string, webhook: WebhookConfig): MatterbridgeEndpoint {
    const device = this.createBaseDevice(name, id, [onOffSwitch, bridgedNode, powerSource], webhook)
      .createDefaultIdentifyClusterServer()
      .createDefaultGroupsClusterServer()
      .createDefaultOnOffClusterServer(false)
      .createDefaultPowerSourceWiredClusterServer();

    this.addOnOffHandlers(device, name, webhook);
    return device;
  }

  private createSceneDevice(name: string, id: string, webhook: WebhookConfig): MatterbridgeEndpoint {
    const device = this.createBaseDevice(name, id, [onOffSwitch, bridgedNode, powerSource], webhook)
      .createDefaultIdentifyClusterServer()
      .createDefaultGroupsClusterServer()
      .createDefaultOnOffClusterServer(false)
      .createDefaultPowerSourceWiredClusterServer();

    this.addSceneHandlers(device, name, webhook);
    return device;
  }

  // ===== LIGHTS =====

  private createLightDevice(name: string, id: string, webhook: WebhookConfig): MatterbridgeEndpoint {
    const device = this.createBaseDevice(name, id, [onOffLight, bridgedNode, powerSource], webhook)
      .createDefaultIdentifyClusterServer()
      .createDefaultGroupsClusterServer()
      .createDefaultOnOffClusterServer(false)
      .createDefaultPowerSourceWiredClusterServer();

    this.addOnOffHandlers(device, name, webhook);
    return device;
  }

  private createDimmableLightDevice(name: string, id: string, webhook: WebhookConfig): MatterbridgeEndpoint {
    const device = this.createBaseDevice(name, id, [dimmableLight, bridgedNode, powerSource], webhook)
      .createDefaultIdentifyClusterServer()
      .createDefaultGroupsClusterServer()
      .createDefaultOnOffClusterServer(false)
      .createDefaultLevelControlClusterServer(0)
      .createDefaultPowerSourceWiredClusterServer();

    this.addOnOffHandlers(device, name, webhook);
    this.addBrightnessHandlers(device, name, webhook);
    return device;
  }

  private createColorTemperatureLightDevice(name: string, id: string, webhook: WebhookConfig): MatterbridgeEndpoint {
    const device = this.createBaseDevice(name, id, [colorTemperatureLight, bridgedNode, powerSource], webhook)
      .createDefaultIdentifyClusterServer()
      .createDefaultGroupsClusterServer()
      .createDefaultOnOffClusterServer(false)
      .createDefaultLevelControlClusterServer(0)
      .createDefaultColorControlClusterServer()
      .createDefaultPowerSourceWiredClusterServer();

    this.addOnOffHandlers(device, name, webhook);
    this.addBrightnessHandlers(device, name, webhook);
    this.addColorTemperatureHandlers(device, name, webhook);
    return device;
  }

  private createExtendedColorLightDevice(name: string, id: string, webhook: WebhookConfig): MatterbridgeEndpoint {
    const device = this.createBaseDevice(name, id, [extendedColorLight, bridgedNode, powerSource], webhook)
      .createDefaultIdentifyClusterServer()
      .createDefaultGroupsClusterServer()
      .createDefaultOnOffClusterServer(false)
      .createDefaultLevelControlClusterServer(0)
      .createDefaultColorControlClusterServer()
      .createDefaultPowerSourceWiredClusterServer();

    this.addOnOffHandlers(device, name, webhook);
    this.addBrightnessHandlers(device, name, webhook);
    this.addColorHandlers(device, name, webhook);
    this.addColorTemperatureHandlers(device, name, webhook);
    return device;
  }

  private createColorLightHSDevice(name: string, id: string, webhook: WebhookConfig): MatterbridgeEndpoint {
    // Extended color light with HS control (no XY)
    const device = this.createBaseDevice(name, id, [extendedColorLight, bridgedNode, powerSource], webhook)
      .createDefaultIdentifyClusterServer()
      .createDefaultGroupsClusterServer()
      .createDefaultOnOffClusterServer(false)
      .createDefaultLevelControlClusterServer(0)
      .createDefaultColorControlClusterServer()
      .createDefaultPowerSourceWiredClusterServer();

    this.addOnOffHandlers(device, name, webhook);
    this.addBrightnessHandlers(device, name, webhook);
    this.addColorHandlers(device, name, webhook);
    this.addColorTemperatureHandlers(device, name, webhook);
    return device;
  }

  private createColorLightXYDevice(name: string, id: string, webhook: WebhookConfig): MatterbridgeEndpoint {
    // Extended color light with XY control
    const device = this.createBaseDevice(name, id, [extendedColorLight, bridgedNode, powerSource], webhook)
      .createDefaultIdentifyClusterServer()
      .createDefaultGroupsClusterServer()
      .createDefaultOnOffClusterServer(false)
      .createDefaultLevelControlClusterServer(0)
      .createDefaultColorControlClusterServer()
      .createDefaultPowerSourceWiredClusterServer();

    this.addOnOffHandlers(device, name, webhook);
    this.addBrightnessHandlers(device, name, webhook);
    this.addColorXYHandlers(device, name, webhook);
    this.addColorTemperatureHandlers(device, name, webhook);
    return device;
  }

  // ===== SENSORS =====

  private createContactSensorDevice(name: string, id: string, webhook: WebhookConfig): MatterbridgeEndpoint {
    const device = this.createBaseDevice(name, id, [contactSensor, bridgedNode, powerSource], webhook)
      .createDefaultIdentifyClusterServer()
      .createDefaultBooleanStateClusterServer(false)
      .createDefaultPowerSourceReplaceableBatteryClusterServer()
      .addRequiredClusterServers();

    return device;
  }

  private createMotionSensorDevice(name: string, id: string, webhook: WebhookConfig): MatterbridgeEndpoint {
    const device = this.createBaseDevice(name, id, [occupancySensor, bridgedNode, powerSource], webhook)
      .createDefaultIdentifyClusterServer()
      .createDefaultOccupancySensingClusterServer()
      .createDefaultPowerSourceReplaceableBatteryClusterServer()
      .addRequiredClusterServers();

    return device;
  }

  private createIlluminanceSensorDevice(name: string, id: string, webhook: WebhookConfig): MatterbridgeEndpoint {
    const device = this.createBaseDevice(name, id, [lightSensor, bridgedNode, powerSource], webhook)
      .createDefaultIdentifyClusterServer()
      .createDefaultIlluminanceMeasurementClusterServer(0)
      .createDefaultPowerSourceReplaceableBatteryClusterServer()
      .addRequiredClusterServers();

    return device;
  }

  private createTemperatureSensorDevice(name: string, id: string, webhook: WebhookConfig): MatterbridgeEndpoint {
    const device = this.createBaseDevice(name, id, [temperatureSensor, bridgedNode, powerSource], webhook)
      .createDefaultIdentifyClusterServer()
      .createDefaultTemperatureMeasurementClusterServer(2000)
      .createDefaultPowerSourceReplaceableBatteryClusterServer()
      .addRequiredClusterServers();

    return device;
  }

  private createHumiditySensorDevice(name: string, id: string, webhook: WebhookConfig): MatterbridgeEndpoint {
    const device = this.createBaseDevice(name, id, [humiditySensor, bridgedNode, powerSource], webhook)
      .createDefaultIdentifyClusterServer()
      .createDefaultRelativeHumidityMeasurementClusterServer(5000)
      .createDefaultPowerSourceReplaceableBatteryClusterServer()
      .addRequiredClusterServers();

    return device;
  }

  private createPressureSensorDevice(name: string, id: string, webhook: WebhookConfig): MatterbridgeEndpoint {
    const device = this.createBaseDevice(name, id, [pressureSensor, bridgedNode, powerSource], webhook)
      .createDefaultIdentifyClusterServer()
      .createDefaultPressureMeasurementClusterServer(1000)
      .createDefaultPowerSourceReplaceableBatteryClusterServer()
      .addRequiredClusterServers();

    return device;
  }

  private createClimateSensorDevice(name: string, id: string, webhook: WebhookConfig): MatterbridgeEndpoint {
    const device = this.createBaseDevice(name, id, [temperatureSensor, humiditySensor, pressureSensor, bridgedNode, powerSource], webhook)
      .createDefaultIdentifyClusterServer()
      .createDefaultTemperatureMeasurementClusterServer(2000)
      .createDefaultRelativeHumidityMeasurementClusterServer(5000)
      .createDefaultPressureMeasurementClusterServer(1000)
      .createDefaultPowerSourceReplaceableBatteryClusterServer()
      .addRequiredClusterServers();

    return device;
  }

  // ===== COVERS =====

  private createCoverLiftDevice(name: string, id: string, webhook: WebhookConfig): MatterbridgeEndpoint {
    const device = this.createBaseDevice(name, id, [coverDevice, bridgedNode, powerSource], webhook)
      .createDefaultIdentifyClusterServer()
      .createDefaultGroupsClusterServer()
      .createDefaultWindowCoveringClusterServer()
      .createDefaultPowerSourceWiredClusterServer();

    this.addCoverHandlers(device, name, webhook, false);
    return device;
  }

  private createCoverLiftTiltDevice(name: string, id: string, webhook: WebhookConfig): MatterbridgeEndpoint {
    const device = this.createBaseDevice(name, id, [coverDevice, bridgedNode, powerSource], webhook)
      .createDefaultIdentifyClusterServer()
      .createDefaultGroupsClusterServer()
      .createDefaultLiftTiltWindowCoveringClusterServer()
      .createDefaultPowerSourceWiredClusterServer();

    this.addCoverHandlers(device, name, webhook, true);
    return device;
  }

  // ===== LOCK =====

  private createDoorLockDevice(name: string, id: string, webhook: WebhookConfig): MatterbridgeEndpoint {
    const device = this.createBaseDevice(name, id, [doorLockDevice, bridgedNode, powerSource], webhook)
      .createDefaultIdentifyClusterServer()
      .createDefaultDoorLockClusterServer()
      .createDefaultPowerSourceRechargeableBatteryClusterServer();

    this.addLockHandlers(device, name, webhook);
    return device;
  }

  // ===== THERMOSTATS =====

  private createThermostatAutoDevice(name: string, id: string, webhook: WebhookConfig): MatterbridgeEndpoint {
    const device = this.createBaseDevice(name, id, [thermostatDevice, bridgedNode, powerSource], webhook)
      .createDefaultIdentifyClusterServer()
      .createDefaultGroupsClusterServer()
      .createDefaultThermostatClusterServer(20, 18, 22)
      .createDefaultPowerSourceWiredClusterServer();

    this.addThermostatHandlers(device, name, webhook);
    return device;
  }

  private createThermostatHeatDevice(name: string, id: string, webhook: WebhookConfig): MatterbridgeEndpoint {
    const device = this.createBaseDevice(name, id, [thermostatDevice, bridgedNode, powerSource], webhook)
      .createDefaultIdentifyClusterServer()
      .createDefaultGroupsClusterServer()
      .createDefaultHeatingThermostatClusterServer(20, 18, 5, 35)
      .createDefaultPowerSourceWiredClusterServer();

    this.addThermostatHandlers(device, name, webhook);
    return device;
  }

  private createThermostatCoolDevice(name: string, id: string, webhook: WebhookConfig): MatterbridgeEndpoint {
    const device = this.createBaseDevice(name, id, [thermostatDevice, bridgedNode, powerSource], webhook)
      .createDefaultIdentifyClusterServer()
      .createDefaultGroupsClusterServer()
      .createDefaultCoolingThermostatClusterServer(20, 18, 5, 35)
      .createDefaultPowerSourceWiredClusterServer();

    this.addThermostatHandlers(device, name, webhook);
    return device;
  }

  // ===== MODE SELECT =====

  private createModeSelectDevice(name: string, id: string, webhook: WebhookConfig): MatterbridgeEndpoint {
    const modes = webhook.modes || [
      { label: 'Mode 1', mode: 1 },
      { label: 'Mode 2', mode: 2 },
    ];

    const modeOptions = modes.map((m) => ({ label: m.label, mode: m.mode, semanticTags: [] }));

    const device = this.createBaseDevice(name, id, [modeSelect, bridgedNode, powerSource], webhook)
      .createDefaultModeSelectClusterServer('Mode', modeOptions, 1, 1)
      .createDefaultPowerSourceWiredClusterServer()
      .addRequiredClusterServers();

    this.addModeSelectHandlers(device, name, webhook);
    return device;
  }

  // ===== MOUNTED SWITCHES =====

  private createOnOffMountedSwitchDevice(name: string, id: string, webhook: WebhookConfig): MatterbridgeEndpoint {
    const device = this.createBaseDevice(name, id, [onOffMountedSwitch, bridgedNode, powerSource], webhook)
      .createDefaultIdentifyClusterServer()
      .createDefaultGroupsClusterServer()
      .createDefaultOnOffClusterServer()
      .createDefaultPowerSourceWiredClusterServer()
      .addRequiredClusterServers();

    this.addOnOffHandlers(device, name, webhook);
    return device;
  }

  private createDimmerMountedSwitchDevice(name: string, id: string, webhook: WebhookConfig): MatterbridgeEndpoint {
    const device = this.createBaseDevice(name, id, [dimmableMountedSwitch, bridgedNode, powerSource], webhook)
      .createDefaultIdentifyClusterServer()
      .createDefaultGroupsClusterServer()
      .createDefaultOnOffClusterServer()
      .createDefaultLevelControlClusterServer()
      .createDefaultPowerSourceWiredClusterServer()
      .addRequiredClusterServers();

    this.addOnOffHandlers(device, name, webhook);
    this.addBrightnessHandlers(device, name, webhook);
    return device;
  }

  // ========== COMMAND HANDLER METHODS ==========

  private addOnOffHandlers(device: MatterbridgeEndpoint, name: string, webhook: WebhookConfig): void {
    device.addCommandHandler('on', async () => {
      if (webhook.on) {
        this.log.info(`${name}: Executing ON command`);
        const params = this.getFirstCommand(webhook.on).params || {};
        await this.executeHttpRequest(name, webhook.on, params);
        await device.setAttribute('onOff', 'onOff', true, device.log);
      } else {
        this.log.warn(`${name}: No ON endpoint configured`);
      }
    });

    device.addCommandHandler('off', async () => {
      if (webhook.off) {
        this.log.info(`${name}: Executing OFF command`);
        const params = this.getFirstCommand(webhook.off).params || {};
        await this.executeHttpRequest(name, webhook.off, params);
        await device.setAttribute('onOff', 'onOff', false, device.log);
      } else {
        this.log.warn(`${name}: No OFF endpoint configured`);
        await device.setAttribute('onOff', 'onOff', false, device.log);
      }
    });
  }

  private addSceneHandlers(device: MatterbridgeEndpoint, name: string, webhook: WebhookConfig): void {
    device.addCommandHandler('on', async () => {
      if (webhook.on) {
        this.log.info(`${name}: Triggering scene`);
        const params = this.getFirstCommand(webhook.on).params || {};
        await this.executeHttpRequest(name, webhook.on, params);
        await device.setAttribute('onOff', 'onOff', true, device.log);

        // Auto turn off after 1 second
        setTimeout(async () => {
          await device.setAttribute('onOff', 'onOff', false, device.log);
        }, 1000);
      } else {
        this.log.warn(`${name}: No ON endpoint configured for scene`);
      }
    });
  }

  private addBrightnessHandlers(device: MatterbridgeEndpoint, name: string, webhook: WebhookConfig): void {
    if (!webhook.brightness) return;

    device.addCommandHandler('moveToLevel', async ({ request }: any) => {
      const level = request.level;
      const brightness = Math.round((level / 254) * 100);
      this.log.info(`${name}: Setting brightness to ${brightness}%`);

      const params = { ...this.getFirstCommand(webhook.brightness!).params, brightness, level };
      await this.executeHttpRequest(name, webhook.brightness!, params, level);
      await device.setAttribute('levelControl', 'currentLevel', level, device.log);
    });
  }

  private addColorTemperatureHandlers(device: MatterbridgeEndpoint, name: string, webhook: WebhookConfig): void {
    if (!webhook.colorTemperature) return;

    device.addCommandHandler('moveToColorTemperature', async ({ request }: any) => {
      const mireds = request.colorTemperatureMireds;
      const level = device.getAttribute('levelControl', 'currentLevel') || 254;
      const hue = device.getAttribute('colorControl', 'currentHue') ? Math.round((device.getAttribute('colorControl', 'currentHue') / 254) * 360) : 0;
      const saturation = device.getAttribute('colorControl', 'currentSaturation') ? Math.round((device.getAttribute('colorControl', 'currentSaturation') / 254) * 100) : 0;
      this.log.info(`${name}: Setting color temperature to ${mireds} mireds`);

      const params = { ...this.getFirstCommand(webhook.colorTemperature!).params, colorTemperatureMireds: mireds };
      await this.executeHttpRequest(name, webhook.colorTemperature!, params, level, hue, saturation, Math.round((level / 254) * 100));
      await device.setAttribute('colorControl', 'colorTemperatureMireds', mireds, device.log);
    });
  }

  private addColorHandlers(device: MatterbridgeEndpoint, name: string, webhook: WebhookConfig): void {
    if (webhook.colorHue) {
      device.addCommandHandler('moveToHue', async ({ request }: any) => {
        const hue = Math.round((request.hue / 254) * 360);
        const level = device.getAttribute('levelControl', 'currentLevel') || 254;
        const saturation = device.getAttribute('colorControl', 'currentSaturation') ? Math.round((device.getAttribute('colorControl', 'currentSaturation') / 254) * 100) : 100;
        this.log.info(`${name}: Setting hue to ${hue}°`);

        const params = { ...this.getFirstCommand(webhook.colorHue!).params, hue };
        await this.executeHttpRequest(name, webhook.colorHue!, params, level, hue, saturation, Math.round((level / 254) * 100));
        await device.setAttribute('colorControl', 'currentHue', request.hue, device.log);
      });
    }

    if (webhook.colorSaturation) {
      device.addCommandHandler('moveToSaturation', async ({ request }: any) => {
        const saturation = Math.round((request.saturation / 254) * 100);
        const hue = device.getAttribute('colorControl', 'currentHue') ? Math.round((device.getAttribute('colorControl', 'currentHue') / 254) * 360) : 0;
        const level = device.getAttribute('levelControl', 'currentLevel') || 254;
        this.log.info(`${name}: Setting saturation to ${saturation}%`);

        const params = { ...this.getFirstCommand(webhook.colorSaturation!).params, saturation };
        await this.executeHttpRequest(name, webhook.colorSaturation!, params, level, hue, saturation, Math.round((level / 254) * 100));
        await device.setAttribute('colorControl', 'currentSaturation', request.saturation, device.log);
      });
    }
  }

  private addColorXYHandlers(device: MatterbridgeEndpoint, name: string, webhook: WebhookConfig): void {
    if (!webhook.colorXY) return;

    device.addCommandHandler('moveToColor', async ({ request }: any) => {
      const x = request.colorX / 65536;
      const y = request.colorY / 65536;
      const level = device.getAttribute('levelControl', 'currentLevel') || 254;
      const hue = device.getAttribute('colorControl', 'currentHue') ? Math.round((device.getAttribute('colorControl', 'currentHue') / 254) * 360) : 0;
      const saturation = device.getAttribute('colorControl', 'currentSaturation') ? Math.round((device.getAttribute('colorControl', 'currentSaturation') / 254) * 100) : 0;
      this.log.info(`${name}: Setting color XY to (${x.toFixed(3)}, ${y.toFixed(3)})`);

      const params = { ...this.getFirstCommand(webhook.colorXY!).params, colorX: x, colorY: y };
      await this.executeHttpRequest(name, webhook.colorXY!, params, level, hue, saturation, Math.round((level / 254) * 100));
      await device.setAttribute('colorControl', 'currentX', request.colorX, device.log);
      await device.setAttribute('colorControl', 'currentY', request.colorY, device.log);
    });
  }

  private addCoverHandlers(device: MatterbridgeEndpoint, name: string, webhook: WebhookConfig, hasTilt: boolean): void {
    device.addCommandHandler('upOrOpen', async () => {
      if (webhook.coverPosition) {
        this.log.info(`${name}: Opening cover`);
        const params = { ...this.getFirstCommand(webhook.coverPosition).params, position: 0 };
        await this.executeHttpRequest(name, webhook.coverPosition, params, 0);
      }
      await device.setWindowCoveringCurrentTargetStatus(0, 0, WindowCoveringMovementStatus.Stopped);
    });

    device.addCommandHandler('downOrClose', async () => {
      if (webhook.coverPosition) {
        this.log.info(`${name}: Closing cover`);
        const params = { ...this.getFirstCommand(webhook.coverPosition).params, position: 100 };
        await this.executeHttpRequest(name, webhook.coverPosition, params, 254);
      }
      await device.setWindowCoveringCurrentTargetStatus(10000, 10000, WindowCoveringMovementStatus.Stopped);
    });

    device.addCommandHandler('stopMotion', async () => {
      this.log.info(`${name}: Stopping cover`);
      await device.setWindowCoveringTargetAsCurrentAndStopped();
    });

    if (webhook.coverPosition) {
      device.addCommandHandler('goToLiftPercentage', async ({ request }: any) => {
        const percent100ths = request.liftPercent100thsValue;
        const percent = Math.round(percent100ths / 100);
        const level = Math.round((percent / 100) * 254);
        this.log.info(`${name}: Moving to position ${percent}%`);

        const params = { ...this.getFirstCommand(webhook.coverPosition!).params, position: percent };
        await this.executeHttpRequest(name, webhook.coverPosition!, params, level);
        await device.setWindowCoveringCurrentTargetStatus(percent100ths, percent100ths, WindowCoveringMovementStatus.Stopped);
      });
    }

    if (hasTilt && webhook.coverTilt) {
      device.addCommandHandler('goToTiltPercentage', async ({ request }: any) => {
        const percent100ths = request.tiltPercent100thsValue;
        const percent = Math.round(percent100ths / 100);
        const level = Math.round((percent / 100) * 254);
        this.log.info(`${name}: Tilting to ${percent}%`);

        const params = { ...this.getFirstCommand(webhook.coverTilt!).params, tilt: percent };
        await this.executeHttpRequest(name, webhook.coverTilt!, params, level);
        const position = device.getAttribute('windowCovering', 'currentPositionLiftPercent100ths', device.log);
        await device.setWindowCoveringTargetAndCurrentPosition(position, percent100ths);
      });
    }
  }

  private addLockHandlers(device: MatterbridgeEndpoint, name: string, webhook: WebhookConfig): void {
    device.addCommandHandler('lockDoor', async () => {
      if (webhook.lock) {
        this.log.info(`${name}: Locking`);
        const params = this.getFirstCommand(webhook.lock).params || {};
        await this.executeHttpRequest(name, webhook.lock, params);
      }
      await device.setAttribute('doorLock', 'lockState', DoorLockState.Locked, device.log);
    });

    device.addCommandHandler('unlockDoor', async () => {
      if (webhook.unlock) {
        this.log.info(`${name}: Unlocking`);
        const params = this.getFirstCommand(webhook.unlock).params || {};
        await this.executeHttpRequest(name, webhook.unlock, params);
      }
      await device.setAttribute('doorLock', 'lockState', DoorLockState.Unlocked, device.log);
    });
  }

  private addThermostatHandlers(device: MatterbridgeEndpoint, name: string, webhook: WebhookConfig): void {
    if (webhook.setHeatingPoint) {
      device.addCommandHandler('setpointRaiseLower', async ({ request }: any) => {
        const current = device.getAttribute('thermostat', 'occupiedHeatingSetpoint', device.log);
        const newSetpoint = current + request.amount * 10;
        this.log.info(`${name}: Setting heating setpoint to ${newSetpoint / 100}°C`);

        const params = { ...this.getFirstCommand(webhook.setHeatingPoint!).params, temperature: newSetpoint / 100 };
        await this.executeHttpRequest(name, webhook.setHeatingPoint!, params);
        await device.setAttribute('thermostat', 'occupiedHeatingSetpoint', newSetpoint, device.log);
      });
    }

    if (webhook.setCoolingPoint) {
      device.addCommandHandler('setpointRaiseLower', async ({ request }: any) => {
        const current = device.getAttribute('thermostat', 'occupiedCoolingSetpoint', device.log);
        const newSetpoint = current + request.amount * 10;
        this.log.info(`${name}: Setting cooling setpoint to ${newSetpoint / 100}°C`);

        const params = { ...this.getFirstCommand(webhook.setCoolingPoint!).params, temperature: newSetpoint / 100 };
        await this.executeHttpRequest(name, webhook.setCoolingPoint!, params);
        await device.setAttribute('thermostat', 'occupiedCoolingSetpoint', newSetpoint, device.log);
      });
    }

    if (webhook.setMode) {
      device.addCommandHandler('setpointRaiseLower', async ({ request }: any) => {
        const mode = request.mode;
        this.log.info(`${name}: Setting mode to ${mode}`);

        const params = { ...this.getFirstCommand(webhook.setMode!).params, mode };
        await this.executeHttpRequest(name, webhook.setMode!, params);
        await device.setAttribute('thermostat', 'systemMode', mode, device.log);
      });
    }
  }

  private addModeSelectHandlers(device: MatterbridgeEndpoint, name: string, webhook: WebhookConfig): void {
    if (!webhook.setModeValue) return;

    device.addCommandHandler('changeToMode', async ({ request }: any) => {
      const newMode = request.newMode;
      this.log.info(`${name}: Changing to mode ${newMode}`);

      const params = { ...this.getFirstCommand(webhook.setModeValue!).params, mode: newMode };
      await this.executeHttpRequest(name, webhook.setModeValue!, params);
    });
  }

  // ========== SENSOR POLLING ==========

  private startSensorPolling(name: string, device: MatterbridgeEndpoint, webhook: WebhookConfig): void {
    const interval = (webhook.pollInterval || 60) * 1000;

    setInterval(async () => {
      try {
        const command = this.getFirstCommand(webhook.pollState!);
        const response = await fetch<any>(command.url, command.method, command.params || {});
        this.updateSensorState(name, device, webhook, response);
      } catch (err) {
        this.log.error(`${name}: Failed to poll sensor state: ${err instanceof Error ? err.message : err}`);
      }
    }, interval);
  }

  /**
   * Extract a value from a nested object using dot notation path
   * Similar to MQTT Controller's 'source' feature
   * @param obj - The object to extract from
   * @param path - Dot-separated path (e.g., 'sensors.temperature' or 'data.values[0].temp')
   * @returns The extracted value or undefined
   */
  private extractValueFromPath(obj: any, path: string): any {
    if (!path || !obj) return undefined;
    
    // Split by dots but handle array indexing
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

  private updateSensorState(name: string, device: MatterbridgeEndpoint, webhook: WebhookConfig, data: any): void {
    // If a poll template is provided, use it to extract the value
    if (webhook.pollTemplate) {
      const extractedValue = this.extractValueFromPath(data, webhook.pollTemplate);
      
      if (extractedValue !== undefined) {
        this.log.debug(`${name}: Extracted value from template '${webhook.pollTemplate}': ${JSON.stringify(extractedValue)}`);
        
        // Update the appropriate attribute based on device type
        switch (webhook.deviceType) {
          case 'ContactSensor':
            if (typeof extractedValue === 'boolean') {
              device.setAttribute('booleanState', 'stateValue', extractedValue, device.log);
            }
            break;
          case 'MotionSensor':
            if (typeof extractedValue === 'boolean') {
              device.setAttribute('occupancySensing', 'occupancy', { occupied: extractedValue }, device.log);
            }
            break;
          case 'IlluminanceSensor':
            if (typeof extractedValue === 'number') {
              device.setAttribute('illuminanceMeasurement', 'measuredValue', Math.round(10000 * Math.log10(extractedValue)), device.log);
            }
            break;
          case 'TemperatureSensor':
            if (typeof extractedValue === 'number') {
              device.setAttribute('temperatureMeasurement', 'measuredValue', Math.round(extractedValue * 100), device.log);
            }
            break;
          case 'HumiditySensor':
            if (typeof extractedValue === 'number') {
              device.setAttribute('relativeHumidityMeasurement', 'measuredValue', Math.round(extractedValue * 100), device.log);
            }
            break;
          case 'PressureSensor':
            if (typeof extractedValue === 'number') {
              device.setAttribute('pressureMeasurement', 'measuredValue', Math.round(extractedValue * 10), device.log);
            }
            break;
          case 'ClimateSensor':
            // For climate sensors, the template might return an object with multiple values
            if (typeof extractedValue === 'object' && extractedValue !== null) {
              if (typeof extractedValue.temperature === 'number') {
                device.setAttribute('temperatureMeasurement', 'measuredValue', Math.round(extractedValue.temperature * 100), device.log);
              }
              if (typeof extractedValue.humidity === 'number') {
                device.setAttribute('relativeHumidityMeasurement', 'measuredValue', Math.round(extractedValue.humidity * 100), device.log);
              }
              if (typeof extractedValue.pressure === 'number') {
                device.setAttribute('pressureMeasurement', 'measuredValue', Math.round(extractedValue.pressure * 10), device.log);
              }
            } else if (typeof extractedValue === 'number') {
              // If it's a single number, assume it's temperature
              device.setAttribute('temperatureMeasurement', 'measuredValue', Math.round(extractedValue * 100), device.log);
            }
            break;
        }
      } else {
        this.log.warn(`${name}: Poll template '${webhook.pollTemplate}' did not extract a value from response`);
      }
      return;
    }
    
    // Fallback to legacy behavior - try common field names
    switch (webhook.deviceType) {
      case 'ContactSensor':
        if (typeof data.state === 'boolean' || typeof data.contact === 'boolean') {
          const state = data.state ?? data.contact;
          device.setAttribute('booleanState', 'stateValue', state, device.log);
        }
        break;
      case 'MotionSensor':
        if (typeof data.occupied === 'boolean' || typeof data.motion === 'boolean') {
          const occupied = data.occupied ?? data.motion;
          device.setAttribute('occupancySensing', 'occupancy', { occupied }, device.log);
        }
        break;
      case 'IlluminanceSensor':
        if (typeof data.illuminance === 'number' || typeof data.lux === 'number') {
          const lux = data.illuminance ?? data.lux;
          device.setAttribute('illuminanceMeasurement', 'measuredValue', Math.round(10000 * Math.log10(lux)), device.log);
        }
        break;
      case 'TemperatureSensor':
        if (typeof data.temperature === 'number') {
          device.setAttribute('temperatureMeasurement', 'measuredValue', Math.round(data.temperature * 100), device.log);
        }
        break;
      case 'HumiditySensor':
        if (typeof data.humidity === 'number') {
          device.setAttribute('relativeHumidityMeasurement', 'measuredValue', Math.round(data.humidity * 100), device.log);
        }
        break;
      case 'PressureSensor':
        if (typeof data.pressure === 'number') {
          device.setAttribute('pressureMeasurement', 'measuredValue', Math.round(data.pressure * 10), device.log);
        }
        break;
      case 'ClimateSensor':
        if (typeof data.temperature === 'number') {
          device.setAttribute('temperatureMeasurement', 'measuredValue', Math.round(data.temperature * 100), device.log);
        }
        if (typeof data.humidity === 'number') {
          device.setAttribute('relativeHumidityMeasurement', 'measuredValue', Math.round(data.humidity * 100), device.log);
        }
        if (typeof data.pressure === 'number') {
          device.setAttribute('pressureMeasurement', 'measuredValue', Math.round(data.pressure * 10), device.log);
        }
        break;
    }
  }

  private substituteHaBridgeLevel(text: string, currentLevel: number, previousLevel: number): string {
    // ha-bridge level replacement patterns (for dimmers, lights, covers)
    // Supports both ${level.*} and ${intensity.*} for backward compatibility
    // ${level.percent} or ${intensity.percent} - whole number percentage (0-100)
    // ${level.decimal_percent} or ${intensity.decimal_percent} - decimal percentage (0-1)
    // ${level.byte} or ${intensity.byte} - byte value (0-254)
    // ${level.percent.hex} or ${intensity.percent.hex} - hex percentage
    // ${level.byte.hex} or ${intensity.byte.hex} - hex byte
    // ${level.previous_percent} or ${intensity.previous_percent} - previous percentage
    // ${level.previous_decimal_percent} or ${intensity.previous_decimal_percent} - previous decimal percentage
    // ${level.previous_byte} or ${intensity.previous_byte} - previous byte
    // ${level.math(X)} or ${intensity.math(X)} - math functions (X = floor, ceil, round, abs, sqrt)
    // ${level.math(X).hex} or ${intensity.math(X).hex} - hex value of math result

    let result = text;
    const percent = Math.round((currentLevel / 254) * 100);
    const decimalPercent = (currentLevel / 254).toFixed(2);
    const byte = currentLevel;
    const percentHex = percent.toString(16).padStart(2, '0');
    const byteHex = byte.toString(16).padStart(2, '0');
    const prevPercent = Math.round((previousLevel / 254) * 100);
    const prevDecimalPercent = (previousLevel / 254).toFixed(2);
    const prevByte = previousLevel;

    // Current level replacements - support both ${level.*} and ${intensity.*}
    result = result.replace(/\$\{(level|intensity)\.percent\}/g, String(percent));
    result = result.replace(/\$\{brightness\}/g, String(percent)); // Alias for ${level.percent}
    result = result.replace(/\$\{(level|intensity)\.decimal_percent\}/g, String(decimalPercent));
    result = result.replace(/\$\{(level|intensity)\.byte\}/g, String(byte));
    result = result.replace(/\$\{(level|intensity)\.percent\.hex\}/g, percentHex);
    result = result.replace(/\$\{(level|intensity)\.byte\.hex\}/g, byteHex);

    // Previous level replacements - support both ${level.*} and ${intensity.*}
    result = result.replace(/\$\{(level|intensity)\.previous_percent\}/g, String(prevPercent));
    result = result.replace(/\$\{(level|intensity)\.previous_decimal_percent\}/g, String(prevDecimalPercent));
    result = result.replace(/\$\{(level|intensity)\.previous_byte\}/g, String(prevByte));

    // Math function replacements: ${(level|intensity).math(floor|ceil|round|abs|sqrt)}
    // ${level.math(floor)} or ${intensity.math(floor)}
    const floorValue = Math.floor(currentLevel);
    result = result.replace(/\$\{(level|intensity)\.math\(floor\)\}/g, String(floorValue));
    result = result.replace(/\$\{(level|intensity)\.math\(floor\)\.hex\}/g, floorValue.toString(16).padStart(2, '0'));

    // ${level.math(ceil)} or ${intensity.math(ceil)}
    const ceilValue = Math.ceil(currentLevel);
    result = result.replace(/\$\{(level|intensity)\.math\(ceil\)\}/g, String(ceilValue));
    result = result.replace(/\$\{(level|intensity)\.math\(ceil\)\.hex\}/g, ceilValue.toString(16).padStart(2, '0'));

    // ${level.math(round)} or ${intensity.math(round)}
    const roundValue = Math.round(currentLevel);
    result = result.replace(/\$\{(level|intensity)\.math\(round\)\}/g, String(roundValue));
    result = result.replace(/\$\{(level|intensity)\.math\(round\)\.hex\}/g, roundValue.toString(16).padStart(2, '0'));

    // ${level.math(abs)} or ${intensity.math(abs)}
    const absValue = Math.abs(currentLevel);
    result = result.replace(/\$\{(level|intensity)\.math\(abs\)\}/g, String(absValue));
    result = result.replace(/\$\{(level|intensity)\.math\(abs\)\.hex\}/g, absValue.toString(16).padStart(2, '0'));

    // ${level.math(sqrt)} or ${intensity.math(sqrt)}
    const sqrtValue = Math.sqrt(currentLevel);
    result = result.replace(/\$\{(level|intensity)\.math\(sqrt\)\}/g, String(sqrtValue));
    result = result.replace(/\$\{(level|intensity)\.math\(sqrt\)\.hex\}/g, Math.round(sqrtValue).toString(16).padStart(2, '0'));

    return result;
  }

  private substituteHaBridgeColor(text: string, hue: number, saturation: number, brightness: number): string {
    // ha-bridge color replacement patterns
    // ${color.r} - Red value (0-255)
    // ${color.g} - Green value (0-255)
    // ${color.b} - Blue value (0-255)
    // ${color.rx} - Red hex (00-ff)
    // ${color.gx} - Green hex (00-ff)
    // ${color.bx} - Blue hex (00-ff)
    // ${color.rgbx} - RGB hex (000000-ffffff)
    // ${color.hsb} - HSB format "hue,saturation,brightness"
    // ${color.h} - Hue decimal
    // ${color.s} - Saturation decimal
    // ${time.millis} - Current time in milliseconds

    let result = text;

    // Convert HSV to RGB
    const hsb = { h: hue, s: saturation / 100, v: brightness / 100 };
    let r = 0,
      g = 0,
      b = 0;

    const c = hsb.v * hsb.s;
    const hh = (hue / 60) % 6;
    const x = c * (1 - Math.abs((hh % 2) - 1));
    const m = hsb.v - c;

    if (hh < 1) {
      r = c;
      g = x;
      b = 0;
    } else if (hh < 2) {
      r = x;
      g = c;
      b = 0;
    } else if (hh < 3) {
      r = 0;
      g = c;
      b = x;
    } else if (hh < 4) {
      r = 0;
      g = x;
      b = c;
    } else if (hh < 5) {
      r = x;
      g = 0;
      b = c;
    } else {
      r = c;
      g = 0;
      b = x;
    }

    const rValue = Math.round((r + m) * 255);
    const gValue = Math.round((g + m) * 255);
    const bValue = Math.round((b + m) * 255);

    const rHex = rValue.toString(16).padStart(2, '0');
    const gHex = gValue.toString(16).padStart(2, '0');
    const bHex = bValue.toString(16).padStart(2, '0');
    const rgbHex = rHex + gHex + bHex;

    // Color replacements
    result = result.replace(/\$\{color\.r\}/g, String(rValue));
    result = result.replace(/\$\{color\.g\}/g, String(gValue));
    result = result.replace(/\$\{color\.b\}/g, String(bValue));
    result = result.replace(/\$\{color\.rx\}/g, rHex);
    result = result.replace(/\$\{color\.gx\}/g, gHex);
    result = result.replace(/\$\{color\.bx\}/g, bHex);
    result = result.replace(/\$\{color\.rgbx\}/g, rgbHex);
    result = result.replace(/\$\{color\.hsb\}/g, `${hue},${saturation},${brightness}`);
    result = result.replace(/\$\{color\.h\}/g, String(hue));
    result = result.replace(/\$\{color\.s\}/g, String(saturation));

    return result;
  }

  private substituteTimePlaceholders(text: string): string {
    const now = new Date();
    let result = text;
    result = result.replace(/\$\{time\.millis\}/g, String(now.getTime()));
    return result;
  }

  private getFirstCommand(endpoint: HttpEndpoint): HttpCommand {
    return Array.isArray(endpoint) ? endpoint[0] : endpoint;
  }

  private async executeHttpRequest(
    deviceName: string,
    endpoint: HttpEndpoint,
    params: Record<string, string | number | boolean>,
    level?: number,
    hue?: number,
    saturation?: number,
    brightness?: number,
  ): Promise<void> {
    try {
      // Get webhook config for this device to access timeout setting
      const webhook = this.webhooks[deviceName];

      // Handle both single endpoint and array of endpoints
      const commands: HttpCommand[] = Array.isArray(endpoint) ? endpoint : [endpoint];

      // Execute commands sequentially
      for (const command of commands) {
        await this.executeCommand(deviceName, webhook, command, params, level, hue, saturation, brightness);
      }
    } catch (err) {
      this.log.error(`${deviceName}: HTTP request failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  private async executeCommand(
    deviceName: string,
    webhook: WebhookConfig,
    command: HttpCommand,
    params: Record<string, string | number | boolean>,
    level?: number,
    hue?: number,
    saturation?: number,
    brightness?: number,
  ): Promise<void> {
    // Get previous level for replacements
    const prevLevel = this.deviceLevel.get(deviceName) || 0;
    const currentLevel = level !== undefined ? level : prevLevel;

    // Replace placeholders in URL with actual parameter values
    let url = command.url;
    const urlParams: Record<string, string | number | boolean> = {};

    // Apply ha-bridge level replacements to URL
    url = this.substituteHaBridgeLevel(url, currentLevel, prevLevel);

    // Time replacement
    url = this.substituteTimePlaceholders(url);

    // Apply ha-bridge color replacements to URL
    if (hue !== undefined || saturation !== undefined || brightness !== undefined) {
      url = this.substituteHaBridgeColor(url, hue ?? -1, saturation ?? -1, brightness ?? -1);
    }

    // Check if params should be in URL or body
    if (command.method === 'GET') {
      // For GET, add all params to URL
      Object.assign(urlParams, params);
    } else {
      // For POST/PUT, replace URL placeholders and put rest in body
      for (const [key, value] of Object.entries(params)) {
        const placeholder = `{${key}}`;
        if (url.includes(placeholder)) {
          url = url.replace(placeholder, String(value));
        } else {
          urlParams[key] = value;
        }
      }
    }

    // Apply ha-bridge level replacements to all parameter values
    for (const [key, value] of Object.entries(urlParams)) {
      if (typeof value === 'string') {
        urlParams[key] = this.substituteHaBridgeLevel(value, currentLevel, prevLevel);
      }
    }

    // Apply color replacements to parameter values if needed
    if (hue !== undefined || saturation !== undefined || brightness !== undefined) {
      for (const [key, value] of Object.entries(urlParams)) {
        if (typeof value === 'string') {
          urlParams[key] = this.substituteHaBridgeColor(value, hue ?? -1, saturation ?? -1, brightness ?? -1);
        }
      }
    }

    // Store current level for next call
    if (level !== undefined) {
      this.deviceLevel.set(deviceName, level);
    }

    // Use device-specific timeout if configured, otherwise use platform default
    const deviceTimeout = webhook.timeout ?? this.defaultTimeout;
    await fetch(url, command.method, urlParams, deviceTimeout);
    this.log.notice(`${deviceName}: HTTP request successful`);
  }

  override async onConfigure(): Promise<void> {
    await super.onConfigure();
    this.log.info('onConfigure called');
    this.bridgedDevices.forEach(async (device) => {
      this.log.info(`Configuring device: ${device.deviceName}`);
      await device.setAttribute('onOff', 'onOff', false, device.log);
    });
  }

  override async onAction(action: string, value?: string, id?: string, formData?: PlatformConfig): Promise<void> {
    this.log.info('onAction called with action:', action, 'and value:', value ?? 'none', 'and id:', id ?? 'none');
    this.log.debug('onAction called with formData:', formData ?? 'none');
    if (id?.startsWith('root_webhooks_')) id = id.replace('root_webhooks_', '');
    if (id?.endsWith('_test')) id = id.replace('_test', '');
    if (action === 'test') {
      // Test the webhook before is confirmed
      if (isValidObject(formData, 1) && isValidObject(formData.webhooks, 1)) {
        const webhooks = formData.webhooks as Record<string, WebhookConfig>;
        for (const webhookName in webhooks) {
          if (Object.prototype.hasOwnProperty.call(webhooks, webhookName)) {
            const webhook = webhooks[webhookName];
            if (id?.includes(webhookName)) {
              // Test new format
              if (webhook.on) {
                const endpoint = Array.isArray(webhook.on) ? webhook.on[0] : webhook.on;
                this.log.info(`Testing new webhook ${webhookName} ON endpoint: ${endpoint.method} ${endpoint.url}`);
                const params = endpoint.params || {};
                fetch(endpoint.url, endpoint.method, params)
                  .then(() => {
                    this.log.notice(`Webhook test ${webhookName} ON successful!`);
                    return;
                  })
                  .catch((err) => {
                    this.log.error(`Webhook test ${webhookName} ON failed: ${err instanceof Error ? err.message : err}`);
                  });
              }
              // Test old format for backward compatibility
              else if (webhook.httpUrl && webhook.method) {
                this.log.info(`Testing new webhook ${webhookName} method ${webhook.method} url ${webhook.httpUrl}`);
                fetch(webhook.httpUrl, webhook.method)
                  .then(() => {
                    this.log.notice(`Webhook test ${webhookName} successful!`);
                    return;
                  })
                  .catch((err) => {
                    this.log.error(`Webhook test ${webhookName} failed: ${err instanceof Error ? err.message : err}`);
                  });
              }
            }
          }
        }
        return;
      }
      // Test the webhook already confirmed
      for (const webhookName in this.webhooks) {
        if (Object.prototype.hasOwnProperty.call(this.webhooks, webhookName)) {
          const webhook = this.webhooks[webhookName];
          if (id?.includes(webhookName)) {
            // Test new format
            if (webhook.on) {
              const endpoint = Array.isArray(webhook.on) ? webhook.on[0] : webhook.on;
              this.log.info(`Testing webhook ${webhookName} ON endpoint: ${endpoint.method} ${endpoint.url}`);
              const params = endpoint.params || {};
              fetch(endpoint.url, endpoint.method, params)
                .then(() => {
                  this.log.notice(`Webhook test ${webhookName} ON successful!`);
                  return;
                })
                .catch((err) => {
                  this.log.error(`Webhook test ${webhookName} ON failed: ${err instanceof Error ? err.message : err}`);
                });
            }
            // Test old format for backward compatibility
            else if (webhook.httpUrl && webhook.method) {
              this.log.info(`Testing webhook ${webhookName} method ${webhook.method} url ${webhook.httpUrl}`);
              fetch(webhook.httpUrl, webhook.method)
                .then(() => {
                  this.log.notice(`Webhook test ${webhookName} successful!`);
                  return;
                })
                .catch((err) => {
                  this.log.error(`Webhook test ${webhookName} failed: ${err instanceof Error ? err.message : err}`);
                });
            }
          }
        }
      }
    }
  }

  override async onShutdown(reason?: string): Promise<void> {
    await super.onShutdown(reason);
    this.log.info('onShutdown called with reason:', reason ?? 'none');
    if (this.config.unregisterOnShutdown === true) await this.unregisterAllDevices();
    this.bridgedDevices.clear();
  }
}
