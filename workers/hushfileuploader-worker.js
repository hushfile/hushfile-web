var fileReaderSync = navigator.FileReaderSync || navigator.webkitFileReaderSync;
importScripts('/js/cryptojs-aes.js');
importScripts('/js/cryptojs-uint8.js');

var reader;
var password;
var cryptoobject;
var deletepassword;
var metadataobject;

var fileid;
var uploadpassword;
var filecontents;

function initialize(name, size, mimetype, deletepassword, password) {
	reader = new FileReaderSync();
	reader.onload = function(e) {
		postMessage({type:"read"});
	}

	self.password = password;
	self.deletepassword = deletepassword;
	metadatajson = '{"filename": "' + name + '", "mimetype": "' + mimetype + '", "filesize": "' + size + '", "deletepassword": "' + deletepassword + '"}';
	metadataobject = CryptoJS.AES.encrypt(metadatajson, password);
    postMessage(({type: 'debugmessage', message: "metadata key: " + metadataobject.key}));
    postMessage(({type: 'debugmessage', message: "metadata iv: " + metadataobject.iv}));
	postMessage({type:"init"});
}

function read(file, start, end) {
	filecontents = reader.readAsArrayBuffer(file.slice(start, end));

	postMessage(({type: 'read', filecontents: filecontents}));
}

function encrypt() {
	ui8a = new Uint8Array(filecontents);
	wordarray = CryptoJS.enc.u8array.parse(ui8a);
	cryptoobject = CryptoJS.AES.encrypt(wordarray, password);
    postMessage(({type: 'debugmessage', message: "cryptoobject key: " + cryptoobject.key}));
    postMessage(({type: 'debugmessage', message: "cryptoobject iv: " + cryptoobject.iv}));

	postMessage({type:"encrypt"});
}

function upload(chunknumber, finishupload) {
	var xhr = new XMLHttpRequest();
	xhr.open('POST', '/api/upload', true);
	xhr.onload = function(e) {
		if (this.status == 200) {
			//wtf? fix this
			var responseobject = JSON.parse(xhr.responseText);

			if(responseobject.status == 'OK') {
				fileid = responseobject.fileid;
				uploadpassword = responseobject.uploadpassword;
				postMessage({type: "upload", response: responseobject});
			} else {
				postMessage({type:"error", message:"Upload unsuccessful"});
			}
		} else {
			postMessage({type:"error", message: "Unable to get content, check client config!"});
		}
	}

	var formdata = '{"cryptofile":"' + cryptoobject + '","chunknumber":"' + chunknumber+'"';
	if(!chunknumber) formdata += ',"metadata":"' + metadataobject + '"';
	if(finishupload) {
		formdata += ',"finishupload":"true"';
	} else {
		formdata += ',"finishupload":"false"';
	}
	if(fileid) formdata += ',"fileid":"' + fileid + '"';
	if(uploadpassword) formdata += ',"uploadpassword":"' + uploadpassword + '"';
	if (chunknumber === 0) formdata += ',"deletepassword":"' + deletepassword + '"';
	formdata += "}";

	xhr.setRequestHeader('Content-Type', 'application/json');
	xhr.send(formdata);
}

onmessage = function (e) {
	var message = e.data;
	switch(message.type) {
		case "init":
			initialize(message.filename, message.size, message.mimetype, message.deletepassword, message.password);
			break;

		case "read":
			read(message.file, message.start, message.end);
			break;

		case "encrypt":
			encrypt();
			break;

		case "upload":
			upload(message.chunknumber, message.finishupload);
			break;

		case "abort":
			break;

		case "close":
			break;
	}
}
