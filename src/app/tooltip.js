import React from 'react';

export default (props) => {
	return (
		<div className='tooltip'>
			{props.children}
			<span class="tooltiptext">{props.hint}</span>
		</div>
	)
}