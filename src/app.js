import React, { Component } from 'react';
import './app.css';
import './router';
import PagesPie from './pages-pie.js';

var io = require("socket.io-client");
window.torrentSocket = io('http://localhost:8099/');

class App extends Component {
	componentDidMount() {
		window.router()
	}
	render() {
		return (
			<div className="App">
				<PagesPie />
			</div>
		);
	}
}

export default App;
