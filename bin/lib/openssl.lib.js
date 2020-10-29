/////////////////////////////////////////////////////////////////////////////////////////////////////////
	const fs = require('fs');
	const execSync = require('child_process').execSync;
	const x509 = require('x509');
	const crypto = require('crypto');// шифрование, md5, sha256
	const isIp = require('is-ip');
/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
var lib={
	genTmpNeme:function(){
		return crypto.createHash('sha256').update(String(Date.now())).digest('hex');
	},
	createRootCA_ifNotExists:function(){
		if(fs.existsSync(__root+'data/root_ca.key')&&fs.existsSync(__root+'data/root_ca.crt'))return true;
		execSync('openssl genrsa -out '+__root+'data/root_ca.key 4096');
		execSync('openssl req -new -x509 -days 10950 -key '+__root+'data/root_ca.key -sha256 -out '+__root+'data/root_ca.crt -subj \'/O='+config.ca.organization+'\'');
	},
	createOrUpdateHostCert:function(){
		if(!fs.existsSync(__root+'data/server.key')||!fs.existsSync(__root+'data/server.crt'))return lib.createNewServerCert();
		var cert = x509.parseCert(__root+'data/server.crt');
		var daysToExpirate=Math.floor((+cert.notAfter-Date.now())/1000/60/60/24);
		if(daysToExpirate<5)return lib.createNewServerCert();
	},
	createNewServerCert:function(){
		let name=lib.genTmpNeme();
		lib.createKey(__root+'data/.tmp/'+name+'.key');
		lib.createCsr(__root+'data/.tmp/'+name+'.key',__root+'data/.tmp/'+name+'.csr',config.hostCert);
		lib.signCsr(name);
		fs.renameSync(__root+'data/.tmp/'+name+'.key',__root+'data/server.key');
		fs.renameSync(__root+'data/.tmp/'+name+'.crt',__root+'data/server.crt');
	},
	createNewCert:function(certData){
		let name=lib.genTmpNeme();
		lib.createKey(__root+'data/.tmp/'+name+'.key');
		lib.createCsr(__root+'data/.tmp/'+name+'.key',__root+'data/.tmp/'+name+'.csr',certData);
		if(certData.altnames&&certData.altnames.length>0)openssl.altnamesCnf(name,certData.altnames);
		lib.signCsr(name,(certData.altnames&&certData.altnames.length>0)?true:false);
		let crtBlock={
			key: fs.readFileSync(__root+'data/.tmp/'+name+'.key','utf8'),
			cert: fs.readFileSync(__root+'data/.tmp/'+name+'.crt','utf8'),
			ca: fs.readFileSync(__root+'data/root_ca.crt','utf8')
		}
		fs.unlinkSync(__root+'data/.tmp/'+name+'.key');
		fs.unlinkSync(__root+'data/.tmp/'+name+'.crt');
		return crtBlock;
	},
	createKey:function(path){
		execSync('openssl genrsa -out '+path+' 4096');
		return true;
	},
	createCsr:function(key_path,csr_path,certData){
		let subj=((certData.domain)?'/CN='+certData.domain+'':'')+((certData.organization)?'/O='+certData.organization+'':'')+((certData.locality)?'/L='+certData.locality+'':'')+((certData.countryCode)?'/C='+certData.countryCode+'':'');
		execSync('openssl req -sha256 -new -key '+key_path+' -out '+csr_path+' -subj \''+subj+'\'');
	},
	altnamesCnf:function(name,altnames){
		if(typeof altnames!='undefined'&&altnames.length>0){
			var alt_names=[];
			let dns=0;
			let ip=0;
			for(let i in altnames){
				let name=altnames[i];
				if(isIp(name)){
					alt_names.push('IP.'+ip+' = '+name); ip++;
				}else{
					alt_names.push('DNS.'+dns+' = '+name); dns++;
				}
			}
			var cnf='subjectAltName = @alt_names \n[alt_names] \n'+alt_names.join(' \n');
			fs.writeFileSync(__root+'data/.tmp/'+name+'.cnf', cnf);
		}
	},
	signCsr:function(name,altnames){
		if(!fs.existsSync(__root+'data/.tmp/'+name+'.csr'))return false;
		execSync('openssl x509 -sha256 -req -in '+__root+'data/.tmp/'+name+'.csr -CA '+__root+'data/root_ca.crt -CAkey '+__root+'data/root_ca.key -CAcreateserial -out '+__root+'data/.tmp/'+name+'.crt -days 365'+((altnames)?' -extfile '+__root+'data/.tmp/'+name+'.cnf':''));
		fs.unlinkSync(__root+'data/.tmp/'+name+'.csr');
		if(altnames)fs.unlinkSync(__root+'data/.tmp/'+name+'.cnf');
	},
	HostSertMonitor:null,
	startHostSertMonitor:function(){
		lib.HostSertMonitor = setInterval(lib.HostSertMonitorProcess, 1000*60*60*24);
	},
	HostSertMonitorProcess:function(){
		var cert = x509.parseCert(__root+'data/server.crt');
		var daysToExpirate=Math.floor((+cert.notAfter-Date.now())/1000/60/60/24);
		if(daysToExpirate<5){
			lib.createNewServerCert();
			restart();
		}
	}
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////
module.exports=lib;