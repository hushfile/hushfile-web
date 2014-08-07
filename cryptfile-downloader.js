importScripts('cryptfile.js');

var fileid;
var password;
var metadata;

function getApiMetadata(success, error) {
	var xhr2 = new XMLHttpRequest();
	xhr2.open('GET', '/api/metadata?fileid='+fileid, true);
	xhr2.onload = function(e) {
		if (this.status == 200) {
			// decrypt metadata
			/*try {
				metadata = CryptoJS.AES.decrypt(this.response, password).toString(CryptoJS.enc.Utf8);
			} catch(err) {
				hfSetContent(content,'download');
				return;
			};*/
			
			/*if(metadata != 'undefined') {
				try {
					var jsonmetadata = JSON.parse(metadata);
					$('#metadata').show();
					$('#filename').html(jsonmetadata.filename);
					$('#mimetype').html(jsonmetadata.mimetype);
					$('#filesize').html(jsonmetadata.filesize);
					$('#deletepassword').html(jsonmetadata.deletepassword);
				} catch(err) {
					hfSetContent('<div class="alert alert-error">Unable to parse metadata, sorry.</div>\n','download');
					return;
				};
			};*/

			console.log(this.responseText);
			var responseJson = eval('(' + this.responseText + ')');

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
			/*decryptedwords = CryptoJS.AES.decrypt(xmr.responseText, password);
			ui8a = CryptoJS.enc.u8array.stringify(decryptedwords);
			foo = new Blob(ui8a, message.type);
			var fs = requestFileSystemSync(PERSISTENT, message.size);*/
			
			/*var file = fs.root.getFile('hushfile.temp',{create: true, exclusive: false});
			var writer = file.createWriter();
			writer.seek(message.start);
			writer.write(foo);
			postMessage();*/

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

	getApiMetadata(function(metadata) {
		self.metadata = metadata;
		getApiIp(function(ip) { 
			var message = metadata;
			message.type = "init";
			message.ip = ip.uploadip;
			postMessage(metadata);
		});	
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

function decrypt() {

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
			break;

		case "abort":
			break;

		case "close":
			break;
	}
}