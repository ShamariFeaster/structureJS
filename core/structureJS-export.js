structureJS.module('structureJS-export',function(require){
  var core = require('core');
  var dependency = require('structureJS-dependency');
  var _compress = require('structureJS-compress');
  return {
    /*EXPORT FUNCTIONS*/

    loadConfig : function(callback){
      var structureTag = document.getElementById('structureJS');
      
      /*On first run */
      var config_name = structureTag.getAttribute('data-export-config') || core.config.config_name; 
      core.loadScript( config_name + '.js', callback);
    },
    
    resetState : function(){
      core.state['dependencyTree'] = {};
      core.state['resolvedFileList'] = [];
      core.state['pmiFileOrder'] = [];
      core.state['declaredGroups'] = [];
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
        core.state['resolvedFileList'].unshift(obj);
      }
      
      /*Put globals at the front of the line.
      Have to deep copy export order because we consume
      it here. Shallow leaves us with empty exports*/
      core.state['resolvedFileList'] = globals.concat(core.state['resolvedFileList']);
      for(var i = 0; i < core.state['resolvedFileList'].length; i++){
        core.state['pmiFileOrder'].push(core.resolveFilePath( core.state['resolvedFileList'][i] ));
      }
      
      console.log('Export Order: ' + core.state['pmiFileOrder']);
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
      dependency.detectCircularDependency(core.state['dependencyTree']);
      core.state['resolvedFileList'] = dependency.dereferenceGroups( dependency.orderImports(core.state['dependencyTree']) );
      dependency.printOrder('Resolved Order: ', core.state['resolvedFileList'], 3);
    },
    
    /*Executed on pmi right before loading of export manifest.
    Brings data from pmi into this context*/
    loadData : function(exportDataObj){
      /*Get the data from the pmi*/
      core.uglifyFiles = exportDataObj.files;
      core.config.project_base = exportDataObj.base_dir;
      core.config.manifest_loc = core.config.project_base + exportDataObj.manifest_loc;
      core.config.manifest_name = exportDataObj.manifest_name;
      core.config.config_name = exportDataObj.config_name;
    },
    
    init : function(exportData, callback){
      console.log('INIT');
      var _this = this;
      var exportData = exportData;
      _this.loadConfig(function(){
        /*In order to get access to defined groups we need to load the target
        project manifest*/
        _this.loadData(exportData);
        core.loadConfigAndManifest(function(){
        
          var bubbleError = null;
          try{
            _this.resolveDependencies();
            _this.constructExportOrder();
            _this.loadDrivers();
            core.exportInitiated = true;
          }catch(e){
            //Propagate error from detectCircularDependency()
            bubbleError = e;
          }
          
          if(callback)
            callback.call(null, bubbleError);
        }, core.config.directory_aliases.export_bootstrap );

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
      

      core.loadConfigAndManifest(function(){
        var bubbleError = null;
        try{
          _this.resolveDependencies();
          _this.constructExportOrder();
          _this.loadData(exportData);
          _compress.executeExport();
        }catch(e){
          //Propagate error from detectCircularDependency()
          bubbleError = e;
        }
        if(callback)
          callback.call(null, bubbleError);
      
      }, core.config.directory_aliases.export_bootstrap );

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