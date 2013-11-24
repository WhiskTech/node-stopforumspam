
module.exports = {
    /**
     * private : do requests
     * takes the path and callback and does a GET request to stopforumspam.com
     * 
     * @param {String} path - the path to append to the host for the http request
     * @param {Function} callback - callback function excepting (err, result) in return
     */
    _doRequest: function(path, callback) {
	var options = {
	    host: 'www.stopforumspam.com',
	    path: '/api?f=json' + path
	};
	
	// localize the _isSpammer function to this method
	f = this._isSpammer
	
	// do the http GET request
	require('http').request(options, function(result) {
	    f(result, callback);
	}).end(); 
    },
    
    /**
     * private : is spammer
     * Receives the data and checks the existence for 'appears' in any of the follwing objects ['username', 'email', 'ip']
     * 
     * @param {Object} result - the http request result providing events for listening
     * @param {Function} callback - callback function excepting (err, result) in return
     */
    _isSpammer: function(result, callback) {
	var str = '', self = this;
	
	// listen to the data event and build the string
	result.on('data', function(chunk){
	    str += chunk;
	});
	
	// listen for errors and fire the callback with the error and no result
	result.on('error', function(err) {
	    callback(err, null);
	});
	try {
	// end of data listener; use to find any existence of appears
	result.on('end', function(){
	    var res = JSON.parse(str),
            isSpammer = false;
	    var confidence = 0;
	    if (res.ip && isSpammer == false) {
		if (res.ip.appears == 0) {
		    isSpammer = false;
		    confidence = 0;
		}
		else {
		    if (res.ip.confidence >= 25) {
			isSpammer = true;
			confidence = res.ip.confidence;
		    }
		    else {
			isSpammer = false;
		    }
		}
	    }
	    
	    // Reply back with true/false if this is a spammer
	    callback(null, confidence);
	});
	}
	catch(e) {
	    callback(null, false);
	}
    },
	
    /**
     * Check Spammer
     * Takes the object and creates path string the way stopforumspam.com wants it.
     * 
     * @param {Object} user - Object that contains any or all [username, email, ip].  e.g. {username: 'potential_spammer', email: 'spammer@email.com', ip: '0.0.0.0'}
     * @param {Function} callback - callback function excepting (err, result) in return
     */
    checkSpammer: function(user, callback) {
	var path = '';
	
	// loop through the object and prepare a path string for the request.
	for (var i in user) {
	    path += '&' + i + '=' + user[i];
	}
	
	// initate the request
	this._doRequest(path, callback);
    }
} 

