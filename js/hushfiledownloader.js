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
		var worker = new Worker('/workers/hushfiledownloader-worker.js');
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

					cryptfile = new FileWriter(message.filename, filesize*1024, password, function(){
						chunknumber++;
						if(chunknumber < totalchunks) {
							worker.postMessage({type:"download", chunknumber: chunknumber});
						} else {
							var requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
							requestFileSystem(PERSISTENT, totalsize, function(fs) {
								var file = fs.root.getFile(message.filename, {}, function(fileEntry) {
									_onprogress({event: 'load', url: fileEntry.toURL(message.mimetype)});
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
