structureJS.module('D', function(require){
    var blah = require('C');
    console.log(structureJS.cache('test'));
    return {};
});  