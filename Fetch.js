//	Fetch is the parent class of several other classes (maybe as many as five), and as such is not meant to be
//	instantiated directly.  Its methods provide basic functionality (fetch a page, parse data from the page, etc.)
//	that is required in each of its children.

class Fetch
{
	#_page = undefined;

	constructor ()
	{
		//	Class constructors cannot return a value, and that means there is very little this can do.

		this.#_page = undefined;
	}

//		#fetchPage (what)
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

	substring (source, target)
	{
		//	Search the provided source string for the target.  Remove any and all text from the source string that preseded
		//	the target (including the target) and retrun that value.  If the target substring is not found, return false.

		const index = source.indexOf (target);
		if (index < 0) return false;
		else
			return (source.substring (index + target.length))
	}
}