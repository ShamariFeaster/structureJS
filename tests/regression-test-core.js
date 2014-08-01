window.onload = function(){

QUnit.asyncTest( 'structureJS.loadScript', function( assert ) {
  expect( 1 );
  
  structureJS.loadScript('dummy-script.js', function(){
    assert.ok( window.scriptLoaded, "structureJS.loadScript is working." );
    QUnit.start();
  }, 'dummy-script');

});

QUnit.test('structureJS.resetCoreState',function( assert ){
  structureJS.resetCoreState();
  assert.deepEqual(structureJS.state['dependencyTree'], {}, "structureJS.state['dependencyTree'] = {}");
  assert.deepEqual(structureJS.state['resolvedFileList'], [], "structureJS.state['resolvedFileList'] = []");
  assert.deepEqual(structureJS.state['pmiFileOrder'], [], "structureJS.state['pmiFileOrder'] = []");
  assert.deepEqual(structureJS.state['declaredGroups'], [], "structureJS.state['declaredGroups'] = []");
  assert.deepEqual(structureJS.state['groupsInTLC'], {}, "structureJS.state['groupsInTLC'] = {}");
  assert.deepEqual(structureJS.config.globals.length, 0, "structureJS.config.globals.length = 0");
  assert.deepEqual(structureJS.config.commons.length, 0, "structureJS.config.commons.length = 0");
});

QUnit.test('structureJS.extend',function( assert ){
  assert.ok(true, 'structureJS.extend');
});

};