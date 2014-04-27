structureJS.module({name : 'queueOnload', 
                    description : 'attach other module functions to window onload event'
                    }, 
function(require){
  var _functions = [];
  
  /*FIFO function execution*/
  function executeStack(){
    var funcObj = null;
    for(var i = 0; i < _functions.length; i++){
      funcObj = _functions[i];
      funcObj['func'].apply(null, funcObj['args'] );
    }
  };
  /*bind function to onload event*/
  window.onload = executeStack;
  
  return {
  
    bind : function(func, args){
      var funcObj = {};
      var args = args || [];
      var func = func || function(){};
      funcObj.func = func;
      funcObj.args = args;
      _functions.push(funcObj);
    }
    
  };
});