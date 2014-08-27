var HushFileUploader = function(config) {
	var self = this;
	config = config || {};

	chunksize = Math.floor((config.chunksize || 1024*1024)*2/3);

	var onloadstart = config.onloadstart;
	var onprogress = config.onprogress;
	var onload = config.onload;
	var onerror = config.onerror;

	// return a random password of the given length
	self.generatePassword = function(length){
		var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890_-";
		var pass="";
		var randomBuf = new Uint8Array(length);
		window.crypto.getRandomValues(randomBuf);
		for(var i=0;i<length;i++)
		pass += chars.charAt(Math.floor(randomBuf[i]/4));
		return pass;
	}

	_onprogress = function(progress) {
		var event = progress.event;
		delete progress.event;

		switch(event) {
			case 'loadstart':
				if(onloadstart) onloadstart(progress);
				break;

			case 'progress':
				if(onprogress) onprogress(progress);
				break;

			case 'load':
				if(onload) onload(progress);
				break;

			case 'loadend':
				if(onloadend) onloadend(progress);
				break;

			case 'error':
			default:
				if(onerror) onerror(progress);
				break;
		}
	}

	this.upload = function(file, success, error) {
		var size = file.size;
		var worker = new Worker('/workers/hushfileuploader-worker.js');
		var tmp = 0;
		var password = self.generatePassword(16);
		var deletepassword = self.generatePassword(40);

		var start;
		var end;
		var fileid;
		var uploadpassword;
		worker.onmessage = function(e) {
			var message = e.data;
			switch(message.type) {
				case "init":
					start = tmp;
					end = Math.min(size, start + chunksize);

					worker.postMessage({type: "read", start: tmp, end: end, file: file, password: password, deletepassword: deletepassword});
					break;

				case "read":
					worker.postMessage({type: "encrypt"});
					break;

				case "encrypt":
					chunknumber = start / chunksize;
					worker.postMessage({type: "upload", chunknumber: chunknumber, finishupload: !(end < size), fileid: fileid});
					break;

				case "upload":
					_onprogress({event: 'progress', loaded: end, total: size});

					if(end < size) {
						start = end;
						end = Math.min(size, end + chunksize);
						fileid = message.response.fileid;
						uploadpassword = message.response.uploadpassword;
						worker.postMessage({type: "read", start: start, end: end, file: file, password: password, deletepassword: deletepassword});
					} else {
						//we should make a call to finalize the upload here
						_onprogress({event: 'load', fileid: message.response.fileid, password: password, chunks: chunknumber+1});
					}
					break;

                case "debugmessage":
                    console.log('debug: ' + message.message)
                    break;

                default:
					_onprogress({event: 'error', message: response.message});
					break;
			}
		}

		_onprogress({event: 'loadstart', filename: file.name, size: file.size, type: file.type});
		worker.postMessage({type:"init", filename: file.name, size: file.size, mimetype:file.type, deletepassword:deletepassword, password: password});
	}
}
