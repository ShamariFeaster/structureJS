structureJS.declare('C',['UI_Events','DB']);  
structureJS.declare('D',['UI_Events','C']);

structureJS.declareGroup({
    name : 'UI_Events', 
    description : 'Designed to handle responsive UI functions'
  });

structureJS.declareGroup({
    name : 'DB', 
    description : 'API for client-side DB functions'
  });  
  
//populate group  
structureJS.UI_Events.declare('MouseListener');
structureJS.UI_Events.declare('KeyListener');
structureJS.UI_Events.declare('DragResize', ['MouseListener']);


structureJS.DB.declare('IdbClient');
structureJS.DB.declare('Mongo');