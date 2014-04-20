structureJS.module({name: 'structureJSCompress', type : 'Utility'}, function(require){
  //console.log(structureJS._exportOrder);
  var combinedSrc = '';
  var moduleBase = structureJS.config.module_base;
  var globalBase = structureJS.config.global_base;
  var exports = structureJS.uglifyFiles.split(',');
  var indexes = {};
  var exportList = {};
  var thisGroup = null;
  /*Configure
    tab : spaces | \t
    newlines : \n | \r\n
  */

  function compress(input){
    var toplevel = UglifyJS.parse(input);
    toplevel.figure_out_scope();
    var compressor = UglifyJS.Compressor();
    var compressed_ast = toplevel.transform(compressor);
    compressed_ast.figure_out_scope();
    compressed_ast.compute_char_frequency();
    compressed_ast.mangle_names();
    return compressed_ast.print_to_string();
  }
  /*indexes are counters indexed on group name
  TODO: Check if soft-group then load up
        Check for '*' which will make this act like original structureJSCompress
  
  */
  for(var i = 0; i < exports.length; i++){
    indexes[exports[i]] = 0;
    var files = [];
    files.push(exports[i] + '.js');
    var exportObj = {name : exports[i], files : files, output : ''};
    exportList[exportObj.name] = exportObj;
    
  }
  
  function processFileOutput(input){
    return input.replace(/\n/g,'<br>').replace(/  /g,'&nbsp&nbsp&nbsp&nbsp');
  }
  /*The scoping on this is INSANE. I honestly don't even understand why it works 
  this way but it does. The callback executes in the context of the xhr request
  but it has access to the scope of the originating function (combineSrcFiles)
  so listName stays the same through the whole sequence of xhr requests on
  a group's files array. This allows me to index on exportList and, more importantly,
  indexes. This is what creates the separation of the outputs. The synchonization
  is achieved     Because the scopes of combineSrcFiles and the module
  remain stable through my execution I am able to separate and synchonize the
  output from sequential, but interleaving, calls to getSrc.  */
  function combineSrcFiles(listName){
    
    function callback(){

      if(indexes[listName]++ < exportList[listName].files.length){
        getSrc( exportList[listName], callback);
        console.log('WRITTIGN ' + listName);
        //console.log(this);
        //look at the scope of the xhr request for more info
        exportList[listName].output += compress(this.responseText);
        indexes[listName];
      }
      /*note the postfix incrementation. I am able to detect completion, yet not
      index out of bounds b/c of this. By checking for OOB here I am able to 
      detect completion*/
      if(indexes[listName] == exportList[listName].files.length){
        console.log(listName + ' Done'); 
        //document.write(exportList[listName].output);
        window.open('http://localhost/structureJS/structureJS/export.html?exports=' + exportList[listName].output);
      }

    }
    console.log(exportList[listName]);
    if(exportList[listName]){
      getSrc(exportList[listName], callback);
    }
  }
  
  function getSrc(obj, callback){
    console.log('Getting: ' + obj.name);
    var xhr = new XMLHttpRequest();
    xhr.onload = callback;
    if(indexes[obj.name] < obj.files.length){
      xhr.open('get',  obj.files[indexes[obj.name]], true);
      xhr.send();
    }
    
  }
  console.log(exportList)
  /*In a way I am kindof spawning and tagging x threads with a group name*/
  for(var name in exportList){
    combineSrcFiles( name );
  }
  
  
  return {};
});