importScripts('/js/filewriter.js', '/js/cryptojs-aes.js', '/js/cryptojs-uint8.js', '/js/requests.js');

var fileid;
var password;
var metadata;

function initialize(fileid, password) {
	self.fileid = fileid;
	self.password = password;
	getApiExists(fileid, function(existsdata) {
		getApiMetadata(fileid, password, function(metadata) {
			self.metadata = metadata;
			getApiIp(fileid, function(ip) { 
				var message = metadata;
				message.type = "init";
				message.ip = ip.uploadip;
				message.chunks = existsdata.chunks;
				message.totalsize = existsdata.totalsize;
				postMessage(metadata);
			});
		});
	}, function(e) {
		postMessage({type:"error"});
	});
}

function download(chunknumber) {
	getApiFile(fileid, chunknumber, function(data) {
		postMessage({type: "download", data: data});
	},
	function(e) {
		postMessage({type: "error", event: e});
	});
}

function decrypt(cryptfile) {
	decryptedwords = CryptoJS.AES.decrypt(cryptfile, password);
	ui8a = CryptoJS.enc.u8array.stringify(decryptedwords);
	blob = new Blob([ui8a], {type: metadata.type});
	postMessage({type: 'decrypt', data: blob});
}

function abort() {

}

function close() {

}

onmessage = function(e) {
	var message = e.data;
	switch(message.type) {
		case "init":
			initialize(message.fileid, message.password);
			break;

		case "download":
			download(message.chunknumber);
			break;

		case "decrypt":
			decrypt(message.cryptfile);
			break;

		case "abort":
			break;

		case "close":
			break;
	}
}
