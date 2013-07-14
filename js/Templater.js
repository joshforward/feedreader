/**
 * Templater for the Feed Reader. Performs xsl transforms on xml.
 * @author Josh Forward (joshforward@gmail.com)
 * @param {xml} xmlDocument The xml object we get back from Google.
 * @param {string} xsltUri URI for the xsl file we want to load.
 * @param {function} callback Function to pass the results to once processing has completed.
 */
var FeedReaderTemplater = function(xmlDocument, xsltUri, callback) {

	/** @private */ this._XSLTProcessor = this._getXsltProcessor();

	// store ref to document and callback while we ajax load the transform sheet
	/** @private */ this._xmlDocument = xmlDocument;
	/** @private */ this._callback = callback;

	// prep/start the ajax call
	/** @private */ this._request = new XMLHttpRequest();
	this._request.onload = this._loadXsltCallback.bind(this);
	this._request.open('get', xsltUri, true);
	this._request.send();
};

/**
 * Get a normalized XSLTProcessor object.
 * @author Josh Forward (joshforward@gmail.com)
 * @private
 * @return {object} A normalized XSLTProcessor
 */
FeedReaderTemplater.prototype._getXsltProcessor = function(){
	if ('XSLTProcessor' in window)
		return new XSLTProcessor();
	if ('ActiveXObject' in window)
		return new this.IE_XSLTProcessor();
};


/**
 * Now that our AJAX call has retrieved the transform sheet, run it and send the results to the callback.
 * @author Josh Forward (joshforward@gmail.com)
 * @private
 */
FeedReaderTemplater.prototype._loadXsltCallback = function(){
	
	this._XSLTProcessor.importStylesheet(
		this._request.responseXML
	);
	
	this._callback(
		this._XSLTProcessor.transformToFragment(this._xmlDocument, document)
	);
	
};



/**
 * IE9 doesn't have XSLTProcessor, so we need to work around that with ActiveXObject.
 * @author Josh Forward (joshforward@gmail.com)
 */
FeedReaderTemplater.prototype.IE_XSLTProcessor = function(){

	/** @private */ this._xslt = new ActiveXObject("Msxml2.XSLTemplate");
	/** @private */ this._xslDoc = new ActiveXObject("Msxml2.FreeThreadedDOMDocument");
	
	
	
	// Our code is expecting standard functions, so bring this obj in line with expectations
	
	/**
	 * Sets the xslt we'll use.
	 * @author Josh Forward (joshforward@gmail.com)
	 * @param {string} xsl We're required to use a FreeThreadedDOMDocument for this, so re-interpret from the string representation.
	 */
	this.importStylesheet = function(xsl) {
		this._xslDoc.loadXML(xsl.xml);
		this._xslt.stylesheet = this._xslDoc;
	};
	
	/**
	 * Performs the transform. Returns the html document fragment.
	 * @author Josh Forward (joshforward@gmail.com)
	 * @param {xml} xml Expects the xml object that we get back from google.
	 * @return HTMLDocumentFragment
	 */
	this.transformToFragment = function(xml) {
		xml.charset = 'UTF-8'; // seems this is not getting set/returned properly, and defaults to a windows encoding. force a sane chartype.
		
		// set up processor and perform the transform
		var xslProc = this._xslt.createProcessor();
		xslProc.input = xml;
		xslProc.transform();
		
		return xslProc.output;
	};

};
