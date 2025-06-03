const { getPresets, connectPreset, getSelectedPreset } = require("./api")


module.exports = function (self) {
	self.setActionDefinitions({
		refresh_presets: {
			name: 'Refresh Presets',
			callback: async (event) => {
				let presets = await getPresets(self, self.config.host)
				self.config.presets = presets;
				self.saveConfig(self.config);
				self.updateActions();
			}
		},
		change_preset: {
			name: 'Change Preset',
			options: [
				{
					id: "preset",
					label: "Preset",
					type: "dropdown",
					choices: self.config.presets,
					default: self.config.presets[0].id
				}
			],
			learn: async (action) => {
				let presets = await getPresets(self, self.config.host)
				self.config.presets = presets;
				self.saveConfig(self.config);
				self.updateActions();
			},
			callback: async (action) => {
				let connected = await connectPreset(self, action.options.preset, action.controlId);
				Object.keys(self.config.presetStatus).forEach(v => self.config.presetStatus[v] = "disconnected")
				if (connected){
					self.config.presetStatus[action.controlId] = "connected";
					self.config.selected = [action.controlId]
					self.config.selectedPreset = action.options.preset;
				}
				//console.log(self.config.presetStatus[action.controlId])
				self.saveConfig(self.config);
				self.checkFeedbacks("presetStatus")
			},
			subscribe: async (action) => {
				const preset = action.options.preset;
				const button = action.controlId;
				//let selected = await getSelectedPreset(self);

				self.config.presetStatus[button] = self.config.selectedPreset === preset ? "connected":"disconnected"
				if(self.config.presetStatus[button] === "connected"){
					self.config.selected.push(button);
				}
				self.saveConfig(self.config);
				self.checkFeedbacks("presetStatus")

			},
			unsubscribe: async (action) => {
				delete self.config.presetStatus[action.controlId]
				self.saveConfig(self.config);
			}
		},
		disconnect: {
			name: 'Disconnect',
			options: [
			],
			callback: async (action) => {
				await connectPreset(self, 0);
				self.config.presetStatus[action.controlId]= "disconnected";
				self.config.selected = [];
				self.config.selectedPreset = 0;
				self.saveConfig(self.config);
				self.checkFeedbacks("presetStatus");
			}
		}
	});
}
