structureJS.module({name: 'structureJSexport', type : 'Utility'}, function(require){
  //console.log(structureJS._exportOrder);
  var combinedSrc = '';
  var moduleBase = structureJS.config.module_base;
  var globalBase = structureJS.config.global_base;
  var exports = structureJS.exportFiles.split(',');
  var indexes = {};
  var exportList = {};
  var thisGroup = null;
  //exports.shift();//take uglify off the front
  for(var i = 0; i < exports.length; i++){
    thisGroup = structureJS[exports[i]];
    indexes[exports[i]] = 0;

    if(typeof thisGroup != 'undefined'){
      var files = [];
      for(var file in thisGroup._needTree){
        files.push(moduleBase + file + '.js');
      }
      var exportObj = {name : exports[i], files : files, output : ''};
      exportList[exportObj.name] = exportObj;
    }
  }
  
  function processFileOutput(input){
    return input.replace(/\n/g,'<br>').replace(/  /g,'&nbsp&nbsp&nbsp&nbsp');
  }

  function combineSrcFiles(listName){
    
    function callback(){
      
      //console.log(this.responseText);
      //var nextFile = exportList[listName].files[indexes[listName]];
      //indexes[listName] = indexes[listName] + 1;
      //console.log('Next: ' + nextFile);
      if(indexes[listName]++ < exportList[listName].files.length){
        getSrc( exportList[listName], callback);
        console.log('WRITTIGN ' + listName);
        exportList[listName].output += processFileOutput('\n\n' + this.responseText);
        //document.write();
        indexes[listName];
      }

      if(indexes[listName] == exportList[listName].files.length){
        console.log(listName + ' Done'); 
        document.write(exportList[listName].output);
        window.open('http://localhost/structureJS/structureJS/export.html?exports=' + exportList[listName].output);
      }

    }
    
    if(exportList[name]){
      getSrc(exportList[name], callback);
    }
  }
  
  function getSrc(obj, callback){
    //console.log('Getting: ' + fileName);
    var xhr = new XMLHttpRequest();
    xhr.onload = callback;
    if(indexes[obj.name] < obj.files.length){
      xhr.open('get',  obj.files[indexes[obj.name]], true);
      xhr.send();
    }
    
  }
  for(var name in exportList){
    combineSrcFiles( name );
  }
  
  return {};
});