var fileReaderSync = navigator.FileReaderSync || navigator.webkitFileReaderSync;
importScripts('/js/cryptojs-aes.js');
importScripts('/js/cryptojs-uint8.js');

var reader;
var password;
var cryptoobject;
var deletepassword;
var metadataobject;

function initialize(name, size, mimetype, deletepassword, password) {
	reader = new FileReaderSync();
	reader.onload = function(e) {
		postMessage({type:"read"});
	}
	self.password = password;
	self.deletepassword = deletepassword;
	metadatajson = '{"filename": "' + name + '", "mimetype": "' + mimetype + '", "filesize": "' + size + '", "deletepassword": "' + deletepassword + '"}';
	metadataobject = metadatajson;
//    metadataobject = CryptoJS.AES.encrypt(metadatajson, password);
	
	postMessage({type:"init"});
}

function read(file, start, end) {
	//filecontents = reader.readAsArrayBuffer(file.slice(start, end));
	filecontents = reader.readAsText(file.slice(start, end)); 
	
	postMessage(({type: 'read', filecontents: filecontents}));
}

function encrypt() {
	//Y U NO WORK?
	//ui8a = new Uint8Array(filecontents);
	//wordarray = CryptoJS.enc.u8array.parse(ui8a);
	//cryptoobject = CryptoJS.AES.encrypt(wordarray, password);
	cryptoobject = filecontents;

	postMessage({type:"encrypt"});
}

function upload(chunknumber, finishupload) {
	var xhr = new XMLHttpRequest();
	xhr.open('POST', '/api/upload', true);
	xhr.onload = function(e) {
		if (this.status == 200) {
			
			//wtf? fix this
			var responseobject = eval("("+xhr.responseText+")");
			responseobject = eval('('+responseobject+')');
			
			if(responseobject.status == 'ok') {
				postMessage({type: "upload"});	
			} else {
				postMessage({type:"error", message:"Upload unsuccessful"});
			}
		} else {
			postMessage({type:"error", message: "Unable to get content, check client config!"});
		};
	
	}
	var formData = "cryptofile=" + cryptoobject;
	formData += "&metadata=" + metadataobject;
	//formData += "&deletepassword=" + deletepassword;
	formData += "&chunknumber=" + chunknumber;
	if(finishupload) {
		formData += "&finishupload=true";
	} else {
		formData += "&finishupload=false";
	}
	console.log("Sending: " + formData);
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	xhr.send(formData);
}

onmessage = function (e) {
	var message = e.data;
	switch(message.type) {
		case "init":
			initialize(message.name, message.size, message.mimetype, message.deletepassword, message.password);
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
};