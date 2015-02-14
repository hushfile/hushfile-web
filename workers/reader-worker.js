var fileReaderSync = navigator.FileReaderSync || navigator.webkitFileReaderSync;

var reader;
var file;

function init(file) {
	reader = new FileReaderSync();

	postMessage({type: 'init'});
}

function read(start, end) {
	filecontents = reader.readAsArrayBuffer(file.slice(start, end));
	postMessage({type: 'read', data: filecontents})
}


function close() {
	reader.close();
	self.close();
}

function error(message, data) {
	postMessage({type: 'error', message: message, data: data});
}

onmessage = function(e) {
	var message = e.data;

	if(!message) return;

	switch(message.type) {
		case "init":
			break;

		case "read":
			break;

		case "encrypt":
			break;

		default:
			error("Undefined type: " + message.type, message);
			break;
	}
}