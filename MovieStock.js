//	MovieStock is used to fetch a MovieStock from HSX.COM.  A MovieStock is a virtual security representing an actual
//	film.

class MovieStock extends Fetch
{
	#_title = undefined;

	constructor ()
	{
		super();			//	invoke the constructor of the parent class
	}

	fetch (ticker)
	{
		//	Fetch the page representing the film which is identified by the ticker symbol.  This method returns a
		//	Promise

		return new Promise ((resolve, reject) =>
		{
			//	fetch a page from HSX and scrape the bits of data I want from it...

			this.fetchPage ("security/view/" + ticker)
			.then (page =>
				{
					if (page.indexOf ("The security you requested does not currently exist on the Exchange") > -1)
						reject (ticker + " is not currently listed on the exchange")
//						else if (ticker does not represent a MovieStock)
//							reject (ticker + " does not represent a MovieStock")
					else
//						resolve (response)
//	This is where I scrape the data I want from the page.  When I'm done, simple resolve true so the invoking script
//	can do its thing.
{
	page = this.scrapeTitle(page);
	resolve (page);
}
				} )
			.catch (error => { reject (error) } )			
		})
	}

	scrapeTitle (page)
	{
		page = this.substring (page, "<title>\n");
		const temp = page.substring (0, page.indexOf ("</title"));
		if (temp.indexOf ("MovieStock") < 0) return false;
		else
		{
			this.#_title = temp.substring (0, temp.indexOf (" - MovieStock"));
alert (this.#_title);
//				page = this.substring (page, ("</title>"));
			page = this.substring (page, ("</head>"));
//				page = this.substring (page, ("<!-- Begin: Page Body -->"));
			page = this.substring (page, ("Begin: Page Body"));
			page = this.substring (page, ("-->"));
			page = this.substring (page, ("-->\r\n\r\n\r\r\n"));
			return page;
		}
	}
}