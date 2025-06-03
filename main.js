const { InstanceBase, Regex, runEntrypoint, InstanceStatus } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades')
const UpdateActions = require('./actions')
const UpdateFeedbacks = require('./feedbacks')
const UpdateVariableDefinitions = require('./variables')
const { websocket_handler } = require("./eventsAPI")
const { getSelectedPreset } = require("./api")


class ModuleInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
	}

	async init(config) {
		this.config = config

		if(!this.config.presets){
			this.config.presets = [{ id: "None", label: "None" }]
		}
		this.config.presetStatus={}
		this.config.selected=[];
		this.config.selectedPreset = await getSelectedPreset(this)
		this.saveConfig(this.config);
		this.updateStatus(InstanceStatus.Ok)

		this.updateActions() // export actions
		this.updateFeedbacks() // export feedbacks
		this.updateVariableDefinitions() // export variable definitions
		if (this.config.use_events){
			console.log("Use Events")
			this.ws = new websocket_handler(this)
		}
		
	}
	// When module gets deleted
	async destroy() {
		this.log('debug', 'destroy')
	}

	async configUpdated(config) {
		let ws_check = this.config.use_events;
		this.config = config
		if (ws_check && !this.config.use_events){
			await this.disableWS();
		}
		else if (!ws_check && this.config.use_events){
			
			console.log("Calling enable")
			await this.enableWS();
		}
	}

	async enableWS(){
		console.log("In Enable")
		this.ws = new websocket_handler(this);
	}

	async disableWS(){
		this.ws.close();
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
