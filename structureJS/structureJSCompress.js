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
  var fileName = '';
  /* '.' DOES NOT match newlines, so here's the workaround */
  var deploymentRegex = /\/\*@StartDeploymentRemove\*\/[\S\s]*?\/\*@EndDeploymentRemove\*\//g;
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
  var files = [];
  var compressFlg = true;
  /*indexes are counters indexed on group name*/
  for(var i = 0; i < exports.length; i++){
    /*fileName could be soft group name*/
    
    compressFlg = true;
    if(/\-u$/.test(exports[i]) == true){
        exports[i] = exports[i].replace(/\-u$/,'');
        compressFlg = false;
      }
    fileName = exports[i].trim();
    indexes[fileName] = 0;
    thisGroup = structureJS[fileName];
    files = [];
    if(typeof thisGroup == 'undefined'){
      
      
      files.push( fileName + '.js');
      var exportObj = {name : fileName, files : files, output : '', compress : compressFlg};
      exportList[exportObj.name] = exportObj;
    }else{
    
      for(var file in thisGroup._needTree){
        files.push(moduleBase + file + '.js');
      }
      var exportObj = {name : fileName, files : files, output : '', compress : compressFlg};
      exportList[fileName] = exportObj;

    }
    
    
  }
  
  for(var i = 0; i < exports.length; i++){

    if(exports[i].trim() == '*'){
      exportProject = true;
      exports = wholeProject;
      exports.shift();//take uglify off the front
      break;
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
    var tempOutput = '';
    function callback(){
      
      if(indexes[listName]++ < exportList[listName].files.length){
        getSrc( exportList[listName], callback);

        
        tempOutput = '\n' + this.responseText;
        if(exportList[listName].compress == true)
          tempOutput = compress(this.responseText);
        
        //look at the scope of the xhr request for more info
        exportList[listName].output += tempOutput;  
        indexes[listName];
      }
      /*note the postfix incrementation. I am able to detect completion, yet not
      index out of bounds b/c of this. By checking for OOB here I am able to 
      detect completion*/
      if(indexes[listName] == exportList[listName].files.length){
        console.log(listName + ' Done'); 
        /*Output to console*/
        console.log('----- ' + listName + '----- ');
        console.log(exportList[listName].output);
        
        /*output to DOM*/
        var outputTag = document.getElementById(structureJS.options.minified_output_tag_id);
        if(outputTag)
          outputTag.innerHTML += '----- ' + listName + '-----<br>' 
                              + processFileOutput( exportList[listName].output ) + '<br><br>';
        
        /*Should make this configurable b/c people hate popups*/
        window.open('http://localhost/structureJS/structureJS/export.html?exports=' + processFileOutput( exportList[listName].output) );
      }

    }

    if(exportList[listName]){
      getSrc(exportList[listName], callback);
    }
  }
  
  function getSrc(obj, callback){

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
      var text = this.responseText;
      /*this.onload.fileName is myself but with state data attached by my calling
      function. This may be a better way to handle the synchronization & separation 
      I use on group exports*/
      if(this.onload.fileName == structureJS.config.structureJS_base +structureJS.NAME+'.js' ){
        console.log('PROCESSIG DEPLOY VERSION');
        text = text.replace(deploymentRegex,'');
      }
      combinedSrc += compress(text);
      var nextFile = exports.shift();

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
    var xhr = new XMLHttpRequest();
    xhr.onload = callback;
    /*Super sweet way of attaching per-call data to callback function
    to give each callback a state*/
    xhr.onload.fileName = fileName;
    xhr.open('get',  fileName, true);
    xhr.send();
  }
  
  /*Driver*/
  if(exportProject == true){
    if(structureJS.hasRemotes == false)
      combineProjectSrcFiles( structureJS.config.structureJS_base +structureJS.NAME+'.js' );
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