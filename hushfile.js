
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

var HushFile = function(config) {
	var self = this;
	config = config || {};

	password = config.password || hfRandomPassword(16);
	chunksize = config.chunksize || 1024000;

	//eventhandler for a file select
	this.select = function(evt) {

	}

	this.upload = function(file, success, error) {
		//how many slices do we want?
		//how many concurrent workers do we want?
		//start a worker for each slice which
		//1. Reads the slice
		//2. encrypts the slice
		//3. uploads it
		
		size = file.size;
		var worker = new Worker('cryptfile-uploader.js')
		console.log("chunksize: " + chunksize);
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
					console.log("starting");
					start = tmp;
					end = Math.min(size, start + chunksize);

					worker.postMessage({type: "read", start: tmp, end: end, file: file, password: password, deletepassword: deletepassword});
					break;

				case "read":
					worker.postMessage({type: "encrypt"});
					break;

				case "encrypt":
					console.log("file encrypted");
					chunknumber = start / chunksize;
					worker.postMessage({type: "upload", chunknumber: chunknumber, finishupload: !(end < size), fileid: fileid});
					break;

				case "upload":
					console.log("file uploaded" + message.response);
					console.log(message.response);
					
					if(end < size) {
						start = end;
						end = Math.min(size, end + chunksize);
						fileid = message.response.fileid;
						uploadpassword = message.response.uploadpassword;
						worker.postMessage({type: "read", start: start, end: end, file: file, password: password, deletepassword: deletepassword});
					} else {
						if(success) success(message.response.fileid, password);
					}
					break;

				default:
					console.log("This is an error");
					if(error) error();
					break;
			}
		}
		//init this
		worker.postMessage({type:"init", filename: file.name, size: file.size, mimetype:file.type, deletepassword:deletepassword, password: password});

		/*var tmp = 0;
		var workers = [];
		var baton = 0;
		for(var i = 0; i < self.workers; i++) {
			var worker = new Worker('cryptfile-upload.js');	

			
		}
		
		while(tmp < self.size) {
			
			var start = workers.size * self.chunksize;
			worker.postMessage({file: file, start: start, end: Math.min(self.size, start + end), transporter: undefined});
			workers.push(worker);
			tmp += self.chunksize;
		}*/
	}

	this.download = function(fileid, password, success, error) {
		var cryptfile;

		var worker = new Worker('cryptfile-downloader.js');
		worker.onmessage = function(e) {
			var message = e.data;
			var chunknumber = 0;
			var totalchunks;
			var totalsize;
			switch(message.type) {
				case "init":

					totalchunks = message.chunks;
					totalsize = message.totalsize;

					cryptfile = new CryptFile(message.filename, totalsize*1024, password, function(){
						chunknumber++;
						if(chunknumber < totalchunks) {
							worker.postMessage({type:"download", chunknumber: chunknumber});
						} else {
							var requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
							requestFileSystem(PERSISTENT, totalsize, function(fs) {
								var file = fs.root.getFile(message.filename, {}, function(fileEntry) {
									console.log(fileEntry.toURL('text/plain'));
									document.write("<a href='" + fileEntry.toURL('text/plain') + "'>wow</a>");
								});
							});
						}
					});

					worker.postMessage({type:"download", chunknumber:0});
					break;
				case "download":
					console.log("downloaded chunk: " + message.data);
					cryptfile.append(message.data);
					break;

				default:
					console.log("An error occured");
					break;
			}
		}
		worker.postMessage({type:"init", fileid: fileid, password: password});
	}
};
