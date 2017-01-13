import React, { Component } from 'react';

export default class Page extends Component {
	setTitle(title) {
		if(title) {
			document.title = title;
		}
	}
	setDescription(description) {
		this.setMetaTag('description', description);
	}
	setMetaTag(name, content) {
		const head = document.getElementsByTagName('head')[0];
		const headChilds = head.children;
		let meta;
		for(let i = 0; i < headChilds.length; i++) {
			if(headChilds[i].nodeName.toLowerCase() == 'meta' && headChilds[i].name.toLowerCase() == name) {
				meta = headChilds[i];
				break;
			}
		}
		if(!meta) {
			meta = document.createElement('meta');
			head.appendChild(meta);
		}
		meta.name = name;
		meta.content = content;
	}
}
