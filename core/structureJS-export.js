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
      
      console.log('Export Order: ' + core._exportOrder);
    },
    
    /*This loads up drivers for exportation.*/
    loadDrivers : function(){

      core.loadScript( core.resolveFilePath( 'uglifyjs.min' ),
            function(){
              console.log('Finished Export Load. Clearing _files');
      });

    },
    /*This is needed because directory_aliases.export_bootstrap needs to be read for
      imports to work, whereas in core version we use directory_aliases.bootstrap*/
    loadConfigAndManifest : function(onLoaded){
      /*First Run through use structreJS base passed in via tag*/
      var baseDir = '',
         _this = core;
         
      if(core.config.project_base == '')
        baseDir = core.config.core_base;
      else
        baseDir = core.config.project_base;
      
      
      //recursive callback
      var callback = function(){
          console.log('Loading Manifest: ' + baseDir + core.config.manifest_name );
          core.loadScript(baseDir + core.config.manifest_name + '.js', function(){
          
            console.log('Done Loading Config And Manifest Config Files.');
          
            if(typeof onLoaded != 'undefined'){
              console.log('loadConfigAndManifest:onLoaded Called');
              onLoaded.call(core);
            }
          });
          
        
      }
        /* Bootstraping Frameworks
          --------------------------------------------------
          Bootstrap framework's files must be preceeded with 'bootstrap' alias. This
          is set here per-project because all script loading is relative to tag location.
          without this bootstrap could not load.*/

        /* Configuring Framework Specific Project Files
          ---------------------------------------------
          Use can set per-project loactions for framework-specific files by using aliases
          in bootstrap config like 'angular' which would resolve to 'angular/' in specific
          project*/
        var thisCallback = function(){
          core.loadScript(core.config.directory_aliases.export_bootstrap + core.config.bootstrap_config + '.js', callback);
        };
        
        /*Load bootstrap config. Core config has been reset using resetCoreState()*/
        core.loadScript(baseDir + core.config.config_name + '.js' , function(){
          /*User must have 'bootstrap' directory_alias set to Bootstrap directory AND
            they must have 'bootstrap_config' set to framework config file. Config file
            locations are relative to 'Bootstraps' directory*/
          if( (typeof core.config.directory_aliases != 'undefined' && typeof core.config.directory_aliases.export_bootstrap == 'undefined') 
          || core.config.bootstrap_config == null){
           thisCallback =  callback;
          }
           
           thisCallback.call(null);
        });
    
    

    
    },
    /*For export we need to order imports, dereference group names, insert common/globals
      then (if necessary) load drivers  */
    resolveDependencies : function(){
      dependency.detectCircularDependency(core._needTree);
      core._files = dependency.dereferenceGroups( dependency.orderImports(core._needTree) );
      dependency.printOrder('Resolved Order: ', core._files, 3);
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
        _this.loadConfigAndManifest(function(){
        
          if(typeof core.config.directory_aliases != 'undefined' && 
              typeof core.config.directory_aliases.bootstrap != 'undefined' &&
              typeof core.config.directory_aliases.export_bootstrap != 'undefined'){
            /*my construct Export order needs the aliases to be right*/
            core.config.directory_aliases.bootstrap = core.config.directory_aliases.export_bootstrap;   
            }
          
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
        });
        
        /*
        _this.loadProjectManifest(function(){
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
        });
        */
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
      
      _this.loadConfigAndManifest(function(){
        /*If project uses a bootstrap it will need directory_aliases.bootstrap to work
          and directory_aliases.export_bootstrap to be exported. The latter will override
          the former ONLY in the PMI*/
        if(typeof core.config.directory_aliases != 'undefined' && 
              typeof core.config.directory_aliases.bootstrap != 'undefined' &&
              typeof core.config.directory_aliases.export_bootstrap != 'undefined'){
            /*my construct Export order needs the aliases to be right*/
            core.config.directory_aliases.bootstrap = core.config.directory_aliases.export_bootstrap;   
            }
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
      
      });
      
      /*
      _this.loadProjectManifest(function(){
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
      });
      */
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