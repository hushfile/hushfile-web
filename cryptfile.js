var persistentStorage = navigator.persistentStorage || navigator.webkitPersistentStorage;
 
function CryptFile(filename, size, passphrase, success) {
	var self = this;

	self._filename = filename;
	self._size = size;
	self._passphrase = passphrase;

	// Start worker.
	self._worker = new Worker('cryptfileworker.js');
	self.postMessage();

	self._worker.onmessage = function (e) {
		var message = e.data;
		self.log("Message: " + JSON.stringify(message));
		switch(message.type) {
			case "written":
				if(success) success();
				break;
		}
	}

	persistentStorage.queryUsageAndQuota(
		function (used, remaining) {
		self.log("Quota: " + remaining + "/" + used);

		if (self._size < remaining) {
			// Create method for this.
			self.postMessage({ type: "initialize", filename: self._filename, size: self._size, passphrase: self._passphrase });
			return;
		}

		persistentStorage.requestQuota(self._size,
			function (bytes) {
				self.log("Quota: Available " + bytes + " bytes");
				self.postMessage({ type: "initialize", filename: self._filename, size: self._size, passphrase: self._passphrase });
			},
			function (e) {
				self.log("Error: " + e);
				self.stop();
			});
		},
		function (e) {
				self.log("Error: " + e);
				self.stop();
		}
	);
}

CryptFile.prototype.postMessage = function (message) {
	this.log("Sending: " + JSON.stringify(message));
	this._worker.postMessage(message);
}

CryptFile.prototype.log = function (message) {
	//console.log(this._filename + ": " + message);
}

CryptFile.prototype.append = function (data) {
	this.postMessage({ type: "append", data: data });
}

CryptFile.prototype.stop = function () {
	this.postMessage({ type: "stop" });
}

CryptFile.prototype.remove = function () {
	this.postMessage({ type: "remove" });
}

CryptFile.prototype.stop = function () {
	this.postMessage({ type: "stop" });
}
