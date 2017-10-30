import React, { Component } from 'react';
import './app.css';
import './router';
import PagesPie from './pages-pie.js';
import registerServiceWorker from './registerServiceWorker';
import injectTapEventPlugin from 'react-tap-event-plugin';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

var io = require("socket.io-client");
window.torrentSocket = io(document.location.protocol + '//' + document.location.hostname + (process.env.NODE_ENV === 'production' ? '/' : ':8095/'));
 
// Needed for onTouchTap 
// http://stackoverflow.com/a/34015469/988941 
injectTapEventPlugin();

registerServiceWorker();

let loadersCount = 0;
let appReady = false;
window.customLoader = (func, onLoading, onLoaded) => {
	loadersCount++;
	if(onLoading) {
		onLoading();
	}
	return (...args) => {
		func(...args);
		if(onLoaded) {
			onLoaded();
		}
		loadersCount--;
	}
};

window.isReady = () => {
	return (appReady && loadersCount === 0)
}

class App extends Component {
	componentDidMount() {
		window.router()
		appReady = true;
	}
	componentWillUnmount() {
		appReady = false;
	}
	render() {
		return (
			<MuiThemeProvider>
				<PagesPie />
			</MuiThemeProvider>
		);
	}
}

export default App;
