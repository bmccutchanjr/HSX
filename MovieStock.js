//	MovieStock is used to fetch a MovieStock from HSX.COM.  A MovieStock is a virtual security representing an actual
//	film.

class MovieStock extends Fetch
{
	#_title = undefined;

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
			this.fetchPage ("security/view/" + ticker)
			.then (response => { resolve (response) } )			
			.catch (error => { reject (error) } )			
		})
	}
}