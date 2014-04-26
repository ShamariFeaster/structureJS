structureJS.module('structureJS-export',function(require){
  var core = require('core');
  var dependency = require('structureJS-dependency');
  var _compress = require('structureJS-compress');
  return {
    /*EXPORT FUNCTIONS*/

    loadConfig : function(callback){
      var structureTag = document.getElementById('structureJS');
      
      /*I can set separate export config if need be NOT REQUIRED*/
      var config_name = structureTag.getAttribute('data-export-config') || core.config.config_name; 
      core.loadScript( config_name + '.js', callback);
    },
    
    resetState : function(){
      core._needTree = {};
      core._files = [];
      core._exportOrder = [];
      core._groupNames = [];
      core._groupsRDeps = {};
    },
    
    removeProjectManifest : function(){
      var config = core.config;
      var manifest = document.getElementById(config.manifest_name);
      console.log('Trying to remove script id: '+ config.manifest_name) ;
      if(manifest)
        manifest.parentNode.removeChild(manifest);
    },
    
    /*This loads the project targeted for export's manifest. Notice we attach the manifest
    name specified in the pmi as an id of the script tag. we use this for removal of the tag 
    further down to prevent multiple instances in the DOM*/
    loadProjectManifest : function(callback){
      var config = core.config;
      core.loadScript( config.manifest_loc + config.manifest_name + '.js',callback, config.manifest_name);
    },
    
    constructExportOrder : function(){

      var globals = core.config.globals || [];
      var commons = core.config.commons || [];
     
      /*Wrap commons and push onto front of modules*/
      for(var i = commons.length - 1; i >= 0; i--){
        var obj = {}; obj[commons[i]] = null;
        core._files.unshift(obj);
      }
      
      /*Put globals at the front of the line.
      Have to deep copy export order because we consume
      it here. Shallow leaves us with empty exports*/
      core._files = globals.concat(core._files);
      for(var i = 0; i < core._files.length; i++){
        core._exportOrder.push(core.resolveFilePath( core._files[i] ));
      }
    },
    
    /*This loads up drivers for exportation.*/
    loadDrivers : function(){

      core.loadScript( core.resolveFilePath( 'uglifyjs.min' ),
            function(){
              console.log('Finished Export Load. Clearing _files');
      });

    },
    
    /*For export we need to order imports, dereference group names, insert common/globals
      then (if necessary) load drivers  */
    resolveDependencies : function(){
      core._files = dependency.dereferenceGroups( dependency.orderImports(core._needTree) );
      dependency.printOrder('Resolved Order: ', core._files);
    },
    
    /*Executed on pmi right before loading of export manifest.
    Brings data from pmi into this context*/
    loadData : function(exportDataObj){
      /*Get the data from the pmi*/
      core.uglifyFiles = exportDataObj.files;
      core.config.project_base = exportDataObj.base_dir;
      core.config.manifest_loc = core.config.project_base + exportDataObj.manifest_loc;
      core.config.manifest_name = exportDataObj.manifest_name;
      console.log(core.config);
      console.log(core.config.manifest_name);
    },
    
    init : function(exportData, callback){
      console.log('INIT');
      var _this = this;
      var exportData = exportData;
      _this.loadConfig(function(){
        /*In order to get access to defined groups we need to load the target
        project manifest*/
        _this.loadData(exportData);
        _this.loadProjectManifest(function(){
          _this.resolveDependencies();
          _this.constructExportOrder();
          _this.loadDrivers();
          core.exportInitiated = true;
          if(callback)
            callback.call(null);
        });
      
      });
    },
    
    /*structureJS-compress looks at _exportOrder if its a whole project export
      and _uglifyFiles if it's a file by file select*/
    update : function(exportData, callback){
      console.log('UPDATE');
      var _this = this;
      var exportData = exportData;
      _this.removeProjectManifest();
      _this.resetState();
      /*reload export target project manifest so exporting can reflect changes in
      dependency ording, group modification, new declared scripts, etc*/
      _this.loadProjectManifest(function(){
        _this.resolveDependencies();
        _this.constructExportOrder();
        _this.loadData(exportData);
        _compress.executeExport();
        callback.call(null);
      });
    },
    
    getFilesAndGroups : function(callback){
      var _this = this;
      _this.removeProjectManifest();
      _this.resetState();
      /*reload export target project manifest so exporting can reflect changes in
      dependency ording, group modification, new declared scripts, etc*/
      _this.loadProjectManifest(function(){
        _this.resolveDependencies();
        _this.constructExportOrder();
        if(callback)
          callback.call(null);
      });
    }
  
  
  
  };
  
});