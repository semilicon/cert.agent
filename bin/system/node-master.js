/////////////////////////////////////////////////////////////////////////////////////////////////////////
	const fs = require('fs');
	const execSync = require('child_process').execSync;
/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
	if(!fs.existsSync('/usr/bin/g++')){//устанавливаем Development Tools
		execSync('yum groupinstall \'Development Tools\' -y');
	}
	//проверяем установленны ли node_modules
	if(!fs.existsSync(__root+'node_modules/')){
		console.log('Alert: need install node_modules;');
		execSync('cd '+__root);
		execSync('npm install');
		console.log('Info: node_modules has been installed;');
	}
/////////////////////////////////////////////////////////////////////////////////////////////////////////
	var clusterUtils=require(__path+'lib/cluster.utils.lib.js');
	const systemdLib=require(__path+'lib/systemd.lib.js');
/////////////////////////////////////////////////////////////////////////////////////////////////////////
	//создаём папки
	const systemDirs=['log','data','data/.tmp'];
	for(let i in systemDirs){
		if(!fs.existsSync(__root+systemDirs[i]+'/'))fs.mkdirSync(__root+systemDirs[i]+'/');
	}
	//создаём файлы
	const systemFiles=['log/_syslog.log'];
	for(let i in systemFiles){
		if(!fs.existsSync(__root+systemFiles[i]))fs.writeFileSync(__root+systemFiles[i],'');
	}
	//создаём системные конфигурации для автозапуска приложения
	systemdLib.register(config.name,__root);
/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
	var init=async function(){
		clusterUtils.init();
		clusterUtils.developerMode(config.developerMode);
		clusterUtils.startHandlersForks();
		//clusterUtils.startHttpForks();
	}
	init();
	