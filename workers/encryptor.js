var fileReaderSync = navigator.FileReaderSync || navigator.webkitFileReaderSync;
importScripts('/js/cryptojs-aes.js');
importScripts('/js/cryptojs-uint8.js');

var filecontents;
var cryptofile;

function read(file) {
	reader = new FileReaderSync();
	contents = reader.readAsArrayBuffer(file);
	postMessage({type:"read"})
}

function encrypt(cryptoobject, chunknumber) {
	ui8a = new Uint8Array();
	wordarray = CryptoJS.enc.u8array.parse(ui8a);
	cryptofile = CryptoJS.AES.encrypt(wordarray, password);
	postMessage({type:"encrypt"});
}

function store() {
	var request = indexedDB.open("")
}

onmessage = function(e) {
	message = e.data;

	if(!message) {
		throw new Error("No message recieved");
	}

	switch(message.type) {
		case "init":
			break;
		case "read":
			read(message.file);
			break;
		case "encrypt":
			break;
	}
}