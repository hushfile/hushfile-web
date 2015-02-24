// main function to handle requests
function hfhandlerequest() {
	if(window.location.pathname == "/") {
		// show upload page
		hfShowPage('upload.html','upload');
	} else {
		// this is not a request for a known url, get fileid and password
		var fileid = window.location.pathname.substr(1);
		
		// check if fileid exists
		$.ajax({
			url: '/api/exists?fileid='+fileid,
			type: 'GET',
			dataType: 'json',
			success: function(responseobject) {
				if (responseobject.exists) {
					// fileid exists
					if(window.location.hash.substr(1)=="") {
						content = '<div class="alert alert-info">Enter password:</div>\n';
						content += '<input type="text" id="password">\n';
						content += '<button type="button" class="btn btn-large btn-success" onclick="hfPwRedirect(\'' + fileid + '\');">Go</button>\n';
						hfSetContent(content,'download');
					} else {
						// show download page
						hfShowPage('download.html','download', function(key) {
							$('#downloadbtn').click(function(){
								hfDownload(fileid, responseobject.chunks, responseobject.totalsize);
							});
						});
					}

				} else {
					// fileid does not exist
					hfSetContent('<div class="alert alert-error">Invalid fileid. Expired ?</div>\n','download');
					return;
				}
			}
		});
	};
};

// function to set page content
function hfSetContent(content,menuitem) {
	// set main page content
	document.getElementById('content').innerHTML=content
	// get all menuitems
	var menuitems = document.getElementsByClassName('menuitem');
	// loop through menuitems
	for(var i=0; i<menuitems.length; i++) { 
		// this is the active menuitem
		if(menuitems[i].id == menuitem) {
			menuitems[i].className="menuitem active";
		} else {
			menuitems[i].className="menuitem";
		};
	};
};


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


// function to show pages from custom menu items
function hfShowPage(url, key, success, erroŕ) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', '/'+url, true);
	xhr.onload = function(e) {
		if (this.status == 200) {
			// display page content
			hfSetContent(xhr.responseText,key);
			
			// some logic is put here to make sure the page is done 
			// loading before the functions are called
			if(url == 'upload.html') {
				// create random password
				document.getElementById('password').value=hfRandomPassword(40);

				//wait for a file to be selected
				document.getElementById('files').addEventListener('change', hfHandleFileSelect, false);
			}
			
			if(key == 'download') {
				// get metadata
				var fileid = window.location.pathname.substr(1);
				hfGetMetadata(fileid);
			}

			if(success) success(key)
		} else {
			alert("Unable to get content, check client config!");
		};
	};
	xhr.send();
};

// load and apply client config
function hfGetConfigs() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/hushfile-webclient-config.json', true);
    xhr.onload = function(e) {
        if (this.status == 200) {
            config = JSON.parse(xhr.responseText);
            
            // handle footer config
            if(!(config.footer.showfooter)) {
                document.getElementById('navbarbottom').style.display = 'none';
            } else {
                if(config.footer.footer == "default") {
                    // show the default footer, set email
                    document.getElementById('operatoremail').href = 'mailto:'+config.footer.operatoremail;
                } else {
                    // get and show custom footer
                    footerxhr = new XMLHttpRequest();
                    footerxhr.open('GET', '/'+config.footer.footer, true);
                    footerxhr.onload = function(e) {
                        if (this.status == 200) {
                            // footer fetched OK, replace default footer
                            document.getElementById('navbarbottominner').innerHTML=footerxhr.responseText;
                        } else {
                            document.getElementById('navbarbottominner').innerHTML='<div class="alert alert-error">Unable to get footer :( Check client config!</div>';
                        };
                    };
                };
            };
            
            // handle menu config, loop through custom menu items
            for(var i=0;i<config.menuitems.length;i++){
                var obj = config.menuitems[i];
                for(var key in obj){
                    // create divider li
                    li = document.createElement("li");
                    li.className = "divider-vertical";
                    document.getElementById('navmenu').appendChild(li);
                    
                    // create link li
                    li = document.createElement("li");
                    li.id = key;
                    li.className = "menuitem";
                    a = document.createElement("a");
                    a.href="javascript:hfShowPage('" + obj[key] + "','" + key + "');";
                    linkText = document.createTextNode(key);
                    a.appendChild(linkText);
                    li.appendChild(a);
                    document.getElementById('navmenu').appendChild(li);
                }
            }
        } else {
            // unable to get config, show error
            hfSetContent('<div class="alert alert-error">Unable to get client config, contact operator.</div>\n','upload');
            return;
        };
    };

    // send initial request to get client config
    xhr.send();


    // load serverinfo
    var xhr2 = new XMLHttpRequest();
    xhr2.open('GET', '/api/serverinfo', true);
    xhr2.onload = function(e) {
        if (this.status == 200) {
            serverinfo = JSON.parse(xhr2.responseText);
            // OK, handle request
            hfhandlerequest();
        } else {
            // unable to get serverinfo, show error
            hfSetContent('<div class="alert alert-error">Unable to get serverinfo, contact operator</div>\n','upload');
            return;
        };
    };

    // send initial request to get server settings
    xhr2.send();

    if(typeof(Worker) == "undefined") {
        // web workers not supported
        alert("web workers not supported in this browser");
    };
};
