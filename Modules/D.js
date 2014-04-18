structureJS.module('D', function(require){
    var blah = require('C');
    setTimeout(function(){
     console.log(structureJS.cache('test'));
     document.getElementById('test').innerText = 'D is loaded';
    }, 1500);
      
   
    
    return {};
});  