import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class TwingatePreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        log('Twingate Prefs: [DEBUG] fillPreferencesWindow called');

        window.set_default_size(640, 1000);

        const page = new Adw.PreferencesPage();
        window.add(page);

        const settings = this.getSettings();
        log('Twingate Prefs: [DEBUG] Settings object retrieved');

        const extensionGroup = new Adw.PreferencesGroup({
            title: 'Extension Settings',
            description: 'Interface and behavior configuration'
        });
        page.add(extensionGroup);

        const refreshIntervalRow = new Adw.ActionRow({
            title: 'Resource Refresh Interval',
            subtitle: 'Time between each list update (in seconds)'
        });

        const currentInterval = settings.get_int('resource-refresh-interval');
        log(`Twingate Prefs: [DEBUG] Current refresh interval: ${currentInterval} seconds`);

        const refreshIntervalSpinButton = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
                lower: 30,
                upper: 600,
                step_increment: 10,
                page_increment: 60
            }),
            value: currentInterval,
            valign: Gtk.Align.CENTER
        });

        refreshIntervalSpinButton.connect('value-changed', (widget) => {
            const newValue = widget.get_value();
            log(`Twingate Prefs: [DEBUG] Refresh interval changed to: ${newValue} seconds`);
            settings.set_int('resource-refresh-interval', newValue);
        });

        refreshIntervalRow.add_suffix(refreshIntervalSpinButton);
        extensionGroup.add(refreshIntervalRow);

        const infoGroup = new Adw.PreferencesGroup({
            title: 'Twingate Configuration',
            description: 'Twingate configuration management'
        });
        page.add(infoGroup);

        log('Twingate Prefs: [DEBUG] Loading Twingate configuration...');
        const config = this._loadTwingateConfig();

        if (!config) {
            log('Twingate Prefs: [ERROR] Failed to load Twingate configuration');
            const errorRow = new Adw.ActionRow({
                title: 'Error',
                subtitle: 'Unable to load Twingate configuration.\nMake sure Twingate is installed.\nTry: sudo twingate config'
            });
            infoGroup.add(errorRow);
            return;
        }

        log(`Twingate Prefs: [DEBUG] Configuration loaded successfully with ${Object.keys(config).length} keys`);

        const networkValue = config.network || 'Not configured';
        log(`Twingate Prefs: [DEBUG] Network: ${networkValue}`);

        const networkRow = new Adw.ActionRow({
            title: 'Network',
            subtitle: networkValue
        });
        infoGroup.add(networkRow);

        const controllerValue = config['controller-url'] || 'Not configured';
        log(`Twingate Prefs: [DEBUG] Controller URL: ${controllerValue}`);

        const controllerRow = new Adw.ActionRow({
            title: 'Controller URL',
            subtitle: controllerValue
        });
        infoGroup.add(controllerRow);

        const settingsGroup = new Adw.PreferencesGroup({
            title: 'Parameters',
            description: 'Twingate behavior configuration'
        });
        page.add(settingsGroup);

        const autostartValue = config.autostart || 'false';
        log(`Twingate Prefs: [DEBUG] Autostart current value: ${autostartValue}`);

        const autostartRow = new Adw.ActionRow({
            title: 'Autostart',
            subtitle: 'Start Twingate automatically at startup'
        });
        const autostartSwitch = new Gtk.Switch({
            active: autostartValue === 'true',
            valign: Gtk.Align.CENTER
        });
        autostartSwitch.connect('notify::active', (widget) => {
            const newValue = widget.active ? 'true' : 'false';
            log(`Twingate Prefs: [DEBUG] Changing autostart from ${autostartValue} to ${newValue}`);
            this._setTwingateConfig('autostart', newValue);
        });
        autostartRow.add_suffix(autostartSwitch);
        autostartRow.activatable_widget = autostartSwitch;
        settingsGroup.add(autostartRow);

        const saveAuthValue = config['save-auth-data'] || 'false';
        log(`Twingate Prefs: [DEBUG] Save Auth Data current value: ${saveAuthValue}`);

        const saveAuthRow = new Adw.ActionRow({
            title: 'Save Auth Data',
            subtitle: 'Save authentication data'
        });
        const saveAuthSwitch = new Gtk.Switch({
            active: saveAuthValue === 'true',
            valign: Gtk.Align.CENTER
        });
        saveAuthSwitch.connect('notify::active', (widget) => {
            const newValue = widget.active ? 'true' : 'false';
            log(`Twingate Prefs: [DEBUG] Changing save-auth-data from ${saveAuthValue} to ${newValue}`);
            this._setTwingateConfig('save-auth-data', newValue);
        });
        saveAuthRow.add_suffix(saveAuthSwitch);
        saveAuthRow.activatable_widget = saveAuthSwitch;
        settingsGroup.add(saveAuthRow);

        const sentryValue = config['sentry-user-consent'] || 'false';
        log(`Twingate Prefs: [DEBUG] Sentry User Consent current value: ${sentryValue}`);

        const sentryRow = new Adw.ActionRow({
            title: 'Sentry User Consent',
            subtitle: 'Consent to send error reports'
        });
        const sentrySwitch = new Gtk.Switch({
            active: sentryValue === 'true',
            valign: Gtk.Align.CENTER
        });
        sentrySwitch.connect('notify::active', (widget) => {
            const newValue = widget.active ? 'true' : 'false';
            log(`Twingate Prefs: [DEBUG] Changing sentry-user-consent from ${sentryValue} to ${newValue}`);
            this._setTwingateConfig('sentry-user-consent', newValue);
        });
        sentryRow.add_suffix(sentrySwitch);
        sentryRow.activatable_widget = sentrySwitch;
        settingsGroup.add(sentryRow);

        const logLevelGroup = new Adw.PreferencesGroup({
            title: 'Log Level',
            description: 'Log verbosity level'
        });
        page.add(logLevelGroup);

        const logLevelRow = new Adw.ComboRow({
            title: 'Log Level',
            subtitle: 'Select log level'
        });

        const logLevels = new Gtk.StringList();
        const levels = ['debug', 'info', 'warn', 'error'];
        levels.forEach(level => logLevels.append(level));

        logLevelRow.set_model(logLevels);

        const currentLevel = config['log-level'] || 'info';
        const currentIndex = levels.indexOf(currentLevel);
        log(`Twingate Prefs: [DEBUG] Log Level current value: ${currentLevel}, index: ${currentIndex}`);

        if (currentIndex >= 0) {
            logLevelRow.set_selected(currentIndex);
        }

        logLevelRow.connect('notify::selected', (widget) => {
            const newIndex = widget.get_selected();
            const newLevel = levels[newIndex];
            log(`Twingate Prefs: [DEBUG] Changing log-level from ${currentLevel} to ${newLevel} (index ${newIndex})`);
            this._setTwingateConfig('log-level', newLevel);
        });

        logLevelGroup.add(logLevelRow);

        const refreshGroup = new Adw.PreferencesGroup();
        page.add(refreshGroup);

        const refreshRow = new Adw.ActionRow({
            title: 'Refresh the Configuration',
            subtitle: 'Reload the settings from Twingate'
        });

        const refreshButton = new Gtk.Button({
            label: 'Refresh',
            valign: Gtk.Align.CENTER
        });
        refreshButton.add_css_class('suggested-action');
        refreshButton.connect('clicked', () => {
            window.close();
            this.fillPreferencesWindow(window);
        });

        refreshRow.add_suffix(refreshButton);
        refreshGroup.add(refreshRow);
    }

    _loadTwingateConfig() {
        log('Twingate Prefs: [DEBUG] _loadTwingateConfig called');

        try {
            log('Twingate Prefs: [DEBUG] Using pkexec to run: twingate config');
            const [success, stdout, stderr] = GLib.spawn_command_line_sync('pkexec twingate config');

            log(`Twingate Prefs: [DEBUG] pkexec attempt - success: ${success}`);
            log(`Twingate Prefs: [DEBUG] stdout length: ${stdout ? stdout.length : 0}`);
            log(`Twingate Prefs: [DEBUG] stderr length: ${stderr ? stderr.length : 0}`);

            if (!success || !stdout) {
                const errorMsg = stderr ? new TextDecoder().decode(stderr) : 'Unknown error';
                log(`Twingate Prefs: [ERROR] pkexec failed. Error: ${errorMsg}`);
                return null;
            }

            const output = new TextDecoder().decode(stdout);
            log(`Twingate Prefs: [DEBUG] Raw output:\n${output}`);

            const lines = output.split('\n');
            log(`Twingate Prefs: [DEBUG] Number of lines: ${lines.length}`);

            const config = {};

            for (const line of lines) {
                const trimmed = line.trim();
                log(`Twingate Prefs: [DEBUG] Processing line: "${trimmed}"`);

                if (trimmed && trimmed.includes(':')) {
                    const [key, ...valueParts] = trimmed.split(':');
                    const value = valueParts.join(':').trim();

                    config[key.trim()] = value;
                    log(`Twingate Prefs: [DEBUG] Parsed: ${key.trim()} = ${value}`);
                }
            }

            log(`Twingate Prefs: [DEBUG] Final config object: ${JSON.stringify(config)}`);
            log(`Twingate Prefs: [DEBUG] Config keys: ${Object.keys(config).join(', ')}`);

            return config;
        } catch (e) {
            log(`Twingate Prefs: [EXCEPTION] Error loading Twingate config: ${e}`);
            log(`Twingate Prefs: [EXCEPTION] Stack: ${e.stack}`);
            return null;
        }
    }

    _setTwingateConfig(key, value) {
        log(`Twingate Prefs: [DEBUG] _setTwingateConfig called with key=${key}, value=${value}`);

        try {
            const command = `pkexec twingate config ${key} ${value}`;
            log(`Twingate Prefs: [DEBUG] Executing command: ${command}`);

            GLib.spawn_command_line_async(command);

            log(`Twingate Prefs: [INFO] Twingate config updated: ${key} = ${value}`);
        } catch (e) {
            log(`Twingate Prefs: [ERROR] Error setting Twingate config: ${e}`);
            log(`Twingate Prefs: [ERROR] Stack: ${e.stack}`);
        }
    }
}
