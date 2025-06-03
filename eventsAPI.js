class websocket_handler {
    constructor(btns) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        this.btns = btns;
        this.ws = null;
        this.wsRetry = null;
        this.createWebsocket(true);
        this.manual_close = false;
        this.debounceTimer=null;
    }

    close() {
        this.ws.close();
        this.manual_close = true;
    }
    createWebsocket(first = false) {
        this.ws = new WebSocket(`wss://${this.btns.config.host}/api/events`);
        this.opentTimeout=null;
        if(first){
            this.openTimeout = setTimeout(() => {
                this.btns.log('warn', 'WebSocket open timeout – retrying...');
                if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
                    try {
                        this.ws.close(); // attempt to force close
                    } catch (e) {
                        this.btns.log('error', 'Failed to close WebSocket: ' + e.message);
                    }
                    this.clearSocket();
                    this.retryWebsocket();  // retry from timeout
                }
            }, 5000);
        }
    
        this.ws.onopen = () => {
            if(this.openTimeout){
                clearTimeout(this.openTimeout);
            }

            this.btns.log('info', 'Connected to WebSocket server');
            if (this.wsRetry) {
                clearInterval(this.wsRetry);
                this.wsRetry = null;
            }
        };
    
        this.ws.onerror = (error) => {
            this.btns.log('error', `WebSocket error: ${JSON.stringify(error)}`);
            // do nothing here; timeout or onclose handles retries
        };
    
        this.ws.onclose = () => {
            if(this.openTimeout){
                clearTimeout(this.openTimeout);
            }
            this.btns.log('warn', 'WebSocket connection closed');
            this.clearSocket();
            if(!this.manual_close){
                this.retryWebsocket();  // fallback in case close is triggered
            }
        };
    
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            switch(data.type){
                case("CurrentPresetChanged"):
                    //console.log(JSON.stringify(this.btns.config.presetStatus))
                    this.btns.saveConfig(this.btns.config);
                    this.btns.checkFeedbacks("presetStatus");
                    break;
                case("Notification"):
                	// Clear any pending debounce timer
                    console.log(JSON.stringify(data))
                    if (data.notification) {
                        if (data.notification.data.connectionType==="video" && data.notification.data.found){
                            this.btns.config.selected.forEach(element => {
                                this.btns.config.presetStatus[element]= "connected";
                            });
                            
                        }else if (data.notification.data.connectionType==="video" && !data.notification.data.found || data.notification.message === "Disconnected"){
                            
                            this.btns.config.selected.forEach(element => {
                                this.btns.config.presetStatus[element]= "video_lost";
                            });
                            
                    } 
                        
                        clearTimeout(this.debounceTimer);

                        // Set a new timer to "settle" after 300ms of no new messages
                        this.debounceTimer = setTimeout(() => {
                            console.log("No new messages for 300ms, performing update...");
                            //console.log(this.btns.config.selected, JSON.stringify(this.btns.config.presetStatus[this.btns.config.selected]))
                            this.btns.saveConfig(this.btns.config);
                            this.btns.checkFeedbacks("presetStatus");
                            }, 300);
                    }
                    break;
        };
    }
}
    
    
    retryWebsocket() {
        if (this.wsRetry) return;
        this.btns.log('info', 'Retrying WebSocket connection every 5 seconds...');
        this.wsRetry = setInterval(() => {
            this.createWebsocket();
        }, 5000);
    }

    clearSocket() {
        this.ws = null;
    }
}

module.exports={ websocket_handler }