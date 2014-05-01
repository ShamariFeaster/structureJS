var structureJS = (typeof structureJS != 'undefined') ? structureJS : {

  options : {
    download_minified : false,
    minified_output_tag_id : 'minified',
    log_priority : 3
  },
  
  /*@StartDeploymentRemove*/
  /*module_base is removed. let directory_aliases stand in its place. this is more
    flexible for users. NOTE: ./ and ../ can be stacked ir, ./../. resolves correctly*/
  config : {
    core_base : '',/*This is pulled from the src attribute pointing to this script*/
    core_lib_folder : 'lib/',
    project_base : '', /*defaults to './'*/ 
    manifest_name : 'manifest/core-manifest',/*These are default for the core*/
    config_name : 'config/config',/*These are default for the core*/
    bootstrap_base : null,
    bootstrap_config : null,
    globals : [],
    commons : []
    },
    uglifyMode : false,
    compressedMode : false,
    hasRemotes : false,
    exportFiles : '',
    uglifyFiles : '',
    exportInitiated : false,
    executeExport : null,
    structureJSTag : null,

  //GENERIC ENVIRNMENT
  _needTree : {},
  _files : [],
  _exportOrder : [],
  _groupNames: [],
  _groupsRDeps : {},
  //Constants
  NAME : 'structureJS-core',
  UGLYFY_FILENAME : 'uglifyjs.min',
  EXPORT_CONFIG_FILENAME : 'export-config',
  REMOTE_KEYWORD : 'remote',
  REMOTE_URL : 'https://deeperhistory.info/structureJS/wordpress/wp-content/Modules/',
  /*@EndDeploymentRemove*/
  
  _modules : {},
  _cache : {},
  
  /*@StartDeploymentRemove*/
  loadScript : function(url, callback, id){
    //this.pLog(1,'Loading: ' + url);
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    if(typeof id != 'undefined')
      script.id = id;
    head.appendChild(script);
    script.onload = callback;
  },
  resetCoreState : function(){
    this._needTree = {};
    this._files = [];
    this._exportOrder = [];
    this._groupNames = [];
    this._groupsRDeps = {};
    this.config.globals.length = 0;
    this.config.commons.length = 0;
  },
  extend : function(target, src, unshiftArrays){
    if( (target && typeof target !== 'object') || (src && typeof src !== 'object'))
      throw 'Error: extend param is not an an oject';
    for(var prop in src){
      //console.log('prop: ' + prop + ' ' + target[prop]);
      /*For cascading configs, we push to arrays instead of clobbering*/
      if(Array.isArray(target[prop]) == true && Array.isArray(src[prop]) == true){
        if(typeof unshiftArrays != 'undefined' && unshiftArrays == true ){
          target[prop] = src[prop].concat(target[prop]);
        }else{
          target[prop] = target[prop].concat(src[prop]);
        }
      /*enumerate object and write diffs*/
      }else if(typeof target[prop] === 'object' && typeof src[prop] === 'object'){
        for(var srcProp in src[prop]){
          target[prop][srcProp] = src[prop][srcProp];
        }
      /*clobber*/  
      }else{
        target[prop] = src[prop];
      }
      
    }
  },
  configure : function(configObj, optionsObj){
    this.extend(this.config, configObj);
    this.extend(this.options, optionsObj);
  },
  bootstrapConfigure : function(configObj, optionsObj){
    this.extend(this.config, configObj, true);
    this.extend(this.options, optionsObj);
  },
  resolveFilePath : function(input){
    var _this = this;
    var remoteRegex = new RegExp('^' +_this.REMOTE_KEYWORD + '\/', 'i');
    var cdnRegex = /^(http|\/\/)/;
    if(typeof input == 'undefined')
      return '';
    var config = this.config;
    
    /*NOTE: inside inner functions this refers to window*/
    function resolveDirectoryAliases(input, defaultBase){
      var aliases = config.directory_aliases;
      var results = '';
      //console.log(input + ' is CDN: ' +cdnRegex.test(input));
      //console.log(config.directory_aliases);
      /*Before returning replace 'remote' with remote URL*/
      if(new RegExp(remoteRegex).test(input)){
        results = input.replace(remoteRegex, _this.REMOTE_URL) + '.js';
        _this.hasRemotes = true;
      }else if(cdnRegex.test(input)){
        results = input + '.js';
        _this.hasRemotes = true;
      }else{
        results = defaultBase + input + '.js';
      }
        
      var matchResult = null;  
      var regex = null;
      for(var alias in aliases){
        //checkl for reserved 'remote' alias
        if(new RegExp(_this.REMOTE_KEYWORD, 'i').test(alias))
          throw 'Alias "remote" is reserved. Please rename';
        
        regex = new RegExp('^' + alias + '\/', 'i');
        matchResult = regex.exec(input);
        
        if(matchResult != null){
          results = input.replace(matchResult[0], aliases[alias]) + '.js';
        }
      }
      return results;
    }
    /*End resolve*/
    
    var filePath = '';
    if( input && typeof input === 'object' ){
      filePath = resolveDirectoryAliases(Object.keys(input)[0], config.project_base);//config.module_base + Object.keys(input)[0] + '.js';
    }else if(input == this.UGLYFY_FILENAME){
     filePath = resolveDirectoryAliases(input, config.core_base + config.core_lib_folder);//config.core_base + input + '.js';
    }else if(typeof input === 'string'){
      filePath = resolveDirectoryAliases(input, config.project_base )//config.global_base + input + '.js';
    }
    return filePath;
  },
  loadModules : function(config, onComplete){
    var _this = this;
    var globals = _this.config.globals || [];
    var commons = _this.config.commons || [];

    /*Wrap commons and push onto front of modules*/
    for(var i = commons.length - 1; i >= 0; i--){
      var obj = {}; obj[commons[i]] = null;
      _this._files.unshift(obj);
    }
    /*put uglifyjs at front of globals if uglify mode*/
    if(_this.uglifyFiles != '') {
      globals.unshift('uglifyjs.min');
    }
    
    /*Put globals at the front of the line.
    Have to deep copy export order because we consume
    it here. Shallow leaves us with empty exports*/
    _this._files = globals.concat(_this._files);
    for(var i = 0; i < _this._files.length; i++){
      _this._exportOrder.push(_this.resolveFilePath( _this._files[i] ));
    }

    //recursive callback
    var callback = function(){
      var filePath = _this.resolveFilePath( _this._files.shift() );
      /*Still files to load up*/
      if(filePath){
        _this.loadScript(filePath, callback);
      }else{
        if(typeof onComplete != 'undefined'){
          onComplete.call(null);
          console.log('Bootstrap Complete. Thanks For Using structureJS.');
        }
            
      }
    }
     console.log('This Files Before Loading: ',_this._files);
    _this.loadScript( this.resolveFilePath( _this._files.shift() ) , callback );
    
  },
  loadConfigAndManifest : function(onLoaded){
    /*First Run through use structreJS base passed in via tag*/
    var baseDir = '',
       _this = this;
       
    if(this.config.project_base == '')
      baseDir = this.config.core_base;
    else
      baseDir = this.config.project_base;
    
    
    //recursive callback
    var callback = function(){
        console.log('Loading Manifest: ' + baseDir + _this.config.manifest_name );
        _this.loadScript(baseDir + _this.config.manifest_name + '.js', function(){
        
          console.log('Done Loading Config And Manifest Config Files.');
        
          if(typeof onLoaded != 'undefined'){
            console.log('loadConfigAndManifest:onLoaded Called');
            onLoaded.call(_this);
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
        _this.loadScript(_this.config.directory_aliases.bootstrap + _this.config.bootstrap_config + '.js', callback);
      };
      
      /*Load bootstrap config. Core config has been reset using resetCoreState()*/
      this.loadScript(baseDir + _this.config.config_name + '.js' , function(){
        /*User must have 'bootstrap' directory_alias set to Bootstrap directory AND
          they must have 'bootstrap_config' set to framework config file. Config file
          locations are relative to 'Bootstraps' directory*/
        if( (typeof _this.config.directory_aliases != 'undefined' && typeof _this.config.directory_aliases.bootstrap == 'undefined') 
        || _this.config.bootstrap_config == null){
         thisCallback =  callback;
        }
         
         thisCallback.call(null);
      });
    
    

    
  },
  /*@EndDeploymentRemove*/
  
  decodeInfoObj : function(infoObj){
    var results = {name : ''};
    if(typeof infoObj === 'string')
      results.name = infoObj;
    else if(typeof infoObj === 'object'){
      if(typeof infoObj.name == 'undefined')
        throw 'Configuration Object Must Have Name Property';
      else
        this.extend(results, infoObj);
    }
    return results;
  },
  module : function(modConfig, /*function*/ executeModule){
    if(typeof modConfig == 'undefined' || typeof modConfig === 'function')
      throw 'Module Must Have Configuration Object Or Name String';
    if(typeof executeModule !== 'function')
      throw 'Module Must Have A Function As It\'s Definition';
      
    var _this = this;
    var infoObj = null;
    var moduleWrapper = {type : 'unknown'};
    var globDeps = null;
    infoObj = this.decodeInfoObj(modConfig);
    /*Check if declared global deps is in global namespace*/
    if(typeof infoObj.global_dependencies != 'undefined'){
      globDeps = infoObj.global_dependencies;
      if(!Array.isArray(globDeps)){
        throw 'ERROR: global_dependencies Property Of ' + infoObj.name + '\s Configuration Object Must Be An Array.'
      }
      
      for(var i = 0; i < globDeps.length; i++){
        if(typeof window[globDeps[i]] == 'undefined')
          throw 'ERROR: ' + infoObj.name + ' Requires ' + globDeps[i] + ' To Be In Global Namespace.';
      }
    }
    function require(depName){
      var retVal = null;
      if( _this._modules[depName] )
        retVal = _this._modules[depName]['module'];
      return retVal;
    };
    /*aliases that let user's add semantic meaning to thier require calls*/
    require.amd = require;
    require.getType = function(modName){
      var retVal = null;
      if( _this._modules[depName] )
        retVal = _this._modules[depName]['type'];
      return retVal;
    }
    require._class = require;
    structureJS.require = require;
    

    /*Put the return val of the module function into modules object
    so they can be retrieved later using 'require'*/
    moduleWrapper['module'] = executeModule.call(this, require); 
    if(typeof moduleWrapper['module'] == 'undefined')
      throw infoObj.name + ' FAILED: Module Function Definition Must Return Something';
    
    this._modules[infoObj.name] = moduleWrapper;
  },
  
  /*I split this up because I want the module importation via require to be transparent
  to the user. so require will correctly get any type of module*/
  moduleAMD : function(modName, executeModule){
    var moduleWrapper = {type : 'amd', name : modName};
    moduleWrapper['module'] = executeModule.call(null).call(null);
    if(typeof moduleWrapper['module'] == 'undefined')
      throw 'Module Function Definition Must Return Something';
    //this.pLog(2,'AMD: Loading ' + modName);
    this._modules[modName] = moduleWrapper;
  },
  declare : function(name, dependencies){
    /*Add error checking here for name*/
    if(typeof dependencies == 'undefined')
      dependencies = [];
    this._needTree[name] = dependencies;
    
  },
  declareGroup : function(groupInfo){
    var _this = this;
    var infoObj = this.decodeInfoObj(groupInfo);
    this._groupNames.push(infoObj.name);
    this.declare(infoObj.name);
    this[infoObj.name] = {};
    var groupNamespace = this[infoObj.name];//make structureJS.<group name> to declare files on
    groupNamespace['_needTree'] = {};
    /*Copying functions TODO: do this prototypically*/
    groupNamespace.declare = function(name, dependencies){
      /*uses declare to put dependeny tree together on <group name>._needTree
      we would resolve this separately to construct hard group*/
      _this.declare.apply(groupNamespace, [name, dependencies]);
      /*I don't want to add to TLC because unless user puts group in TLC*/
      //_this.declare(name, dependencies);
    };
  },
  cache : function(key, value){
    var returnVal = null;
    if(arguments.length == 1 && this._cache[key])
      returnVal = this._cache[key];
    if(arguments.length == 2 && key && value)  
      this._cache[key] = value
    return returnVal;
  },
};
  
(function(){
  /*Trying to support AMD for jQuery. Total AMD compliance to come later.
    Becoming AMD compliant is going to require a lot of thought so that's something
    I think is best done by a community after open sourcing.
  see: https://github.com/amdjs/amdjs-api/blob/master/AMD.md
       http://addyosmani.com/writing-modular-js/*/
  window.define = function(id, deps, factory){
    window.structureJS.moduleAMD(id, factory);
  };
  window.define.amd = {jQuery : true};
  
  /*if there is no console or I have turned it off, kill log function*/
  if ( ! window.console || structureJS.options.log == false) 
    window.console = { log: function(){}, logf : function(){} };
  
  
  /*@StartDeploymentRemove*/
  structureJS.structureJSTag = document.getElementById('structureJS');//returns null if not found
  
  /*In a compressed project we should not use the structureJS id. Not using it will
    mean all file loading is not done and all structreJS provide is module loading*/
  
  if(structureJS.structureJSTag != null){
    /*Init*/
    var core = structureJS;
    var core_resolve = null;
    /*master file base pulled from src tag*/
    core.config.core_base = /((.+)+\/)structureJS-core.js$/.exec( core.structureJSTag.getAttribute('src') )[1];


    /*For core build p-base is same because resolveFilePath uses p-base*/
    core.config.project_base = core.config.core_base;
    /*use attrivs where you need config before config is loaded (ie. pmi)*/
    core.config.manifest_name = structureJS.structureJSTag.getAttribute('data-core-manifest') || core.config.manifest_name;
    /*Load project config and manifest*/
    core.loadConfigAndManifest(function(){
      
      /*Excapsulte core in a module*/
      core.module('core',function(){
        return core;
      });
      
      /*To keep dep resolution separate we need to manually load it outside
      of manifest. A worth trade. Dep resolution is basically treated as part 
      of core*/
      core.loadScript(core.config.core_base + 'structureJS-dependency.js',function(){
        /*By the time we get here dependency resolution function are accessble through
        require object. 
        
        We use it to resolve core dependencies*/
        core_resolve = core.require('structureJS-dependency');
        
        /*resolveDependencies callback fired AFTER all files are loaded.
          In this case these were core modules.*/
        core_resolve.resolveDependencies(function(){
          
          /*Reset core variables from core load & ready for project load*/
          core.resetCoreState();
          
          /*User may override default config name 'config' in script tag. Defaults to 'config'*/
          core.config.config_name = structureJS.structureJSTag.getAttribute('data-project-config') || 'config';
          core.config.manifest_name = structureJS.structureJSTag.getAttribute('data-project-manifest') || 'manifest';
          
          /*Project base is location of project config/manifest used to override 
          core build dir structure. Defaults to './' */
          core.config.project_base = core.structureJSTag.getAttribute('data-project-base') || './';
          
          /*If use sets these two in tag we bootstrap whatever framework they point to*/
          core.config.bootstrap_base = structureJS.structureJSTag.getAttribute('data-bootstrap-base') || null;
          core.config.bootstrap_config = structureJS.structureJSTag.getAttribute('data-bootstrap-config') || null;
          
          /*Explicitly load project manifest & config files, then resolve deps*/
          core.loadConfigAndManifest(function(){
            core_resolve.resolveDependencies();/*End Project Resolve Block*/
          });
          
          
        });/*End Core Resolve Block*/
      });
    });
  }else{throw 'ERROR: he id attribute of the <script> tag is not set to "structureJS".';}
  /*@EndDeploymentRemove*/
  
})();