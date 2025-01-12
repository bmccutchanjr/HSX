//	A StarBond is a type of security on HSX representing an actor or director.  This module is used to fetch the
//	StarBond representing a specific individual and extract the useable bits of data from the page.

class StarBond extends Fetch
{
	constructor ()
	{
		super();

		//	All properties default to undefined

		this._attachedMovieStocks = [];
		this._trailingAverage = undefined;
	}

	fetch (ticker)
	{
		//	The plan was to make fetch() as generic as possible so that I could put it in the super class and
		//	use it in all of the derived classes.  But there are actions that are specific to each type of
		//	page being fetched.  StarBonds do not have the same data as MovieStocks.  And list of securities
		//	are different than either.
		//
		//	I intended to pass a callback to fatch() to perform after the page had been fetched..  Seemed the
		//	cleanest and most JavaScripty thing to do.  But the callback causes the object referenced by 'this',
		//	it no longer points to the class object and this.extractData() is undefined.
		//
		//	So I either duplicate the method fetch() in each class or I need to separate fetch() and extractData()
		//	and invoke them separately.  fetch() could be the same no matter what class invokes it, as such it
		//	belongs in the super class.  But its also very simple and the code could be replicated easily enough.
		//
		//	I think this is the best solution.  fetch() is a method of each child class, rather than the super class.
		//	It's still generic and has become boiler plate.  It cleaner and easier to understand the intent of the
		//	code.  It's not 'RESTful', but "rules" are meant to be broken.

		this._tickerSymbol = ticker;

		return new Promise ((resolve, reject) =>
		{
			//	fetch a page from HSX and scrape the bits of data I want from it...

			this.fetchPage ("security/view/" + ticker)
			.then (page =>
			{
				page = this.extractData (page)
				resolve (page);
			} )
			.catch (error => { reject (error) } )			
		})
	}

	extractData (page)
	{

		page = this.extractTitle (page, "StarBond");		//	The actor's name
		page = this.extractStatus (page);
		page = this.extractDateIPO (page);
		page = this.extractTAG (page);
		page = this.extractMovieStocks (page);
		page = this.extractSharePrice (page);
		page = this.extractSharesHeldLong (page);
		page = this.extractSharesHeldShort (page);
		page = this.extractSharesTraded (page);

		return page;
	}

	extractMovieStocks (page)
	{
		page = this.substring (page, "<h4>Filmography</h4>");
		const limitText = "<!-- RELATED POSTS -->";
		let movies = page.substring (0, page.indexOf (limitText));

		while (movies.indexOf ("<p>") != -1)
		{
			movies = this.extractNextMovieStock (movies);
		}

		return this.substring (page, limitText);
	}
	
	extractNextMovieStock (source)
	{
		//	Attached StarBonds are those StarBonds representing actors and/or directors that are involved with a film.
		//	These StarBonds are displayed in a table near the end of the MovieStock and are extracted from the source
		//	one at a time.

		const obj = {};

		const target = "<p><strong>";
		if (source.indexOf (target) == -1)
			obj.dateReleased = undefined;
		else
		{
			source = this.substring (source, target);
			obj.dateReleased = new Date (source.substring (0, source.indexOf ("/strong")).trim());
		}

		source = this.substring (source, "security/view/");
		obj.ticker = source.substring (0, source.indexOf ("\">")).trim();

		source = this.substring (source, "\">");
		obj.title = source.substring (0, source.indexOf ("</a>")).trim();

		this._attachedMovieStocks.push (obj);

		return source;
	}

	extractTAG (page)
	{
		try
		{
			page = this.substring (page, "<td class=\"label\">TAG:</td><td>");
			const temp = page.substring (0, page.indexOf ("</td>"));
			if ((temp != "") && (temp != "n/a"))
					this._trailingAverage = this.convertToNumber (temp);

			return page;
		}
		catch (error)
		{
			throw "Invalid input (TAG): " + page.substring (0, page.indexOf ("</td>"));
		}
	}
}