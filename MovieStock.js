//	MovieStock is used to fetch a MovieStock from HSX.COM.  A MovieStock is a virtual security representing an actual
//	film.

class MovieStock extends Fetch
{
	_title = undefined;

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
					else
					{
						//	This is where I scrape the data I want from the page.  When I'm done, simply resolve true or false, so the invoking
						//	script can do its thing.
						//
						//	It should fo without daying, nut the data must be extracted in the order its coded in the page.

						page = this.extractTitle (page);
						page = this.extractStatus (page);
						page = this.extractDateIPO (page);
						page = this.extractGenre (page);
						page = this.extractMPAARating (page);
						page = this.extractPhase(page);
						page = this.extractDateReleased (page);
						page = this.extractReleasePattern (page);
						page = this.extractDomesticGross (page);
						page = this.extractTheaterCount (page);
					//	get attached StarBonds
					//	get current price
					//	get shares held long
					//	get shares held short
					//	get shares traded today

						resolve (page);
					}
				} )
			.catch (error => { reject (error) } )			
		})
	}

	//	Funcrions to extract specific bits of data from the page.  These functions are in alphabetical order, to make
	//	it easier to find them.

	extractDateDelisted (page)
	{
		//	The date of the Initial Public Offering (IPO) for this MovieStock.  A MovieStock must always have a valid
		//	date of IPO.

		page = this.substring (page, "<td class=\"label\">Delist&nbsp;Date:</td><td>");
		this._dateDateDelisted = new Date (page.substring (0, page.indexOf ("</td>")));
		return page;
	}

	extractDateIPO (page)
	{
		//	The date of the Initial Public Offering (IPO) for this MovieStock.  A MovieStock's page should always have a
		//	valid date of IPO or a valid date of delist.

		if (this._status == "Inactive")
		{
			//	If the film's status in "Inactive", the date of theatrical release will not be on this page.  Instead, look
			//	for the delisted date and set _dateReleased to undefined.

			this._dateIPO = undefined;
			return this.extractDateDelisted (page);
		}

		page = this.substring (page, "<td class=\"label\">IPO&nbsp;Date:</td><td>");
		this._dateIPO = new Date (page.substring (0, page.indexOf ("</td>")));
		return this.substring (page, ("</td>"));
	}

	extractDateReleased (page)
	{
		//	The date the film represented by this MovieStock was released to theaters.  Unlike the date of the IPO, the
		//	release date is not required.  (In real life, the film may still be in a pre-production phase.  It may not
		//	even be certain that the film will actually be made, let alone released to theaters.)
		
		page = this.substring (page, "<td class=\"label\">Release&nbsp;Date:</td><td>");
		const temp = page.substring (0, page.indexOf ("</td>"));
		if (temp == "n/a")
		{
			this._dateReleased = undefined;
			return this.substring (page, ("</td>"));
		}

		try
		{
			this._dateReleased = new Date (temp);
			return this.substring (page, ("</td>"));
		}
		catch (error)
		{
			this._error = "Error estracting release date: " + error;
			return false;
		}
	}

	extractDomesticGross (page)
	{
		page = this.substring (page, "<td class=\"label\">Gross:</td><td>");
		let temp = page.substring (0, page.indexOf ("</td>"));
		if ((temp == "") || (temp == "n/a"))
		{
			//	Not every film has a domestic gross, many have not even been in theaters yet.  When included,
			//	domestic gross is always prefixed with a dollar sign
	
			this._domesticGross = undefined;
		}
		else
			if (temp[0] == "$")
			{
				temp = temp.substring (1);
				temp = temp.replaceAll (",", "");
				this._domesticGross = temp * 1;
alert (this._domesticGross);
			}
			else
			{
				this._domesticGross = temp * 1;
				throw "Invalid input (domestic gross): " + temp;
			}

		return page;
	}

	extractGenre (page)
	{
		page = this.substring (page, "<td class=\"label\">Genre:</td><td>");
		this._genre = page.substring (0, page.indexOf ("</td>"));
		return this.substring (page, ("</td>"));
	}

	extractMPAARating (page)
	{
		page = this.substring (page, "<td class=\"label\">MPAA Rating:</td><td>");
		this._MPAA = page.substring (0, page.indexOf ("</td>"));
		return this.substring (page, ("</td>"));
	}

	extractPhase (page)
	{
		page = this.substring (page, "<td class=\"label\">Phase:</td><td>");
		this._phase = page.substring (0, page.indexOf ("</td>"));
		return this.substring (page, ("</td>"));
	}

	extractReleasePattern (page)
	{
		const target = "<td class=\"label\">Release&nbsp;Pattern:</td><td>";

		if (page.indexOf (target) < 0)
		{
			//	Release pattern is irrelevant for dead delisted films, and the page may not include it.

			this._releasePattern = undefined;
			return page;
		}

		page = this.substring (page, target);
		this._status = page.substring (0, page.indexOf ("</td>"));
		return this.substring (page, ("</td>"));
	}

	extractStatus (page)
	{
		page = this.substring (page, "<td class=\"label\">Status:</td><td>");
		this._status = page.substring (0, page.indexOf ("</td>"));
		return this.substring (page, ("</td>"));
	}

	extractTheaterCount (page)
	{
		page = this.substring (page, "<td class=\"label\">Theaters:</td><td>");
		let temp = page.substring (0, page.indexOf ("</td>"));
		if ((temp == "") || (temp == "n/a"))
		{
			//	Not every film has a theater count, many have not even been in theaters and some never will be,
	
			this.theaterCount = undefined;
		}
		else
			try
			{
				temp = temp.substring (1);
				temp = temp.replaceAll (",", "");
				this.theaterCount = temp * 1;
alert (this.theaterCount);
			}
			catch (error)
			{
				this._theaterCount = temp * 1;
				throw "Invalid input (theater count): " + temp;
			}

		return page;
	}

	extractTitle (page)
	{
		page = this.substring (page, "<title>\n");
		const temp = page.substring (0, page.indexOf ("</title"));
		if (temp.indexOf ("MovieStock") < 0)
		{
			this._error = "The selected security is not a MovieStock";
			return false;
		}
		else
		{
			this._title = temp.substring (0, temp.indexOf (" - MovieStock"));
			return this.substring (page, ("<!--                  Begin: Page Body                      -->"));
		}
	}
}