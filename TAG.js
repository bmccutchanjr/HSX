//	When HSX delists a MovieStock, the value of the attached StarBonds are computed based on the average gross box
//	office receipts of the last 5 films that indivisual was credited in.  These are predictable changes, since the
//	box office receipts of each movie is known.  The average can be calculated days, even weeks, in advance with
//	a reasonable assurance of accuracy.
//
//	The app retrieves the attached StarBonds for a given MovieStock and calculates the new TAG (Trailing Average
//	Gross) for those StarBonds.

window.addEventListener ("load", event =>
	{
		const t = document.getElementById ("ticker-symbol");
		t.addEventListener ("blur", event => { handleTickerBlur (event); } );
		t.addEventListener ("focus", event => { handleTickerFocus (event); } );
		t.focus();

		document.getElementById ("fetch-button").addEventListener ("click", event => { fetchMovieStock (event) } );
	} )

function handleTickerBlur (event)
{	event.preventDefault();
	event.target.value = event.target.value.toUpperCase();
}

function handleTickerFocus (event)
{	event.preventDefault();
	event.target.select();
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//	Fetch a MovieStock
//

function fetchMovieStock (event)
{
//	This function may be generic enough to put it in the super class.  Could any code that truly is specific to either a
//	MovieStock or StarBond could be handled with a callback?  Is there any code truly specific to MovieStock or a
//	StarBond?  Resolve this when coding the StarBond class.

	event.preventDefault();
	const parent = event.target.parentElement;
	const ticker = parent.querySelector ("input").value
	if (ticker == "")
	{
		//	This is an error condition.  Nothing can be done without a valid ticker symbol.

		alert ("Please enter a valid ticker symbol");
		event.target.focus();
		return;
	}

	const section = getMovieStockSection();
//		if (section.querySelector ("#" + ticker) != undefined)
	if (section.querySelector ("#" + id (ticker)) != undefined)
		alert (ticker + " is duplicated");
	else
	{
		const mDiv = addNewMovieStockDiv(section, ticker);

		const movie = new MovieStock;
		movie.fetch (ticker)
		.then (noErrorsFound =>
		{
			//	There are fatal errors that cannot be caught in MovieStock.js because that class doen't know how
			//	the data will be used.
			//
			//	For instance, it's perfectly acceptable for a MovieStock to be "Inactive" but that MovieStock
			//	can't be in theaters and about to delist.  The attached StarBonds won't be adjusted.  There's no
			//	point in continuing with the MovieStock.

			if (movie.status == "Inactive")
				throw "This MovieStock is inactive and not available to delist";

//	This is okay for now, but some day I may have enough money that holding StarBonds that won't adjust for six or even
//	nine months makes sense.  Or I may reset my account and start from scratch.
			if (invalidReleaseDate (movie))
				throw "This film has not been in theaters and its MovieStock is not available to delist";

			if (!movie.hasAttachedStarBonds())
				throw "There are no StarBonds attached to this MovieStock";

			if (movie.inTheaters() && (movie.domesticGross == undefined))
					throw "This film is not reporting earnings.  StarBonds may be detached and not adjust";

			//	Once the Promise is fulfilled and I have all of the available data for a given MovieStock, I want
			//	to update the <div> created to represent that data.  At the very last, I want to get the title of the
			//	film on the screen (or an error message, should movie.fetch() return false.). 

			if (noErrorsFound)
			{
				updateCurrentPrice (mDiv, movie.sharePrice);
				updateFilmTitle (mDiv, movie.title);
			}
			else
			{
				mDiv.classList.add ("error");
				updateFilmTitle (mDiv, movie.error);
			}

			appendStarBonds (movie);
		} )
		.catch (error =>
		{
			//	Indicate any fatal errors (serious enough that the script couldn't, or perhaps shouldn't continue
			//	scraping data) that occur while  processing a MovieStock.  For the time being, the error test is
			//	conveyed as the title property of the element representing the MovieStock.  Perhaps the error text
			//	should replace the MovieStock's title?
			
			mDiv.classList.add ("error");
			updateFilmTitle (mDiv, error);

			setTimeout ( _ => { removeMovieStock (section, div) }, 30000 );
		} )
	}
}

function removeMovieStock (section, div)
{
	section.removeChild (div);
}

function invalidReleaseDate (movie)
{
	//	If a film does not have a release date, or if that release date is in the future, it hasn't been in theaters.
	//	The MovieStock will not be delisted.  The StarBonds attached to the MovieStock will not be adjusted.

	if (movie.dateReleased == undefined) return true;
	if (new Date () < new Date (movie.dateReleased)) return true;

	return false;
}

function addNewMovieStockDiv (s, t)
{
	const div = document.createElement ("div");
	div.classList.add ("moviestock");
	div.classList.add ("security");
	div.setAttribute ("id", id (t));
	const input = document.createElement ("input");
	input.setAttribute ("disabled", true);
	input.setAttribute ("id", "current-price");
	input.title = "The total gross domestic box office when " + t + " is delisted";
	div.append (input);

	const ticker = document.createElement ("div");
	ticker.classList.add ("ticker");
	ticker.innerText = t;
	div.append (ticker);

	const title = document.createElement ("div");
	title.classList.add ("grow");
	title.setAttribute ("id", "title");
	div.append (title);

	insertSecurity (s, t, div);

	return div;
}

function getMovieStockSection ()
{
	return getSection ("moviestock-section");
}

function insertSecurity (parent, ticker, div)
{
	//	Add the specified DOM element to the children of the specified parent container so the list of
	//	children will appear in alphabetical order.  This is done by iterating the children of parent and comparing
	//	ticker to the id attribute of each child element (each element added to parent has id attribure set to its
	//	ticker).  insertBefore() is used to add the new elwment before the indicated element.

	let done = false;

	const collection = parent.children;
	for (let i=0; i<collection.length; i++)
	{
		const item = collection.item(i);
		if (item.getAttribute ("id") > id (ticker))
		{
			parent.insertBefore (div, item);
			done = true;
			break;
		}
	}

	if (!done)
		parent.append (div);
}

function updateCurrentPrice (div, price)
{
	//	Update the indicated <div> with the share price extracted from HSX.

	const input = div.querySelector ("#current-price");
	input.value = price;
	input.removeAttribute ("disabled");
}

function updateFilmTitle (mDiv, text)
{
	//	Update the div#title of the container identified with id = ticker.

	mDiv.querySelector ("#title").innerText = text;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//	Fetch a StarBond
//

function getStarBondSection ()
{
	const main = document.getElementsByTagName ("main")[0];

	let section = document.getElementById ("starbond-section");
	if (section != undefined)
		main.removeChild (section);

	section = document.createElement ("section");
	section.setAttribute ("id", "starbond-section");
	main.append (section);

	return section;
}

const bonds = [];

function appendStarBonds (movie)
{
	let sBond = movie.getNextStarBond ();
	while (sBond)
	{
		bonds.push (sBond);
		sBond = movie.getNextStarBond (sBond.ticker);
	}

	const section = getStarBondSection();
	bonds.forEach (s =>
	{
		const div = document.createElement ("div");
		div.classList.add ("starbond");
		div.classList.add ("security");
		div.innerText = s.name;
		section.append (div);
	} )
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//	miscellaneous
//

function getSection (id)
{
	let section = document.getElementById (id);
	if (section == undefined)
	{
		section = document.createElement ("section");
		section.setAttribute ("id", id);
		document.getElementsByTagName ("main")[0].append (section);
	}

	return section;
}

function id (ticker)
{
	//	Some ticker symbols begin with a numreal (6TRP8, for example) which is not a valid CSS id.  Ruturn a
	//	valid CSS id by concatenating an arbitrary string with the HSX ticker symbol.

	return "t-" + ticker;
}
