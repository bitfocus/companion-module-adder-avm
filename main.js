const { InstanceBase, Regex, runEntrypoint, InstanceStatus } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades')
const UpdateActions = require('./actions')
const UpdateFeedbacks = require('./feedbacks')
const UpdateVariableDefinitions = require('./variables')
const { websocket_handler } = require("./eventsAPI")
const { getPresets, getSelectedPreset, checkReceiver } = require("./api")


class ModuleInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
	}

	async init(config) {
		this.config = config
		this.currentStatus = InstanceStatus.Connecting;

		if(!this.config.presets){
			this.config.presets = JSON.stringify([{ id: "None", label: "None" }]);
		}
		this.presetStatus={}
		this.selected=[];
		this.ws = null
		this.conCounter=0;
		this.connected = await this.checkConnection();
		this.saveConfig(this.config);
		
		this.updateActions() // export actions
		this.updateFeedbacks() // export feedbacks
		this.updateVariableDefinitions() // export variable definitions
		// if (this.config.use_events && this.connected && !this.ws){
		// 	this.enableWS();
		// }
		this.startConnectionMonitor();
	}
	// When module gets deleted
	async destroy() {
		this.stopConnectionMonitor();
		if (this.openTimeout) {
			clearTimeout(this.openTimeout);
			this.openTimeout = null;
		}
		if (this.ws) {
			await this.disableWS();
		}
		this.log('debug', 'destroy')
	}

	async checkConnection() {
		if (this.config.host === undefined || this.config.host === ""){
			return;
		}
		if (this.isChecking) {
			this.log('debug', 'Skipping duplicate connection check...');
			return;
		}
		this.isChecking = true;
		try {
			let success = true;
			// if(this.conCounter===0){
			// 	const presets = await getPresets(this);
			// 	if (presets === -1){
			// 		success = false;
			// 	}else{
			// 		if(this.config.presets !== JSON.stringify(presets)){
			// 			this.config.presets = JSON.stringify(presets);
			// 			this.updateActions();
			// 		}
			// 	}			
			// }else{
			// 	const selected= await getSelectedPreset(this, 1, 1);
			// 	if (selected === -1){
			// 		success=false;
			// 	}else{
			// 		this.selectedPreset = selected;
			// 	}
			// 

			try {
				await checkReceiver(this);
				success = true;
			} catch (error) {
				success = false;
			}

			if (!success) {
				this.log("error", "Could not connect to Receiver, Please Check IP Address.");
				if (this.ws) {
					this.disableWS();
				}
				if (this.currentStatus !== InstanceStatus.ConnectionFailure){
					this.currentStatus=InstanceStatus.ConnectionFailure;
					this.updateStatus(InstanceStatus.ConnectionFailure, "Failed to connect to receiver.");
				}
				return false;
			} else {

				this.conCounter = (this.conCounter + 1) % 2;
				if (this.config.use_events && !this.ws) {
					await this.enableWS();
				}
				if (this.currentStatus !== InstanceStatus.Ok){
					this.currentStatus=InstanceStatus.Ok;
					this.updateStatus(InstanceStatus.Ok, "Connected to Receiver.");
				}

				return true;
			}
		} finally {
			this.isChecking = false; 
		}
	}


	startConnectionMonitor() {
		// Clear any previous monitor interval
		if (this.connectionMonitor) {
			clearInterval(this.connectionMonitor);
		}

		this.connectionMonitor = setInterval(async () => {
			this.connected = await this.checkConnection(); 
			if (this.connected && this.conCounter == 0){
				const presets = await getPresets(this);
				if (presets !== -1 && this.config.presets !== JSON.stringify(presets)){
					this.config.presets = JSON.stringify(presets);
					this.updateActions();
				}else{
					const selected= await getSelectedPreset(this, 1, 1);
					if (selected !== -1){
						this.selectedPreset = selected;
					}
				}
			this.conCounter = (this.conCounter + 1) % 2;
			}
		}, 10000);  // Every 10 seconds
	}

	stopConnectionMonitor() {
		if (this.connectionMonitor) {
			clearInterval(this.connectionMonitor);
			this.connectionMonitor = null;
		}
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
				default: ""
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
