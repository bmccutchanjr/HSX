//	MovieStock is used to fetch a MovieStock from HSX.COM.  A MovieStock is a virtual security representing an actual
//	film.

class MovieStock extends Fetch
{
	constructor ()
	{
		super();			//	invoke the constructor of the parent class

		//	Everything defaults to undefined...

		this._attachedStarBonds = [];
		this._dateDelisted = undefined;
		this._dateIPO = undefined;
		this._dateReleased = undefined;
		this._domesticGross = undefined;
		this._genre = undefined;
		this._MPAARating = undefined;
		this._phase = undefined;
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
				this.extractData (page);

				//	If I don't resolve something, the Promise that was returned will never be fulfilled.  The
				//	invoking method or function will wait forever and nothing will be done with the data that's
				//	been collected.
				//
				//	There are several properties, and no one function will need them all.  Seems better to resolve
				//	true or false (I don't resolve false at this time) to fulfill the Promise and let the invoking
				//	function know if a non-fatal error occured.

				resolve (true);
			} )
			.catch (error => { reject (error) } )			
		})
	}

	extractData (page)
	{
		//	Extract the data I want from the page.  Functions that actually scrape each piece of data return
		//	the source page with the code for that data removed.   It should go without saying that the data must
		//	be extracted in the order it's coded in the page.

		page = this.extractTitle (page, "MovieStock");		//	The title of the movie
		page = this.extractStatus (page);					//	a method of the parent (super) class
		page = this.extractDateIPO (page);
		page = this.extractGenre (page);
		page = this.extractMPAARating (page);
		page = this.extractPhase(page);
		page = this.extractDateReleased (page);
		page = this.extractReleasePattern (page);

		if (this._dateReleased != undefined)
		{
			//	It should go without saying, but if a film hasn't been in a theater, it can't have
			//	earned any money at the box office.  The source page may omit domestic gross and
			//	theater count for the associated MovieStock.
			//
			//	It is actually not unusual for the page to include a theater count for films that have not yet
			//	been in theaters.  If the distributor has set a release date, they know (or have a very idea) how
			//	many theaters it will be in, especially as the release dat approaches.  They may or may not report
			//	that number ahead of the release.  If the theater count is made public, HSX will include it on the
			//	MovieStock page.
			//
			//	But I'm not using theater count for anything at this time, so leaving it like this doesn't hurt
			//	anything.

			page = this.extractDomesticGross (page);
			page = this.extractTheaterCount (page);
		}

		page = this.extractAttachedStarBonds (page);
		page = this.extractSharePrice (page);
		page = this.extractSharesHeldLong (page);
		page = this.extractSharesHeldShort (page);
		page = this.extractSharesTraded (page);

//			return page;
	}

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//	Functions to extract specific bits of data from the page.  These functions are in alphabetical order, to make
	//	it easier to find them.
	//

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
				this._dateDelisted = new Date (page.substring (0, page.indexOf ("</td>")));

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
		
		try
		{
			page = this.substring (page, "<td class=\"label\">Genre:</td><td>");
			this._genre = page.substring (0, page.indexOf ("</td>"));

			return page;
		}
		catch (error)
		{
			throw error + ": genre";
		}
	}

	extractMPAARating (page)
	{
		//	The MPAA rating is another of the pieces of data provided by HSX that I have little or no use for.  It's
		//	actually well-defined, with only a few allowable values, but like genre, it simply isn'y worth trying to
		//	validate it.
		
		try
		{
			page = this.substring (page, "<td class=\"label\">MPAA Rating:</td><td>");
			this._MPAARating = page.substring (0, page.indexOf ("</td>"));

			return page;
		}
		catch (error)
		{
			throw error + ": MPAA rating";
		}
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
				this._releasePattern = page.substring (0, page.indexOf ("</td>")).toLowerCase();
				this.isValidReleasePattern (this._releasePattern)
			}
			catch (error)
			{
				//	Release pattern may be omitted from the source page.  For instance: if the MovieStock has been
				//	delisted or a release date has not been set.  I need a release pattern to calculate the date a
				//	MovieStock will delist for some few TAG calculations.  But for the vast majority release pattern
				//	is irrelevant, and I can't make that determination here.  For those few where it counts,
				//	I can catch the error better somewhere else.

				if (error != "Target string not found within source page")
				{
					if (error != "Invalid release pattern")
						throw error;

					if (this._releasePattern.indexOf ("wide") != -1)
					{
						this._releasePattern = "wide";
						return page;
					}

					if (this._releasePattern.indexOf ("limited") != -1)
					{
						this._releasePattern = "limited";
						return page;
					}

					throw error + ": release pattern";
				}
			}

		return page;
	}

	isValidReleasePattern (string)
	{
		if ( [ "limited", "modarate", "wide" ].indexOf (string) < 0)
			throw "Invalid release pattern";
	}

//		calculateDelistDate (date, pattern)
//		{
//	Possibly this method belongs to StarBonds, not MovieStocks
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
		const index = this.getStarBondIndex (last);
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
	//	Methods to retrieve data from this object.  Not all of these methods are technically 'getter' methods because
	//	some of the data to be retrieved (next StarBond) is not a property.
	//

	get dateReleased () { return this._dateReleased; }

	get domesticGross () { return this._domesticGross; }

	get status () { return this._status; }

	get title () { return this._title; }

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

	hasAttachedStarBonds ()
	{
		//	Return true or false depending on the length of this._attachedStarBonds[].  It should go without saying, but
		//	if a MovieStock has no attached StarBonds, no StarBonds will be adjusted when the MovieStock is delisted.

		if (this._attachedStarBonds.length == 0) return false;
		return true;
	}

	inTheaters ()
	{
		//	Return true or false depending on whether the film represented by this MovieStock is currently in theaters.
		//
		//	For purposes of this application, a film is in theaters is this._status != "Inactive", the MovieStock has a
		//	release date and that date is earlier than today's date.

		if (this._status == "Inactive") return false;
		if (this._dateReleased == undefined) return false;
		if (this._dateReleased > new Date ()) return false;
		return true;
	}
}