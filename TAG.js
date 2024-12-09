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
	const t = event.target.value;
	if (t == "")
	{
		//	This is an error condition.  Nothing can be done without a valid ticker symbol.

		alert ("Please enter a valid ticker symbol");
		event.target.focus();
		return;
	}

	
}