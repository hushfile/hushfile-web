var fileReaderSync = navigator.FileReaderSync || navigator.webkitFileReaderSync;
importScripts('/js/requests.js');

var contents;

function read(file) {
	reader = new FileReaderSync();
	contents = reader.readAsArrayBuffer(file);
	postMessage({type:"read"})
}

function send(fileid, chunknumber, uploadpassword, finishupload) {
	var formdata = '{"cryptofile":"' + contents + '","chunknumber":"' + chunknumber+'"';
	formdata += ',"fileid":"' + fileid + '"';
	formdata += ',"uploadpassword":"' + uploadpassword + '"';
	formdata += ',"finishupload":"' + (finishupload ? "true" : "false") + '"';
	formdata += "}";

	postApiUpload(formdata, function(response) {
		postMessage({type:"send", chunknumber: chunknumber});
	},
	function(e) {
		postMessage({type:"Error", message: "Chunk could not be uploaded"});
	});
}

onmessage = function(e) {
	message = e.data;

	switch(message.type) {
		case "read":
			read(message.file);
			break;
		case "send":
			send(message.fileid, message.chunknumber, message.uploadpassword, message.finishupload);
			break;
	}
}