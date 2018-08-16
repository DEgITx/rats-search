import React from 'react';

import RutrackerIcon from './images/strategies/rutracker.png'
import NyaaIcon from './images/strategies/nyaa.jpg'

export default (props) => {
	let className = ''
	if(props.className)
        className += props.className
    const {info} = props
    if(!info)
        return null

	return (
		<div>
        {
            info.trackers.includes('rutracker')
            &&
            <a href={`https://rutracker.org/forum/viewtopic.php?t=${info.rutrackerThreadId}`}><img src={RutrackerIcon} style={{height: 32}} /></a>
        }
        {
            info.trackers.includes('nyaa')
            &&
           <img src={NyaaIcon} style={{height: 32}} />
        }
        </div>
	)
}