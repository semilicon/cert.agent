/////////////////////////////////////////////////////////////////////////////////////////////////////////
const cluster = require('cluster');
const fs = require('fs');
const pathParser = require('path');
/////////////////////////////////////////////////////////////////////////////////////////////////////////
const countCPUs = require('os').cpus().length;
const use_forks_for_http=(config.use_forks_for_http)?config.use_forks_for_http:Math.ceil((countCPUs<2)?1:countCPUs-1);
var lib={
	forks:[],
	init:function(){
		cluster.on('exit', (brokenFork, code, signal) => {//если форк умер
			console.log('Worker #'+brokenFork.id+' is exterminated;');
			//возродить форк
			let newfork=cluster.fork({role:brokenFork.role});
			lib.forks[newfork.id]=newfork;
			lib.forks[newfork.id].role=brokenFork.role;
			lib.forks[newfork.id].on('message', function(msg){
				if (msg.cmd && msg.cmd === 'restart') lib.killForks()
			});
			delete lib.forks[brokenFork.id];
		});
	},
	developerMode:function(on){
		if(on){
			var allFiles={};
			var addAllFiles=function(path){
				var dir_es = fs.readdirSync(path);
				for (let i in dir_es) {
					let stat=fs.statSync(path+dir_es[i]);
					allFiles[path+dir_es[i]]=+stat.ctime;
					if(stat.isDirectory())addAllFiles(path+dir_es[i]+'/');
				}
			};
			allFiles[__path]=+fs.statSync(__path).ctime;
			addAllFiles(__path);
			var binChanges=function(){
				for (let i in allFiles) {
					if(+fs.statSync(i).ctime!=allFiles[i]){
						reloadApp();
						break;
					}
				}
			};
			var reloadApp=function(){
				console.log('#reloadApp;\n--------------------------------------');
				allFiles={};
				allFiles[__path]=+fs.statSync(__path).ctime;
				addAllFiles(__path);
				lib.killForks();
			}
			setInterval(binChanges, 1000);
		}
	},
	killForks:function(){//функция завершения работы потомков (убивает потомков)
		for (const i in lib.forks){
			lib.forks[i].process.kill();
		}
	},
	startHttpForks:function(){
		for (let i = 0; i < use_forks_for_http; i++) {
			let fork=cluster.fork({role:'http'});
			lib.forks[fork.id]=fork;
			lib.forks[fork.id].role='http';
			lib.forks[fork.id].on('message', function(msg){
				if (msg.cmd && msg.cmd === 'restart') lib.killForks()
			});
		}
		console.log('Forks started ('+(use_forks_for_http)+')');
	},
	startHandlersForks:function(){
		let handlers = fs.readdirSync(__path+'handlers/');
			for (let i in handlers) {
				let name =pathParser.basename(handlers[i],'.js');
				if(fs.existsSync(__path+'handlers/'+name+'.js')){
					let fork=cluster.fork({role:name+'.handler'});
					lib.forks[fork.id]=fork;
					lib.forks[fork.id].role=name+'.handler';
					lib.forks[fork.id].on('message', function(msg){
						if (msg.cmd && msg.cmd === 'restart') lib.killForks()
					});
				}
			}
	}
}
module.exports=lib;
