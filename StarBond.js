//	A StarBond is a type of security on HSX representing an actor or director.  This module is used to fetch the
//	StarBond representing a specific individual and extract the useable bits of data from the page.

class StarBond extends Fetch
{
	constructor ()
	{
		super();

		//	All properties default to undefined

	}

	fetch (ticker)
	{
		//	The plan was to make fetch() as generic as possible so that I could put it in the super class and
		//	use it in all of the derived classes.  But there are actions that are specific to each type of
		//	page being fetched.  StarBonds do not have the same data as MovieStocks.  And list of securities
		//	are different than either.
		//
		//	I intended to pass this function to fatch() as a callback and execute it from fetch().  Seemed the
		//	cleanest and most JavaScripty thing to do.  But the callback causes the object referenced bu 'this',
		//	it no longer points to the StarBond object and this.extractData() is undefined.
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
				if (page.indexOf ("The security you requested does not currently exist on the Exchange") > -1)
					throw ("This security is not currently listed on the exchange")

				page = this.extractData (page)
				resolve (page);
			} )
			.catch (error => { reject (error) } )			
		})
	}

	extractData (page)
	{

alert ("extractData")
alert ("title");
		page = this.extractTitle (page, "StarBond");		//	The actor's name
alert (this._title);

		return page;
	}
}