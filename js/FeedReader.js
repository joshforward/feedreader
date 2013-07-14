/**
 * Creates the Feed Reader object and begins initialization.
 *
 * @author Josh Forward (joshforward@gmail.com)
 * @constructor
 * @param {string|HTMLElement} idOrObject Where to append the feed once we've processed it.
 * @this {FeedReader}
 */
var FeedReader = function(options) {

	// user-changable options
	this.data = {
		
		// where to place the results after we get the feed and process it
		'resultElement': document.body,
	
		// url of the feed to open
		'feedURL': 'http://programming.reddit.com/.rss',
		
		// we want as many results as the feed returns, but still need a limit. this seems like a sane ceiling.
		'numEntries': 99,
		
		// uri of the xsl transform sheet to use
		'xsltUri': './xsl/FeedReader.xsl',
		
		// if true, print debug messages to the console
		'debugging': true
	};
	
	
	this._log('FeedReader constructor');
	
	
	// override defaults if user passed in any options
	for (var key in this.data)
	{
		if (key in options)
			this.data[key] = options[key];
	}
	
	
	// vars/funcs beginning with underscore should be considered "private".
	// this stores a reference to the as-yet-to-be-created google feed object
	/** @private */ this._feed = null;
	
	// Set where we should place the output of this FeedReader
	/** @private */ this._resultElement = this._getElement( this.data.resultElement );
	
	// begin loading the google feed api
	google.load("feeds", "1");
	
	// .bind() so we make sure we keep the correct scope when the callback is run
	// bind is only available in newer browsers, would need to shim/require jQuery/etc for older browsers
	google.setOnLoadCallback( this.setup.bind(this) );

};


/**
 * Logs msg to console if logging is enabled.
 *
 * @author Josh Forward (joshforward@gmail.com)
 * @private
 * @this {FeedReader}
 * @param {string} msg The message to print to the console.
 */
FeedReader.prototype._log = function (msg) {

	if ( this.data.debugging )
	{
		try {
			console.log( msg );
		} catch(err) {
			// we're just logging so if there's an error, ignore it
		};
	}

};


/**
 * Return the dom element specified by id (or simply pass back the arg if it is already an element)
 *
 * @author Josh Forward (joshforward@gmail.com)
 * @private
 * @param {string|HTMLElement} idOrObject This is where we'll append the feed once we've processed it.
 */
FeedReader.prototype._getElement = function (idOrObject) {

	this._log('FeedReader _getElement');

	// specs says typeof should always be returned lowercased	
	switch ( typeof idOrObject )
	{
		case 'string':

			if (idOrObject.length > 0)
				idOrObject = document.getElementById(idOrObject);

		
		case 'object':

			// the !! is to make it obvious at a glance for anyone skimming that the object is being cast to bool
			if ( !!idOrObject )
				return idOrObject;

		
		default:
			return document.body;
	}

};


/**
 * Now that the Google API has been loaded, we want to set up / request the feed.
 *
 * @author Josh Forward (joshforward@gmail.com)
 * @this {FeedReader}
 */
FeedReader.prototype.setup = function () {

	this._log('FeedReader setup');

	this._feed = new google.feeds.Feed( this.data.feedURL );

	this._feed.setNumEntries( this.data.numEntries );
	
	// request an xml result format - we'll use XSLT for templating the result
	this._feed.setResultFormat( google.feeds.Feed.XML_FORMAT );

	// call is async - google will run callback once info is ready
	this._feed.load( this.processFeed.bind(this) );

};



/**
 * Callback: Our feed has been loaded. Time to process the result.
 *
 * @author Josh Forward (joshforward@gmail.com)
 * @this {FeedReader}
 * @param {GoogleFeedResultObject} result This is the object we get back from Google's Feed API.
 */
FeedReader.prototype.processFeed = function(result) {
	
	this._log('FeedReader processFeed');

	if (result.error)
	{
		this._log('There was an error retrieving the data feed.');
	}
	else
	{
		new FeedReaderTemplater(result.xmlDocument, this.data.xsltUri, this._templaterCallback.bind(this));
	}
	
	this._log(result);
};



/**
 * Callback: Our feed has been templated, and we've been passed back the resulting html fragment.
 *
 * @author Josh Forward (joshforward@gmail.com)
 * @this {FeedReader}
 * @param {HTMLDocumentFragment} result Resulting dom from the transform.
 */
FeedReader.prototype._templaterCallback = function(result) {
	
	this._log('FeedReader _templaterCallback');

	// try to append the result to the requested container
	try {
		this._resultElement.appendChild( result );
	}
	catch(err) {
		// can't append? ok, must be IE... try just adding directly to innerHTML
		this._resultElement.innerHTML += result;
	}
	
	
	// make the entire article clickable - capture any click on the <article>, and set location.href
	// to url of the "read more" link
	var articles = document.querySelectorAll('main article');
	for (var i=0; i < articles.length; i++)
	{
		var readMoreLink = articles[i].querySelector('.read-more'),
			onClickHandler = function(e) {
				// prevent bubbling
				e.stopPropagation();
			
				// if we clicked on a link, let things run their course.
				if ('a' == e.target.nodeName.toLowerCase())
					return;

				e.preventDefault();				
				location.href = readMoreLink.href;
			};

		articles[i].addEventListener('click', onClickHandler, false);
	}
	
	
	// some feeds will have encoded html in them (ex: > is &gt;). try to decode it.
	var decodeContentInTags = document.querySelectorAll('article *[data-decode-html]'),
		decodeHelperTag = document.createElement('div');
	for (var i=0; i < decodeContentInTags.length; i++)
	{
		decodeHelperTag = decodeContentInTags[i];
		if (decodeHelperTag.childNodes.length == 0)
			decodeContentInTags[i].innerHTML = '';
		else
		{
			decodeContentInTags[i].innerHTML = decodeHelperTag.innerHTML;
		}
	}
	
	this._log(result);
};

// older browsers don't have the console, and we don't yet have access to the "are we debugging?" variable
// just try saying we've loaded and ignore the error if it fails
try { console.log('FeedReader.js loaded'); } catch(err) { }