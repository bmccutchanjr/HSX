//	MovieStock is used to fetch a MovieStock from HSX.COM.  A MovieStock is a virtual security representing an actual
//	film.

class MovieStock extends Fetch
{
	constructor ()
	{
		super();			//	invoke the constructor of the parent class

		//	Everything defaults to undefined...

		this._attachedStarBonds = [];
		this._dateDateDelisted = undefined;
		this._dateIPO = undefined;
		this._dateReleased = undefined;
		this._domesticGross = undefined;
		this._genre = undefined;
		this._MPAARating = undefined;
		this._phase = undefined;
//			this._sharesHeldLong = undefined;
//			this._sharesHeldShort = undefined;
//			this._sharesTraded = undefined;
//			this._status = undefined;
		this._theaterCount = undefined;
		this._tickerSymbol = undefined;
		this._title = undefined;
	}

	fetch (ticker)
	{
		this._tickerSymbol = ticker;

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
					//	This is where I scrape the data I want from the page.  When I'm done, simply resolve true or false,
					//	so the invoking script can do its thing.
					//
					//	It should go without saying, but the data must be extracted in the order it's coded in the page.

					page = this.extractTitle (page);
					page = this.extractStatus (page);			//	a method of the parent (super) class
					page = this.extractDateIPO (page);
					page = this.extractGenre (page);
					page = this.extractMPAARating (page);
					page = this.extractPhase(page);
					page = this.extractDateReleased (page);

					if (this._dateReleased != undefined)
					{
						//	Not every film has a release date and it seems the source page omits release pattern when
						//	this is the case.  In any event, release pattern is only relevant if a film does have a
						//	release date.  The same could go for domestic gross and theater count as well (except the
						//	source page seems to always include those).  So if release date is undefined, skip release
						//	pattern, domestic gross and theater count.

						page = this.extractReleasePattern (page);
						page = this.extractDomesticGross (page);
						page = this.extractTheaterCount (page);
					}

					page = this.extractAttachedStarBonds (page);
					page = this.extractSharePrice (page);
					page = this.extractSharesHeldLong (page);
					page = this.extractSharesHeldShort (page);
					page = this.extractSharesTraded (page);

//						resolve (page);
					resolve (true);
				}
			} )
			.catch (error => { reject (error) } )			
		})
	}


	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//	Functions to extract specific bits of data from the page.  These functions are in alphabetical order, to make
	//	it easier to find them.

	extractAttachedStarBonds (page)
	{
		page = this.substring (page, "<h4>Cast</h4>");
		const limitText = "<!-- RELATED POSTS -->";
		let credits = page.substring (0, page.indexOf (limitText));

		while (credits.indexOf ("<p>") != -1)
		{
			credits = this.extractNextStarBond (credits);
		}

		return this.substring (page, limitText);
	}
	
	extractNextStarBond (source)
	{
		//	Attached StarBonds are those StarBonds representing actors and/or directors that are involved with a film.
		//	These StarBonds are displayed in a table near the end of the MovieStock and are extracted from the source
		//	one at a time.

		const obj = {};

		source = this.substring (source, "<p>");
		obj.name = source.substring (0, source.indexOf (" (<a href")).trim();
		source = this.substring (source, "security/view/");
		obj.ticker = source.substring (0, source.indexOf ("\">")).trim();

		if (this.isStarBondUnique (obj.name))
				this._attachedStarBonds.push (obj);

		return source;
	}

	isStarBondUnique (name)
	{
		//	StarBonds can appear in the MovieStock cast more than once (as an actor and as a director), but for my purposes
		//	StarBonds should be unique (HSX will only adjust a StarBond one time for any given MovieStock).

		this._attachedStarBonds.forEach (sb =>
		{
			if (sb.name == name) return false;
		} )

		return true;
	}

	extractDateDelisted (page)
	{
		//	The date of the Initial Public Offering (IPO) for this MovieStock.  A MovieStock must always have a valid
		//	date of IPO.

		try
		{
				page = this.substring (page, "<td class=\"label\">Delist&nbsp;Date:</td><td>");
				this._dateDateDelisted = new Date (page.substring (0, page.indexOf ("</td>")));

				return page;
		}
		catch (error)
		{
			//	I think the page should always have a date of IPO or date the MovieStock was delisted at this point in the
			//	page source.  I'm not at all sure that either is actually relevant to anything I want to do, so untimately,
			//	this may not be a fatal error condition.  I may be able to ignore it.  But for now...

			throw error + ": delist date";
		}
	}

	extractDateIPO (page)
	{
		//	The date of the Initial Public Offering (IPO) for this MovieStock.  A MovieStock's page should always have a
		//	valid date of IPO or a valid date of delist.

		try
		{
			page = this.substring (page, "<td class=\"label\">IPO&nbsp;Date:</td><td>");
			this._dateIPO = new Date (page.substring (0, page.indexOf ("</td>")));
		}
		catch (error)
		{
			if ((error == "Target string not found within source page") && (this._status == "Inactive"))
			{
				//	I'm not sure, but it seems that the date of IPO or date of delist should appear at this point in
				//	the source page.  So, if the date of IPO was not found AND the film's status in "Inactive", look
				//	for the date that the film was delisted instead.

				this._dateIPO = undefined;
				page = this.extractDateDelisted (page);
			}
			else
				throw error + ": date of IPO";
		}

		return page;
	}

	extractDateReleased (page)
	{
		//	The date the film represented by this MovieStock was released to theaters.  Unlike the date of the IPO, the
		//	release date is not required.  (In real life, the film may still be in a pre-production phase.  It may not
		//	even be certain that the film will actually be made, let alone released to theaters.)
		
		try
		{
			page = this.substring (page, "<td class=\"label\">Release&nbsp;Date:</td><td>");
			const temp = page.substring (0, page.indexOf ("</td>"));
			if (temp != "n/a")
				this._dateReleased = new Date (temp);

			return page;
		}
		catch (error)
		{
			//	As far as I know, the release date is always included in the source page, even if a release date hasn't
			//	been set for the film or the MovieStock is dead delisted.  It may have a value of "n/a" but the page
			//	includes a spot for it.  So this indicates a condition that needs to be resolved.  It may well turn out
			//	that this is an acceptable occurance and not an error after all.  For now...
			throw error + ": release date";
		}
	}

	extractDomesticGross (page)
	{
		//	Not every film has been released into theaters yet, so not all MovieStocks's have a domestic gross.  And
		//	yet, I don't need to determine if this MovieStock should or shoyld not have one.  This is critical data to
		//	HSX's operation, and I can trust them to have the correct data here.
		//
		//	Attempting to convert non-numeric data will throw an error.  I simply need to catch that error.

		this._domesticGross = undefined;		//	let domestic gross defaults to undefined

		try
		{
			page = this.substring (page, "<td class=\"label\">Gross:</td><td>");
			const temp = page.substring (0, page.indexOf ("</td>"));
			if ((temp != "") && (temp != "n/a"))
				this._domesticGross = this.convertToNumber (temp);

			return page;
		}
		catch (error)
		{
			throw "Invalid input (domestic gross): " + page.substring (0, page.indexOf ("</td>"));
		}
	}

	extractGenre (page)
	{
		//	Genre is one of the pieces of data provided by HSX that I have little or no use for.  By nature,
		//	the value of genre is pretty open-ended.  Trying to validate it may simply not be worth it.
		
		page = this.substring (page, "<td class=\"label\">Genre:</td><td>");
		this._genre = page.substring (0, page.indexOf ("</td>"));

		return page;
	}

	extractMPAARating (page)
	{
		//	The MPAA rating is another of the pieces of data provided by HSX that I have little or no use for.  It's
		//	actually well-defined, with only a few allowable values, but like genre, it simply isn'y worth trying to
		//	validate it.
		
		page = this.substring (page, "<td class=\"label\">MPAA Rating:</td><td>");
		this._MPAARating = page.substring (0, page.indexOf ("</td>"));

		return page;
	}

	extractPhase (page)
	{
		page = this.substring (page, "<td class=\"label\">Phase:</td><td>");
		this._phase = page.substring (0, page.indexOf ("</td>"));
		this.isValidPhase (this._phase);

		return page;
	}

	isValidPhase (string)
	{
		if ( [ "Concept", "Development", "Production", "Wrap", "Release" ].indexOf (string) < 0)
			throw "Invalid production phase: " + string;
	}

	extractReleasePattern (page)
	{
		//	Release pattern is needed to calculate the future delist date for films that have not yet delisted.
		//	The delist date is needed to properly calculate the Trailing Average Gross (TAG) of a StarBond, but is
		//	irrelevant for dead delisted MovieStocks and films without a release date assigned.

			try
			{
				page = this.substring (page, "<td class=\"label\">Release&nbsp;Pattern:</td><td>");
				this._releasePattern = page.substring (0, page.indexOf ("</td>"));
				this.isValidReleasePattern (this._releasePattern)
			}
			catch (error)
			{
				//	Release pattern may be omitted from the source page if the MovieStock has been dead delisted.  I'm fairly,
				//	certain it is always included otherwise, even if the value is "n/a".  If release date is not in the source
				//	and the status of the MovieStock is not "Inactive", it's needs to be investigated...

				if (error != "Invalid release pattern")
					throw error;

				if (this._releasePattern.indexOf ("wide") != -1)
					this._releasePattern = "Wide";
				else
					if (this._releasePattern.indexOf ("limited") != -1)
						this._releasePattern = "Limited";
			}

		return page;
	}

	isValidReleasePattern (string)
	{
		if ( [ "Limited", "Modarate", "Wide" ].indexOf (string) < 0)
			throw "Invalid release pattern";
	}

