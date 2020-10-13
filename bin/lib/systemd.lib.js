/////////////////////////////////////////////////////
	const fs = require('fs');
	const execSync = require('child_process').execSync;
	const __mustache = require('mustache');
/////////////////////////////////////////////////////////////////////////////////////////////////////////
var lib={
	register:function(name){//создаём системные файлы для запуска приложения
		if(!fs.existsSync('/etc/rsyslog.d/'+name+'.conf')){
			let content=__mustache.render(fs.readFileSync(__root+'/etc/rsyslog.d/syslog.sample.conf','utf8'),{'name':name,'root_path':__root});
			fs.writeFileSync('/etc/rsyslog.d/'+name+'.conf',content);
			execSync('systemctl restart rsyslog');
			console.log('rsyslog: add oupput config;');
		  }
		  if(!fs.existsSync('/etc/systemd/system/'+name+'.service')){
			let content=__mustache.render(fs.readFileSync(__root+'/etc/systemd/system/sample.service','utf8'),{'name':name,'root_path':__root});
			fs.writeFileSync('/etc/systemd/system/'+name+'.service',content);
			console.log('system: add service;');
		  }
		
	}
};
module.exports=lib;
