module.exports = [
	function (context, props) {
		const feedbackTypesToFix = ['presetStatusBool', 'presetStatus', 'videoStatusBool'];
		let updatedFeedbacks = [];
		const presets = JSON.parse(context.currentConfig.presets || '[{ id: "None", label: "None" }]');
		for (const feedback of props.feedbacks){
			if (feedbackTypesToFix.includes(feedback.feedbackId)) {
				if (!feedback.options.preset) {
					try {
						
						if (presets.length > 0) {
							feedback.options.preset = presets[0].id;
							updatedFeedbacks.push(feedback);
							console.log("Updated")
					}
					}catch (e){
					console.log(e)	
					}
				}
			}
		}
		return {
			updatedConfig: null,
			updatedActions: [],
			updatedFeedbacks: updatedFeedbacks
		}
	}
]
