
        $('#xmltree').jstree(xmlToJsTree(document.getElementById('h5-text').textContent));

function xmlToJsTree( xml ) {

	/* This private function is called on each XML node to convert it into a jsTree
	compatible JSON object */
	var _node = function( node ) {
		var _text = $( node ).prop( "tagName" );
		var _children = [];
		var _selected = false;

		/* If the current XML node has children, we should loop through those
		children as well and add the resulting JSON objects to our current
		node's "children" array */
		$( node ).children().each( function() {
			_children.push( _node( $( this ) ) );
		});

		/* We return the current XML node as converted JSON */
		return {
			text: _text,
			children: _children,
			state: {
				selected: _selected
			} 
		};
	};

	/* This returned object is for a new jsTree instance. It sets visual settings
	for the jsTree, but also sets the JSON object to use as the tree's data source.
	This JSON object is constructed using the private "_node" function, which converts
	XML nodes into JSON objects, starting with the root node. */
	return {
		core: {
			data: _node( $( xml ) ),
			animation: false,
			themes: {
				icons: false
			},
			multiple: true,
			expand_selected_onload: true
		}
	};
}

