import React from 'react';

export default (props) => {
	return (
		<div className='column center'  style={{color: 'grey', marginTop: '12px'}}>
			<div className='clickable pad0-75 fs0-75' onClick={() => {
				window.router('/DMCA');
			}}>
				DMCA / Copyright
			</div>
      		<div className='fs0-75 pad0-75 break-word donation-line' style={{color: 'grey'}}>Donation to support project (bitcoin): 1Ega5zeCSMPgyDn6fEMMiuGoqNNpS53ipK</div>
      	</div>
	)
}