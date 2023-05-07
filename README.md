# Professor-Class Matching

### How to add custom CSS

1. Add your CSS rules to `mystyle.scss`
2. Import the modified Bulma parts at the bottom of `mystyle.scss`
3. Run this command: `sass --no-source-map mystyle.scss static\css\mystyle.css`
	- This creates the `static/css/mystyle.css` file which can now be imported in HTML files
4. In your HTML page, add `<link  rel="stylesheet"  href="mystyle.css">`