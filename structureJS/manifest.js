structureJS.declare('C',['UI_Events','DB']);  
structureJS.declare('D',['UI_Events','C']);


structureJS.declareGroup('UI_Events');
//OR
/*
structureJS.declareGroup({
    name : 'UI-Events', 
    description : 'Designed to handle responsive UI functions'
  });
*/
//populate group  
structureJS.UI_Events.declare('MouseListener');
structureJS.UI_Events.declare('KeyListener');
structureJS.UI_Events.declare('DragResize', ['MouseListener']);

structureJS.declareGroup('DB');
structureJS.DB.declare('IdbClient');
structureJS.DB.declare('Mongo');