//		calculateDelistDate (date, pattern)
//		{
//	Possibly this method belongs to StarBonds, not MovieStocks
//		}

//		extractStatus (page)
//		{
//			page = this.substring (page, "<td class=\"label\">Status:</td><td>");
//			this._status = page.substring (0, page.indexOf ("</td>"));
//	
//			return page;
//		}

	extractTheaterCount (page)
	{
		page = this.substring (page, "<td class=\"label\">Theaters:</td><td>");
		let temp = page.substring (0, page.indexOf ("</td>"));

		if ((temp != "") && (temp != "n/a"))
			try
			{
				this._theaterCount = this.convertToNumber (temp);
			}
			catch (error)
			{
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
			throw "The selected security (" + this._tickerSymbol + ") is not a MovieStock";
		}

		this._title = temp.substring (0, temp.indexOf (" - MovieStock"));
		return this.substring (page, ("<!--                  Begin: Page Body                      -->"));
	}


	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//	Getter methods

	getNextStarBond (last = null)
	{
		if (last == null)
			return this._attachedStarBonds[0];

		const index = this.getStarBondIndex (last);
		if (index < this._attachedStarBonds.length)
			return this._attachedStarBonds[index + 1];

		return false;
	}

	getStarBondIndex (target)
	{
		return this._attachedStarBonds.findIndex (sb => sb.ticker == target );
	}
}