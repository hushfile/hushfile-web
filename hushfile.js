
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
	chunksize = config.chunksize || 10;

	//if(!password) password = hfRandomPassword(16);

	

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
					
					if(end < size) {
						start = end;
						end = Math.min(size, end + chunksize);
						fileid = message.response.fileid;
						uploadpassword = message.response.uploadpassword;
						worker.postMessage({type: "read", start: start, end: end, file: file, password: password, deletepassword: deletepassword});
					} else {
						if(success) success(message.response);
					}
					break;

				default:
					console.log("This is an error");
					if(error) error();
					break;
			}
		}
		//init this
		worker.postMessage({type:"init", filename: 'foo.txt', size: size, mimetype:'plain/text', deletepassword:'1234567890'});

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

	this.download = function() {

	}
};