// load and apply client config
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
