/*For chrome extensions you will need to have 'unsafe-eval' set in your content
security policy*/

structureJS.module({name: 'structureJSCompress', type : 'Utility'}, function(require){
  
  var combinedSrc = '';
  var moduleBase = structureJS.config.module_base;
  var globalBase = structureJS.config.global_base;
  var exports = structureJS._exportOrder;
  exports.unshift('../structureJS/structureJS.js');
  console.log('INSIDE');
  console.log(structureJS._exportOrder);
  function getFileName(input){
    var fileName = null;
    if(typeof input != 'undefined' && typeof input === 'object')
      fileName = moduleBase + Object.keys(input)[0] + '.js';
    if(typeof input != 'undefined' && typeof input === 'string')
      fileName = globalBase + input + '.js';
    return fileName;
  }
  
  
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
  
  
  function combineSrcFiles(fileName){
    function callback(){
      combinedSrc += compress(this.responseText);
      var nextFile = getFileName( exports.shift() );
      //console.log('Next: ' + nextFile);
      if(nextFile)
        getSrc( nextFile, callback);
      else{
        console.log(combinedSrc);
        /*Download compressed file*/
        location.href = "data:application/octet-stream," + encodeURIComponent(combinedSrc);        
      }
    }
    console.log('Getting: ' + fileName);
    if(fileName)
      getSrc(fileName, callback);
  }
  
  function getSrc(fileName, callback){
    
    var xhr = new XMLHttpRequest();
    xhr.onload = callback;
    xhr.open('get',  fileName, true);
    xhr.send();
  }
  //console.log( getFileName(exports.shift()) );
  combineSrcFiles( getFileName(exports.shift()) );
  
});