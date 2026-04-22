window.EventBus = {
  state: {
    totalPages: 1,
    currentPage: 1,
    wordCount: 0,
    zoomLevel: 100
  },
  
  listeners: {},

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  },

  emit(event, data) {
    this.state = { ...this.state, ...data };
    
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(this.state));
    }
  }
};