structureJS.module('structureJS-dependency',function(require){
  var core = require('core');
  return {
    getFilename : function(input){
      var fileName = '';
      if( input && typeof input === 'object' )
        fileName = Object.keys(input)[0];
      else if(typeof input === 'string')
        fileName = input;
      return fileName;
    },
    printOrder : function(msg, modules, priority){
      var priority = (typeof priority == 'undefined') ? 1 : priority;
      var output = msg || '';
      for(var i = 0; i < modules.length; i++){
        output += this.getFilename( modules[i] ) + ', ';
      }
      console.log(output);
      //this.pLog(priority,output);
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
       //this.pLog(2,'Checking '+modName1+'\'s dependencies');
       
        for(var i1 = 0;i1 < needTree[modName1].length; i1++){//go through it's depenedencies
          modName2 = needTree[modName1][i1];
          //this.pLog(2,'Dependency '+i1+' of '+modName1+' is '+ modName2);
          /*Check if declared groups are dependencies. If they aren't then I need to
          remove them from TLC. Removal happens in orderImports()*/
          if(core._groupNames.indexOf(modName2) > -1){
            core._groupsRDeps[modName2] = 1;
          }
          if(typeof needTree[modName2] !== 'undefined'){//my dependency list
            for(var i2 = 0;i2 < needTree[modName2].length; i2++){//make sure module isn't a dependency of its own dependency
              modName3 = needTree[modName2][i2];
              //this.pLog(2,'Checking '+modName2+'\'s dependencies for circular reference to parent '+modName1 );
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
    /*This is needed but it will require thought. Not going to let this hold me back from*/
    detectGroupCircularDependency : function(){
      var groupNames = core._groupNames;
      for(var i = 0; i < groupNames.length; i++){
        this.detectCircularDependency( core[groupNames[i]]._needTree );
      }
    },
    /*This function converts our needTree into an array. The array structure is
    used through out because it is sortable. This function does the dependency
    sorting*/
    orderImports : function(needTree, skipCleanTLC){
      /*TODO: Check groups for circulars. Cycle through group names and run
      detectCircularDependency on their needTrees*/
      var _this = this;
      var groupsRDeps = core._groupsRDeps;
      var modules = [];
      
      //convert needTree to array for easier processing
      for(var fileName in needTree){
        var modObj = {};
        modObj[fileName] = needTree[fileName];

        /*If you are a group, you have to be listed as a declared
        dependencies to remain in TLC. For group exports we need to skip this so
        if flag is present then we skip this. HORRIBLE but this function is horrible
        and breaking it up at this stage is not going to happen*/
        
        if(core._groupNames.indexOf(fileName) > -1 && typeof skipCleanTLC == 'undefined'){
          for(var groupName in groupsRDeps){
            if(fileName == groupName)
              modules.push( modObj );
          }
        }else{
          /*If you aren't a group you get place on TLC no matter what*/
          modules.push( modObj );
        }
      }

      /*INTERNAL FUNCTIONS
       NOTE: 'this' refers to window inside these functions*/
      function getModName(modObj){
        return _this.getFilename(modObj);
      }

      this.printOrder('OrderImports: Starting Order: ', modules);
      
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
        //_this.pLog(2,'Moving ' + getModName(obj) + '('+objIndex+') in front of ' + targetName + '('+targetIndex+')');
        var resultArr = [];
        for(var i = 0; i <= modules.length; i++){
          if(i < targetIndex && _this.getFilename(modules[i]) != _this.getFilename(obj)){
            //_this.pLog(3,' < pushing : ' + _this.getFilename(modules[i]) + ' @ index ' + i);
            resultArr.push(modules[i]);
          }else if(i == targetIndex ){
            //_this.pLog(3,'== pushing : ' + _this.getFilename(obj) + ' @ index ' + i);
            resultArr.push(obj);
          }else if(i > targetIndex && _this.getFilename(modules[i-1]) != _this.getFilename(obj)){
            //_this.pLog(3,' > pushing : ' + _this.getFilename(modules[i-1]) + ' @ index ' + i);
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
      var insertPerformed = false;
      for(var i1 = 0; i1 < modules.length; i1++){
        if(insertPerformed){//have to reset at top or esle we can never set i back to 0
          i1 = ( (i1 - 2) > -1)? i1-2 : 0;//don't let i1 go negative
          insertPerformed = false;
        }
        parentName = getModName(modules[i1]);
        parentIndex = getIndex(parentName);
        parentDeps = getModDeps(parentName);
        //this.pLog(3,'Resolving: '+parentName+', Index: ' + i1);
        for(var i = 0; i < parentDeps.length; i++){
          childName = parentDeps[i];
          if(parentName === childName)
            continue;
          /*If we push dependencies in front of ourself then we need to
          set index back to make sure we run resolution on my deps or else
          we won't ever resolve my deps*/  
          if( getIndex(childName) > parentIndex){
            insertBefore( getModObj(childName), getIndex(parentName));
            insertPerformed = true;
          }
        }
      }
      this.printOrder('OrderImports: Ending Order: ', modules);
      return modules;
    },
    orderImportsNoTLCChange : function(needTree){
      return this.orderImports(needTree, true);
    },
    /*Note the use of iteration instead of recursion. This is to reduce the memory
    footprint of the app. Recursion will create unecessary activation records whereas
    pushing back the loop index to re-evaluate indexes is an O(1) op that acheives the 
    same result*/
    dereferenceGroups : function(files){
      var fileName = '';
      var removeFileName = '';
      var beforeInsert = null;
      var afterInsert = null;
      var resultArray = null;
      var resolvedGroup = null;
      var groupComponents = null;
      var pushBack = 0;
      /*Resolve group chains and splice results into TLC*/
      for(var i = 0; i < files.length; i++){
        /*pushBack is used to make sure we re-evaluate previous indexes b/c
        for group refs b/c thier contents have changed. Choosing not to
        use recursion here b/c of the array insertion ops*/
        i = Math.max(0, (i - pushBack)); 
        pushBack = 0;
        
        fileName = this.getFilename(files[i]);
        
        /*We found a reference to a soft group in top-level chain (TLC)*/
        if( core._groupNames.indexOf(fileName) > -1) {

          /*Remove Group Refs*/
          for(var i2 = 0; i2 < files.length; i2++){
            removeFileName = this.getFilename(files[i2]);

            if(removeFileName == fileName){
              //console.log('Group: '+fileName+', removing: ' + removeFileName);
              files.splice(i2, 1);
              pushBack++;
            } 
          }        

          /*this[fileName] is group object. we put it as prop of structureJS*/
          this.printOrder('Files: ',files,3);
          resolvedGroup = this.orderImports(core[fileName]._needTree);
    
          beforeInsert = files.slice(0,(i>0)? i : 0);
          this.printOrder('Before Insert: ',beforeInsert,3);
          //console.log('i+1: ' + (i+1));
          afterInsert = files.slice(((i+1)<files.length)?(i+1) : files.length-1, files.length);
          this.printOrder('After Insert: ',afterInsert,3);

          resultArray = beforeInsert.concat(resolvedGroup);
          this.printOrder('Before Insert +  Resolved: ',resultArray,3);

          resultArray = resultArray.concat(afterInsert);
          
          this.printOrder('Final Result: ',resultArray,3);
          
          files = resultArray.slice(0, resultArray.length);
          resultArray.length = 0;
          
        }
      }
      return files;
    },
    /**/
    resolveDependencies : function(onComplete){
      this.detectCircularDependency(core._needTree);
      core._files = this.dereferenceGroups( this.orderImports(core._needTree) );
      this.printOrder('Resolved Order: ', core._files);
      core.loadModules(core.config, onComplete);
    }
  
  
  
  };

});