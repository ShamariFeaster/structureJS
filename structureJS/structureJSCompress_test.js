structureJS.module({name: 'structureJSCompress', type : 'Utility'}, function(require){
  //console.log(structureJS._exportOrder);
  var combinedSrc = '';
  var moduleBase = structureJS.config.module_base;
  var globalBase = structureJS.config.global_base;
  var exports = structureJS.uglifyFiles.split(',');
  var wholeProject = structureJS._exportOrder;
  var indexes = {};
  var exportList = {};
  var thisGroup = null;
  var exportProject = false;
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
  
  for(var i = 0; i < exports.length; i++){
    if(exports[i] == '*'){
      exportProject = true;
      exports = wholeProject;
      exports.shift();//take uglify off the front
    }
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
        /*Output to console*/
        console.log('----- ' + listName + '----- ');
        console.log(exportList[listName].output);
        
        /*output to DOM*/
        var outputTag = document.getElementById(structureJS.options.minified_output_tag_id);
        if(outputTag)
          outputTag.innerText += '----- ' + listName + '-----\n\n' + exportList[listName].output + '\n\n';
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
  
  /*Project Exportation*/
  function combineProjectSrcFiles(fileName){
    function callback(){
      combinedSrc += compress(this.responseText);
      var nextFile = exports.shift();
      //console.log('Next: ' + nextFile);
      if(nextFile)
        getProjectSrc( nextFile, callback);
      else{
        
        /*Output to console*/
        console.log(1, combinedSrc);
        
        /*output to DOM*/
        var outputTag = document.getElementById(structureJS.options.minified_output_tag_id);
        if(outputTag)
          outputTag.innerText = combinedSrc;
        
        /*Download compressed file*/
        if(structureJS.options.download_minified == true)
          location.href = "data:application/octet-stream," + encodeURIComponent(combinedSrc);        
        
        //window.open('http://localhost/structureJS/structureJS/export.html?exports=' + combinedSrc);    
      }
    }
    if(fileName)
      getProjectSrc(fileName, callback);
  }
  
  function getProjectSrc(fileName, callback){
    //console.log('Getting: ' + fileName);
    var xhr = new XMLHttpRequest();
    xhr.onload = callback;
    xhr.open('get',  fileName, true);
    xhr.send();
  }
  
  /*Driver*/
  if(exportProject == true){
    if(structureJS.hasRemotes == false)
      combineProjectSrcFiles( structureJS.config.structureJS_base + '/structureJS.js' );
    else{
      throw 'Error: Cannot minify because you are using remote files in the project'; 
    }
  }else{
    for(var name in exportList){
      combineSrcFiles( name );
    }
  }
  
  
  
  return {};
});