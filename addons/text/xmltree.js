

module.exports.load = function (leaf, document) {
    return { 
        multiview: true,
        title: "Tree",
        xpath: "*",
        extension: ".xml",
        body: '<div id="xmltree"><script src="js/jstree.min.js"></script><script type="text/javascript" src="js/xmltree.js"></script></div>'
    
    };
};

