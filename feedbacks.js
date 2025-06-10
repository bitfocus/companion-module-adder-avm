const { combineRgb } = require('@companion-module/base')

module.exports = async function (self) {
	self.setFeedbackDefinitions({
		presetStatus: {
			name: 'Preset Connection Status - Advanced',
			label: 'Preset Status',
			type: 'advanced',
				options: [
					{
						type: 'colorpicker',
						label: 'Connected Background Color',
						id: 'bg_connected',
						tooltip: 'Button Background Color for successful connection',
						default: 0x00ff00 // Green
					},
					{
						type: 'colorpicker',
						label: 'Connected Text Color',
						id: 'fg_connected',
						tooltip: 'Button Text color for successful connection',
						default: 0x000000 // Black
					},
					{
						type: 'colorpicker',
						label: 'Video Loss Background Color',
						id: 'bg_warning',
						tooltip: 'Button Background Color for video loss',
						default: 0xffa500 // orange
					},
					{
						type: 'colorpicker',
						label: 'Video Loss Text Color',
						id: 'fg_warning',
						tooltip: 'Button Background Color for video loss',
						default: 0x000000 // Black
					},
					{
						type: "checkbox",
						label: "Show Video Loss Message",
						id: "show_vl",
						tooltip: "Show message on button for Video Loss",
						default: true
					},
					{
						type: "textinput",
						label: "Video Loss Message",
						id: 'vl_text',
						tooltip: 'customize video loss button text',
						default: "No Video"
					},
					{
						type: 'colorpicker',
						label: 'Disconnected Background Color',
						id: 'bg_error',
						tooltip: 'Button Background Color for failed connection',
						default: 0xff0000 // Red
					},
					{
						type: 'colorpicker',
						label: 'Disconnected Text Color',
						id: 'fg_error',
						tooltip: 'Button Background Color for failed connection',
						default: 0xffffff // White
					},
				],
			callback: (feedback) => {
				let connectionStatus = self.presetStatus?.[feedback.controlId] || {};
				
				if (connectionStatus === "connected"){
					return {
						bgcolor: feedback.options.bg_connected,
						color: feedback.options.fg_connected,
					}
				}else if (connectionStatus === "connecting"){
					return {
							bgcolor: feedback.options.bg_warning,
							color: feedback.options.fg_warning,
							text: "Connecting"
						}
				}else if (connectionStatus === "video_lost") {
					//console.log("In Video Loss Feedback")
					if (feedback.options.show_vl){
						
						return {
							bgcolor: feedback.options.bg_warning,
							color: feedback.options.fg_warning,
							text: feedback.options.vl_text
						}
					}else {
						return {
							bgcolor: feedback.options.bg_warning,
							color: feedback.options.fg_warning,
						}
					}
				}else{
					return {
						bgcolor: feedback.options.bg_error, 
						color: feedback.options.fg_error 
					}					
				}

			},
		},
		presetStatusBool: {
			name: 'Preset Status - Boolean',
			label: 'Preset Status - Boolean',
			type: 'boolean',
			callback: (feedback) => {
			let connectionStatus = self.presetStatus?.[feedback.controlId] || {};
				
				if (connectionStatus === "connected" || connectionStatus === "video_lost"){
					return true;
				}else{
					return false;
				}
			}
		},
		videoStatusBool: {
			name: 'Video Status - Boolean',
			label: 'Video Status - Boolean',
			type: 'boolean',
			callback: (feedback) => {
			let connectionStatus = self.presetStatus?.[feedback.controlId] || {};
				
				if (connectionStatus === "video_lost"){
					return true;
				}else{
					return false;
				}
			}
		}
	})
}
