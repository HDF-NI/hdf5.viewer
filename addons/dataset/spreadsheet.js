var os = require("os");


module.exports.load = function *(leaf, dataset) {
    return { 
        multiview: true,
        xpath: "*",
        title: "Spread Sheet",
        body: '<div id="table-spreadsheet"><iframe src="http://'+os.hostname()+':8000/_new"/><script></script></div>'
    
    };
};
