/*
  I am walking the line between keeping the code simple and hand-holding users.
  An example of this is not putting complex code to fix dependency resolution if
  a user puts a common in the manifest. This would increase the complexity and 
  make maintenence hard for an edge case that is better solved with documentation.
  Also the philosophy of structreJs is to stick to the bare minimum of what is 
  necessary to let you easily structure a JS application. So by extension the documentation
  should be short and concise - decreasing user error because the docs were too long or
  complex for them to want to read.

TODO: make intialization output on/off flag in config
      make custom error class
*/

var structureJS = (typeof structureJS != 'undefined') ? structureJS : {
  
  config : {
    module_base : 'Modules/',
    global_base : 'lib/',
    globals : [],//things like jQuery ie, we are ok with the script polluting global ns
    commons : []/*sandboxed modules that r available to all other modules via require()
                  these should have no external dependencies. If it has dependencies
                  declare it normally or put dependencies into single file. This is going
                  to be for utilities modules and the like. Do not declare common files in
                  your manifest as it will cause unindended problems with dependency resolution
                */
    },
    uglifyMode : false,
    compressedMode : false,
  //GENERIC ENVIRNMENT
  _needTree : {},
  _files : [],
  _exportOrder : [],
  _modules : {},
  loadScript : function(url, callback){

      var head = document.getElementsByTagName('head')[0];
      var script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = url;
      
      head.appendChild(script);
      script.onload = callback;
    },

  loadModules : function(config){
    var _this = this;
    var globals = _this.config.globals || [];
    var commons = _this.config.commons || [];
    var globalsPlusCommons = [];
    /*file names grom globals array are strings, where as module filenames are
    the keys of objects. The type is sentinel - TODO: find better way to do this*/
    function getFilePath(input){
      var filePath = '';
      if(typeof input != 'undefined' && typeof input === 'object')
        filePath = config.module_base + Object.keys(input)[0] + '.js';
      else if(typeof input === 'string')
        filePath = config.global_base + input + '.js';
      
      return filePath;
    }
    
    /*Wrap commons and push onto front of modules*/
    for(var i = 0; i < commons.length; i++){
      var obj = {}; obj[commons[i]] = null;
      _this._files.unshift(obj);
    }
    /*put uglifyjs at front of globals if uglify mode*/
    if(_this.uglifyMode == true) {
      globals.unshift('uglifyjs.min');
      _this._exportOrder = _this._files;
    }

    /*Put globals at the front of the line*/
    _this._files = globals.concat(_this._files);

    //recursive callback
    var callback = function(){
      var filePath = getFilePath( _this._files.shift() );
      
      if(filePath){
        console.log('Inside callback: loading ' + filePath );
        _this.loadScript(filePath, callback);
      }else if(_this.uglifyMode == true){
        _this.loadScript(getFilePath('structureJSCompress'), function(){
          console.log('Modules Done Loading. Enjoy structureJS!')
        });
      }else{
        console.log('Modules Done Loading. Enjoy structureJS!');
      }
    }
    _this.loadScript( getFilePath( _this._files.shift() ), callback );
    
  },
  /*I'm thinking I want to keep this process iterative because it will be kinder to
  memory than a recursive solution if the project is sufficently large. Note: we do
  not detect duplicate declaration - again no baby sitting at the expense of 
  maintainability.
  TODO:  cleanup variable names WTF is modName2????? 
  */
  detectCircularDependency : function(needTree){
    var _thisDeps = null;
    var modName1 = '';
    var modName2 = '';
    var modName3 = '';
    for(var modName1 in needTree){//for every module
     console.log('Checking ' + modName1 + '\s dependencies');
     
      for(var i1 = 0;i1 < needTree[modName1].length; i1++){//go through it's depenedencies
        modName2 = needTree[modName1][i1];
        console.log('Dependency ' + i1 + ' of ' + modName1 + ' is ' + modName2);

        if(typeof needTree[modName2] !== 'undefined'){//my dependency list
          for(var i2 = 0;i2 < needTree[modName2].length; i2++){//make sure module isn't a dependency of its own dependency
            modName3 = needTree[modName2][i2];
            console.log('Checking ' + modName2 + '\s dependencies for circular reference to parent ' + modName1 );
            if(modName1 == modName3){
              throw 'ERROR: CIRCULAR DEPENDENCY: ' + modName1 + ' is a dependency of its own dependency ' + modName2;
            }
          }
        }else{
          throw 'ERROR: ' + modName2 + ' is a dependency of ' + modName1 + ' but has not been explicitly declared.';
        }
      
      }
      
    }
    return false;
  },
  
  orderImports : function(needTree){
    var modules = [];
    //convert needTree to array for easier processing
    for(var i in needTree){
      var modObj = {};
      modObj[i] = needTree[i];
      modules.push( modObj );
    }
    
    /*INTERNAL FUNCTIONS*/
    function getModName(modObj){
      return Object.keys(modObj)[0];
    }
    
    function printOrder(msg){
      var output = msg || '';
      for(var i = 0; i < modules.length; i++){
        output += getModName( modules[i] ) + ',';
      }
      console.log(output);
    }
    
    printOrder('Starting Order: ', modules);
    
    function getModDeps(modName){
      return needTree[modName];
    }
    function getIndex(modName){
      for(var i = 0; i < modules.length; i++){
        if( modName === getModName( modules[i] ) )
          return i;
      }
    }
    
    function getModObj(modName){
      for(var i = 0; i < modules.length; i++){
        if( modName === getModName( modules[i] ) )
          return modules[i];
      }
    }
    
    function insertBefore(obj, targetIndex){
      var objIndex = getIndex( getModName(obj) );
      var targetObj = getModObj( getModName(modules[targetIndex]) );
      var targetName = getModName(modules[targetIndex]);
      console.log('Moving ' + getModName(obj) + '('+objIndex+') in front of ' + targetName + '('+targetIndex+')');
      var resultArr = [];
      for(var i = 0; i < modules.length; i++){
        
        if(i < targetIndex ){
          resultArr.push(modules[i]);
        }else if(i == targetIndex){
          resultArr.push(obj);
        }else if(i > targetIndex){
          resultArr.push(modules[i-1]);
        }
      }
      modules = resultArr;
    } 
    /*END INTERNAL FUNCTIONS*/
    
    var parentIndex = 0;
    var parentName = '';
    var parentDeps = null;
    var childName = '';
    for(var i1 = 0; i1 < modules.length; i1++){
      parentName = getModName(modules[i1]);
      parentIndex = getIndex(parentName);
      parentDeps = getModDeps(parentName);
      console.log('Resolving: ' + parentName + ' Index: ' + i1);
      for(var i = 0; i < parentDeps.length; i++){
        childName = parentDeps[i];
        if(parentName === childName)
          continue;
        
        if( getIndex(childName) > parentIndex){
          insertBefore( getModObj(childName), getIndex(parentName));
        }
      }
    }

    return modules;
  },
  declare : function(name, dependencies){
    if(typeof dependencies == 'undefined')
      dependencies = [];
    this._needTree[name] = dependencies;
  },

  resolveDependencies : function(){
    this.detectCircularDependency(this._needTree);//catch error and fail gracefully
    this._files = this.orderImports(this._needTree, this._files);
    
    function printOrder(msg, modules){
      function getModName(modObj){
        return Object.keys(modObj)[0];
      }
    
      var output = msg || '';
      for(var i = 0; i < modules.length; i++){
        output += getModName( modules[i] ) + ',';
      }
      console.log(output);
    }
    
    printOrder('Resolved Order: ', this._files);
    this.loadModules(this.config);
  },
  /*
    TODO: error handling if no modName or moduleFunc is not function
  */
  module : function(modName, moduleFunc){
    var _this = this;
    /*Supports jQuery AMD by recognizing and calling init function
    that jquery passes to use using AMD-spec define*/
    var require = function(depName){
      var module = _this._modules[depName];
      if(typeof module == 'function')
        module = module.call(null);
      return module;
    }
    
    this._modules[modName] = moduleFunc.call(null, require);
  },
  
  loadConfigAndManifest : function(onLoaded){
  
    var structureTag = document.getElementById('structureJS');//returns null if not found
    if(typeof structureTag === 'undefined' || structureTag === null)
      throw 'ERROR: No script tag with ID of "structureJS" which is required';

    var config = structureTag.getAttribute('data-config');
    var manifest = structureTag.getAttribute('data-manifest');
    var uglify = structureTag.getAttribute('data-uglify');
    
    if(typeof manifest === 'undefined' || manifest === '' || manifest === null)
      throw 'ERROR: No manifest declared';
      
    if( (typeof uglify === 'undefined' || uglify !== null) && /true/i.test(uglify) == true)
      this.uglifyMode = true;
      
    var _this = this;
    //recursive callback
    var callback = function(){
      if(manifest != null){
        console.log('Loading Manifest: ' + manifest );
        _this.loadScript(manifest + '.js', callback);
        manifest = null;
      }else{
        console.log('Init Done Loading.');
        onLoaded.call(_this);
      }
    }
    if(config){
      console.log('Loading Config: ' + config );
      this.loadScript( config + '.js', callback );
    }else{
      this.loadScript( manifest + '.js', function(){
        onLoaded.call(_this);
      } );
    }
      
    
  }
};

(function(window){
  /*Trying to support AMD for jQuery. Total AMD compliance to come later.
    Becoming AMD compliant is going to require a lot of thought so that's something
    I think is best done by a community after open sourcing.
  see: https://github.com/amdjs/amdjs-api/blob/master/AMD.md
       http://addyosmani.com/writing-modular-js/*/
  window.define = function(id, deps, factory){
    window.structureJS.module(id, factory);
  };
  window.define.amd = {jQuery : true};
  
  var structureTag = document.getElementById('structureJS');//returns null if not found
  if(typeof structureTag === 'undefined' || structureTag === null)
    throw 'ERROR: No script tag with ID of "structureJS" which is required';
  /*if user declares we are using a compressed version of ourself generated by us, then we
  disable all module loading because structureJSCompress has already included everything*/  
  var combined = structureTag.getAttribute('data-is-combined');
  if(typeof combined != 'undefined' && combined !== null && /true/i.test(combined) == true){
    //don't do shit
  }else{
    structureJS.loadConfigAndManifest(structureJS.resolveDependencies);
  }
  
  
})(window);
