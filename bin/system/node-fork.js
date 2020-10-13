/////////////////////////////////////////////////////////////////////////////////////////////////////////
const cluster = require('cluster');
const pathParser = require('path');
/////////////////////////////////////////////////////////////////////////////////////////////////////////
exit=function(){process.exit(0);};//функция завершения работы форка
restart=function(){process.send({ cmd: 'restart' });};
/////////////////////////////////////////////////////////////////////////////////////////////////////////
if(cluster.isWorker&&process.env['role']=='http'){
	var main=require(__path+'main-web.js');
	main.start(function(){
		console.log('Process "main-web" #'+cluster.worker.id+' is sterted.');
	});
}else if(cluster.isWorker&&pathParser.extname(process.env['role'])=='.handler'){
	let name =pathParser.basename(process.env['role'],'.handler');
	var main=require(__path+'handlers/'+name+'.js');
	main.start(function(){
		console.log('Process "'+process.env['role']+'" #'+cluster.worker.id+' is sterted.');
	}); 	
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////