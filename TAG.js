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
{	event.preventDefault();
	const parent = event.target.parentElement;
	const ticker = parent.querySelector ("input").value
	if (ticker == "")
	{
		//	This is an error condition.  Nothing can be done without a valid ticker symbol.

		alert ("Please enter a valid ticker symbol");
		event.target.focus();
		return;
	}

//		const section = getSection ("moviestock-section");
//		displayMovieStockSection(section);
	const section = getMovieStockSection();
	appendNewMovieStockDiv(section, ticker);

	const movie = new MovieStock;
	movie.fetch (ticker)
//		.then (page => { section.innerText = JSON.stringify (page) } )
	.then (page => { getStarBondSection().innerText = JSON.stringify (page) } )
	.catch (error => { alert (error) } )
}

function getMovieStockSection ()
{
	return getSection ("moviestock-section");
}

function appendNewMovieStockDiv (s, t)
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

	s.append (div);
}

//	function displayMovieStockSection (s)
//	{
//		s.classList.remove ("hidden");
//	}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//	Fetch a StarBond
//

function getStarBondSection ()
{
	return getSection ("starbond-section");
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
