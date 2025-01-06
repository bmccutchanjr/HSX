//	Fetch is the parent class of several other classes (maybe as many as five), and is not meant to be instantiated
//	directly.  Its has properties and methods (fetch a page, parse data from the page, etc.) that are required by 
//	more than one of its children...why write the code two, three or four time?

class Fetch
{
	constructor ()
	{
		//	Initialize those properties that are common to MovieStocks and StarBonds.  

		this._sharePrice = undefined;
		this._sharesHeldLong = undefined;
		this._sharesHeldShort = undefined;
		this._sharesTraded = undefined;
		this._status = undefined;
	}

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	fetchPage (what)
	{
		//	Fetch the specified page from HSX.COM.  Because this is an asynchronous operation the method returns a
		//	Promise.

//	fetchPage () should be a private method,  It must be public, because I want to invoke it from a subclass and private
//	methods are not inherited, it has to be public.  So what's the point of inheritance and encapsulation if one
//	violates the other?
//
//	I have since learned that private methods are unique to the instance...i.e.  a new copy of the method is created
//	with each instance.  This is not true of public methods.  Public methods are shared across all instances of the
//	class, but with their own scope and address space -- in other words reentrant, just like every other function
//	in JavaScript.  So why are private methods different?
//
//	The answer is:  JavaScript does not have classes.  In the words of mozilla.org, "classes are syntax sugar over
//	constructor functions".  Apparently any function can be 'instantiated' simply by calling 'new'.  This invokes the
//	inherent constructor and allows the function to access its prototype.  And that's all a JavaScript class is, new
//	syntax for something JavaScript could already do -- not new functionality.

		return new Promise ((resolve, reject) =>
		{
			fetch ("https://www.hsx.com/" + what)
			.then (response => { return response.text() } )
			.then (data => { resolve (data) } )
			.catch (error => { reject (error) } )
		} )
	}

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//	Methods to extract data shared by MovieStocks and Starbonds (status, current price, shares traded, etc.)
	//	

	extractSharePrice (page)
	{
		//	It's possible that the target text denoting the current price can appear in an unrelated context, earlier
		//	in the source.  Remove any unrelated code that comes before the security summary, to be sure I actually get
		//	what I'm after.

		page = this.substring (page, "<div class=\"security_summary\"");
		page = this.substring (page, "H$");
		this._sharePrice = page.substring (0, page.indexOf ("\r\n"));

		return page;
	}

	extractSharesHeldLong (page)
	{
		page = this.substring (page, "Shares Held Long on HSX: <span style=\"text-align: right; color: #333;\">");
		const temp = page.substring (0, page.indexOf ("</span"));
		this._sharesHeldLong = this.convertToNumber (temp);

		return page;
	}

	extractSharesHeldShort (page)
	{
		page = this.substring (page, "Shares Held Short on HSX: <span style=\"text-align: right; color: #333;\">");
		const temp = page.substring (0, page.indexOf ("</span"));
		this._sharesHeldShort = this.convertToNumber (temp);

		return page;
	}

	extractSharesTraded (page)
	{
		page = this.substring (page, "Trading Volume on HSX (Today): <span style=\"text-align: right; color: #333;\">");
		const temp = page.substring (0, page.indexOf ("</span"));
		this._sharesTraded = this.convertToNumber (temp);

		return page;
	}

	extractStatus (page)
	{
		page = this.substring (page, "<td class=\"label\">Status:</td><td>");
		this._status = page.substring (0, page.indexOf ("</td>"));

		return page;
	}

	isValidStatus (string)
	{
		//	Is the provided string found in an array of acceptable values?  Return true or false... 

		if (["Active", "Halted", "Inactive"].indexOf (string) < 0)
			return false;
		else
			return true; 
	}

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//	miscellaneous methods
	//	

	substring (source, target)
	{
		//	Search the provided source string for the target.  Remove any and all text from the source string that preseded
		//	the target (including the target) and retrun that value.  If the target substring is not found, return false.

		const index = source.indexOf (target);
		if (index < 0)
			throw "Target string not found within source page";
		else
			return (source.substring (index + target.length));
	}

	convertToNumber (string)
	{
		//	HSX displays nummeric values with characters (dollar signs and commas) that cause JavaScript to be
		//	unable to convert the string to a number.  At the very least, these characters need to be stripped
		//	before converting to a number.

		string = string.replaceAll ("$", "");
		string = string.replaceAll (",", "");
		return string * 1;
	}
}