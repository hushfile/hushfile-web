
var database = (function() {

	return function() {
		var self = this;
		var version = 1;
		var request;
		var db = undefined;

		self.init = function(success, error) {
			request = window.indexedDB.open("hushFiles", version);

			request.onblocked = function(e) {
				if(error) error();
			}

			request.onupgradeneeded = function(e) {
				var db = request.result;
				db.createObjectStore("chunks", {keyPath: "filename"})
			}

			request.onsuccess = function(e){
				db = request.result;
				if(success) success();
			}

			request.onerror = function(e) {
				if(error) error();
			}
		}

		self.saveChunk = function(filename, chunknumber, contents, success, error) {
			var trans = db.transaction(["chunks"], "readwrite");
			var store = trans.objectStore("chunks");
			var request = store.put({
				"filename": filename + chunknumber,
				"chunknumber": chunknumber,
				"contents": contents
			});
			
			request.onsuccess = function(e) {
				if(success) success(e);
			}
			
			request.onerror = function(e) {
				console.log(e);
				error;
			}
		}

		self.append = function(fileHandle, contents, success, error) {
			lockedFile = fileHandle.open('readwrite');
			console.log("Appending");
			request = lockedFile.append(contents);
			
			request.onsuccess = function(e) {
				console.log("Appended" + contents);
				lockedFile.flush();
				if(success) success();
			}

			request.onerror = function(e) { 
				console.log("verdamt!");
				if(error) error(e);
			}
		}

		self.readChunk = function(filename, chunknumber, success, errror) {
			var store = db.transaction(["chunks"], "readwrite").objectStore("chunks");
			var request = store.get(filename + chunknumber);
			
			request.onsuccess = function(e) {
				var data = request.result;

				if(success) success(data);
			}
			
			request.onerror = function(e) {
				if(error) error(e);
			}
		}


		// Returns a file to the concatenated file
		self.getFile = function(filename, chunks, success, error) {
			console.log("Getting entire file");
			console.log(db.mozCreateFileHandle);
			var fileRequest = db.mozCreateFileHandle(filename,'type=text/plain;name=foo.txt');

			var readAndAppend = function(fh, chunknumber) {
				self.readChunk(filename, chunknumber, function(data) {
					console.log("Chunk read, now appending");
					var fileReader = new FileReader();
					
					fileReader.onload = function(e) {
						self.append(fh, fileReader.result, function(){

							if(++chunknumber < chunks) {
								console.log("Appended and continuing");
								
								readAndAppend(fh, chunknumber);
							} else {
								request = fh.getFile();

								request.onsuccess = function(e) {
									if(success) success(request.result);
								}

								request.onerror = function(e) {
									if(error) error(e);
								}
							}
						},
						function(e){
							if(error) error(e);
						});
					}
					fileReader.readAsArrayBuffer(data.contents);
				}, 
				function(e) {
					if(error) error(e);
				});
			}

			fileRequest.onsuccess = function(e) {
				readAndAppend(fileRequest.result, 0);
			}

			fileRequest.onerror = function(e) {
				if(error) error(e);
			}
		}
	}

})();
