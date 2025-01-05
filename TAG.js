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
	if (section.querySelector ("#" + ticker) != undefined)
		alert (ticker + " is duplicated");
	else
	{
//			appendNewMovieStockDiv(section, ticker);
		addNewMovieStockDiv(section, ticker);

		const movie = new MovieStock;
		movie.fetch (ticker)
		.then (page =>
		{
			appendStarBonds (movie);

			const div = document.createElement ("div");
			div.innerText = JSON.stringify (page);
			document.getElementById ("starbond-section").append (div);

		} )
		.catch (error =>
		{
			//	Indicate any fatal errors (serious enough that the script couldn't, or perhaps shouldn't continue
			//	scraping data) that occur while  processing a MovieStock.  For the time being, the error test is
			//	conveyed as the title property of the element representing the MovieStock.  Perhaps the error text
			//	should replace the MovieStock's title?
			
			const div = document.getElementById (ticker);
			div.classList.add ("error");
			div.title = error;
		} )
	}
}

function getMovieStockSection ()
{
	return getSection ("moviestock-section");
}

//	function appendNewMovieStockDiv (s, t)
function addNewMovieStockDiv (s, t)
{
	const div = document.createElement ("div");
	div.classList.add ("moviestock");
	div.setAttribute ("id", t);

	const input = document.createElement ("input");
	input.title = "The total gross domestic box office when " + t + " is delisted";
	div.append (input);

	const ticker = document.createElement ("div");
	ticker.innerText = t;
	div.append (ticker);

	const title = document.createElement ("div");
	title.setAttribute ("id", "title");
	div.append (title);

	insertSecurity (s, t, div);
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
		if (item.getAttribute ("id") > ticker)
		{
			parent.insertBefore (div, item);
			done = true;
			break;
		}
	}

	if (!done)
		parent.append (div);
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
