
(function(){
var MockCore = null;
var mockInitState = {
      functionDependencies : {
        reset : function(){
          this.state['dependencyTree'] = {};
          this.state['declaredGroups'] = [];
          this.state['resolvedFileList'] = [];
          this.state['pmiFileOrder'] = [];
          this.state['declaredGroups'] = [];
          this.state['groupsInTLC'] = {};
          this.state['pmiFilesSelectedForExport'] = '';
        }
      }
    };
MockCore = structureJS.state['modules']['core'] = getMockStructureJS(mockInitState);

var dependency = structureJS.require('structureJS-dependency');

QUnit.module('Dependency Functional Tests', 
{
  setup : function(){
    
  },
  teardown : function(){
    MockCore.reset();
  }
});

QUnit.test('dependency.getFilename',function( assert ){
  assert.equal(dependency.getFilename('filename'), 'filename' , "typeof param input is String");
  assert.equal(dependency.getFilename({filename : 'blah'})
              , 'filename', "typeof param input is Object");
});

QUnit.test('dependency.printOrder',function( assert ){
  assert.ok(true,"Nothing to test");

});
/*
  case : finds group name in group's dependency tree
  case : finds group name in core's dependency tree
*/
QUnit.test('dependency.detectUndeclaredGroupDependency',function( assert ){
  MockCore.group1 = { state : { dependencyTree : { dep1 : [] } } };
  console.log('Inside Test');
  console.log(structureJS.state['modules']['core']);
  assert.equal(dependency.detectUndeclaredGroupDependency('group1','dep1')
              , false
              , "Depndency Functional Test"
  );
  delete MockCore.group1;
});

QUnit.test('dependency.detectGroupCircularDependency',function( assert ){
  assert.ok(true,"Depndency Functional Test");
});

QUnit.test('dependency.detectCircularDependency',function( assert ){
  assert.ok(true,"Depndency Functional Test");
});

QUnit.test('dependency.orderImports',function( assert ){
  assert.ok(true,"Depndency Functional Test");
});

QUnit.test('dependency.orderImportsNoTLCChange',function( assert ){
  assert.ok(true,"Depndency Functional Test");
});

QUnit.test('dependency.dereferenceGroups',function( assert ){
  assert.ok(true,"Depndency Functional Test");
});

QUnit.test('dependency.resolveDependencies',function( assert ){
  assert.ok(true,"Depndency Functional Test");
});

})();