import React from 'react';
import ReactDOM from 'react-dom';
// import { Editor } from './components/Editor';
import Editor from './components/Editor2';
import './userWorker';

ReactDOM.render(
	<React.StrictMode>
		<Editor />
	</React.StrictMode>,
	document.getElementById('root')
);
