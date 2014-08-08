importScripts('cryptfile.js', 'js/cryptojs-aes.js', 'js/cryptojs-uint8.js');

var fileid;
var password;
var metadata;

function getApiExists(fileid, success, error) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', '/api/exists?fileid='+fileid, true);
	xhr.onload = function(e) {
		if(xhr.status == 200) {
			var responseobject = eval('(' + eval('(' + xhr.responseText + ')') + ')');
			if (responseobject.exists) {
				// fileid exists
				if(success) success(responseobject);
			} else {
				if(error) error(e);
			}
		}
	}
	xhr.send();
}

function getApiMetadata(success, error) {
	var xhr2 = new XMLHttpRequest();
	xhr2.open('GET', '/api/metadata?fileid='+fileid, true);
	xhr2.onload = function(e) {
		if (this.status == 200) {
			var responseJson = eval('(' + CryptoJS.AES.decrypt(this.responseText, password).toString(CryptoJS.enc.Utf8) + ')');
			if(success) success(responseJson);
		} else {
			//nop for now
		};
	};
	xhr2.send();
}

function getApiIp(success, error) {
	var ipxhr = new XMLHttpRequest();
	ipxhr.open('GET', '/api/ip?fileid='+fileid, true);
	ipxhr.onload = function(e) {
		if (this.status == 200) {
			var responseJson = eval('(' + eval('(' + this.responseText + ')') + ')');			
			if(success) success(responseJson);
		} else {
			error(e);
		};
	};

	ipxhr.send();
}

function getApiFile(chunknumber, success, error) {
	var xmr = new XMLHttpRequest();
	xmr.open('GET', '/api/file?fileid='+fileid+'&chunknumber='+chunknumber);
	xmr.onload = function(e) {
		if(this.status == 200) {
			// decrypt the data
			if(success) success(xmr.responseText);
		} else {
			if(error) error(e);
		}
	}
	xmr.send()
}

function initialize(fileid, password) {
	self.fileid = fileid;
	self.password = password;
	getApiExists(fileid, function(existsdata) {
		getApiMetadata(function(metadata) {
			self.metadata = metadata;
			getApiIp(function(ip) { 
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
	getApiFile(chunknumber, function(data) {
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
			initialize(message.fileid, message.password)
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