import React, { Component } from 'react';
import './app.css';
import './router';
import PagesPie from './pages-pie.js';

var io = require("socket.io-client");
window.torrentSocket = io('http://' + document.location.hostname + (process.env.NODE_ENV === 'production' ? '/' : ':8095/'));

import injectTapEventPlugin from 'react-tap-event-plugin';
 
// Needed for onTouchTap 
// http://stackoverflow.com/a/34015469/988941 
injectTapEventPlugin();

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

class App extends Component {
	componentDidMount() {
		window.router()
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
