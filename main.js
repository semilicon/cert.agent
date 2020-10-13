/////////////////////////////////////////////////////////////////////////////////////////////////////////
	__root=__dirname+'/'; //save root directory
	__path=__dirname+'/bin/'; //save work directory
	process.chdir(__path);// set work directory to App directory
	process.env.TZ='UTC';//'Europe/Moscow'
	config = require(__root+'config.json');//загружаем конфигурации
/////////////////////////////////////////////////////////////////////////////////////////////////////////
	//connect cluster
	const cluster = require('cluster');
	if(cluster.isMaster) require(__path+'system/node-master.js');
	else require(__path+'system/node-fork.js');