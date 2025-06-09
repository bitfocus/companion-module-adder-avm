const { InstanceBase, Regex, runEntrypoint, InstanceStatus } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades')
const UpdateActions = require('./actions')
const UpdateFeedbacks = require('./feedbacks')
const UpdateVariableDefinitions = require('./variables')
const { websocket_handler } = require("./eventsAPI")
const { getPresets, getSelectedPreset } = require("./api")


class ModuleInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
	}

	async init(config) {
		this.config = config

		if(!this.config.presets){
			this.config.presets = JSON.stringify([{ id: "None", label: "None" }]);
		}
		this.presetStatus={}
		this.selected=[];
		this.retryCycle = 0;

		this.connected = await this.checkConnection();
		console.log(this.connected);
		console.log(this.selectedPreset)
		this.saveConfig(this.config);
		
		this.updateActions() // export actions
		this.updateFeedbacks() // export feedbacks
		this.updateVariableDefinitions() // export variable definitions
		if (this.config.use_events && this.connected){
			console.log("Use Events")
			this.ws = new websocket_handler(this)
		}
		
	}
	// When module gets deleted
	async destroy() {
		this.log('debug', 'destroy')
	}

	async checkConnection() {
	this.retryCycle++;  // Increment the cycle to invalidate previous retries
	const currentCycle = this.retryCycle;  // Save the cycle number for this call

	this.selectedPreset = await getSelectedPreset(this);

	if (this.selectedPreset === -1) {
		this.log("error", "Could not connect to Receiver, Please Check IP Address.");
		//await this.disableWS();

		// Start retry in background with current cycle
		this.startRetry(currentCycle);
		if (this.ws){
			this.disableWS();
		}
		this.updateStatus(InstanceStatus.ConnectionFailure)
		return false;
	} else {
		if (this.openTimeout) {
		clearTimeout(this.openTimeout);
		this.openTimeout = null;
		}
		this.log('info', 'Connection Established.');
		this.updateStatus(InstanceStatus.Ok);
		return true;
	}
	}

	startRetry(cycle) {
	if (this.openTimeout) {
		clearTimeout(this.openTimeout);
	}

	this.openTimeout = setTimeout(async () => {
		// Check if this retry cycle is still current
		if (cycle !== this.retryCycle) {
		// Retry cycle has been invalidated by a newer call
		this.log('debug', 'Retry cycle cancelled.');
		return;
		}

		this.log('warn', 'Receiver connection timeout retrying...');
		this.selectedPreset = await getSelectedPreset(this);

		// Check again if still valid cycle after await
		if (cycle !== this.retryCycle) {
		this.log('debug', 'Retry cycle cancelled after await.');
		return;
		}

		if (this.selectedPreset !== -1) {
		this.log('info', 'Connection re-established.');
		clearTimeout(this.openTimeout);
		this.openTimeout = null;

		if (this.config.use_events) {
			await this.enableWS();
		}
		} else {
		// Retry again!
		this.startRetry(cycle);
		}
	}, 5000);
	}


	async configUpdated(config) {
		if(this.ws){
			this.disableWS()
		}
		this.config = config
		this.connected = await this.checkConnection();
		if (this.connected && this.config.use_events){
			this.enableWS()
		}
	}

	async enableWS(){
		this.ws = new websocket_handler(this);
	}

	async disableWS(){
		this.ws.close();
		this.ws = null;
	}

	// Return config fields for web config
	getConfigFields() {
		return [
			{
				type: 'textinput',
				id: 'host',
				label: 'Receiver IP',
				width: 8,
				regex: Regex.IP,
			},
			// {
			// 	type: 'textinput',
			// 	id: 'username',
			// 	label: 'Username',
			// 	width: 8,
			// },
			{
				type: 'textinput',
				id: 'password',
				label: 'Password',
				width: 8,
				default: ""
			},
			{
				type: 'checkbox',
				id: 'use_events',
				label: 'Listen for Events',
				default: false,
				tooltip: "Create a websocket to listen for video event changes."
			}
		]
	}

	updateActions() {
		UpdateActions(this)
	}

	updateFeedbacks() {
		UpdateFeedbacks(this)
	}

	updateVariableDefinitions() {
		UpdateVariableDefinitions(this)
	}
}

runEntrypoint(ModuleInstance, UpgradeScripts)
