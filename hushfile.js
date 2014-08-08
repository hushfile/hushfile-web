
// return a random password of the given length
function hfRandomPassword(length){
	var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890_-";
	var pass="";
	var randomBuf = new Uint8Array(length);
	window.crypto.getRandomValues(randomBuf);
	for(var i=0;i<length;i++)
	pass += chars.charAt(Math.floor(randomBuf[i]/4));
	return pass;
};

var HushFileUploader = function(config) {
	var self = this;
	config = config || {};

	chunksize = config.chunksize || 1024000;

	var onloadstart = config.onloadstart;
	var onprogress = config.onprogress;
	var onload = config.onload;
	var onerror = config.onerror;

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
		var worker = new Worker('cryptfile-uploader.js');
		var tmp = 0;
		var password = hfRandomPassword(16);
		var deletepassword = hfRandomPassword(40);

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

				default:
					_onprogress({event: 'error', message: response.message});
					break;
			}
		}

		_onprogress({event: 'loadstart', filename: file.name, size: file.size, type: file.type});
		worker.postMessage({type:"init", filename: file.name, size: file.size, mimetype:file.type, deletepassword:deletepassword, password: password});
	}
}


var HushFileDownloader = function(config) {
	var self = this;
	config = config || {};

	chunksize = config.chunksize || 1024000;

	var onloadstart = config.onloadstart;
	var onprogress = config.onprogress;
	var onload = config.onload;
	var onerror = config.onerror;

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

	this.download = function(fileid, password, success, error) {
		var cryptfile;
		var worker = new Worker('cryptfile-downloader.js');
		worker.onmessage = function(e) {
			var message = e.data;
			var chunknumber = 0;
			var totalchunks;
			var totalsize;
			var filesize;
			var size;
			var totaldownload = 0;
			switch(message.type) {
				case "init":
					totalchunks = message.chunks;
					totalsize = message.totalsize;
					filesize = message.filesize;

					cryptfile = new CryptFile(message.filename, filesize, password, function(){
						chunknumber++;
						if(chunknumber < totalchunks) {
							worker.postMessage({type:"download", chunknumber: chunknumber});
						} else {
							var requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
							requestFileSystem(PERSISTENT, totalsize, function(fs) {
								var file = fs.root.getFile(message.filename, {}, function(fileEntry) {
									_onprogress({event: 'load', url: fileEntry.toURL('text/plain')});
								});
							});
						}
					});
					var file = {name: message.filename, size: filesize, type: message.mimetype};
					
					_onprogress({event: 'loadstart', file: file});
					worker.postMessage({type:"download", chunknumber:0});
					break;

				case "download":
					worker.postMessage({type: 'decrypt', cryptfile: message.data});
					break;

				case "decrypt":
					totaldownload += message.data.size;

					_onprogress({event: 'progress', loaded: totaldownload, total: filesize}); //For some odd reason filesize is undefined :(
					cryptfile.append(message.data);
					break;

				default:
					_onprogress({event: 'error', message: message});
					break;
			}
		}
		worker.postMessage({type:"init", fileid: fileid, password: password});
	}
}
