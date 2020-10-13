/////////////////////////////////////////////////////////////////////////////////////////////////////////
const fs = require('fs');
const execSync = require('child_process').execSync;
const openssl=require(__path+'lib/openssl.lib.js');
const apiLib=require(__path+'lib/api.lib.js');
const x509 = require('x509');
var API=new apiLib({host:config.ca.host,publicKey:config.ca.publicKey,secretKey:config.ca.secretKey});
/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
var main = {
	start:async function(callback){
		if(!fs.existsSync(__root+'data/root_ca.crt'))await main.installCaCrt();
		let res = await main.createCrtIfNotExists();
		if(res===false)return false;
		main.monitoringProcess();
		main.monitor = setInterval(main.monitoringProcess, 1000*60*Number(config.monitoringInterval_InMin));
		if(typeof callback=='function')callback();
	},
	installCaCrt:async function(){
		var responce = await API.get('download','',null,false);
		if(!responce.success)return;
		var ca=responce.result.ca;
		fs.writeFileSync(__root+'data/root_ca.crt', ca);
		fs.writeFileSync('/etc/pki/ca-trust/source/anchors/root_ca.crt', ca);
		execSync('update-ca-trust');
	},
	monitor:null,
	monitoringProcess:async function(){
		//console.log('Monitoring process;');
		for(let i in config.certs){
			let item=config.certs[i];
			if(!fs.existsSync(item.certFile))await main.createCrt(item);
			else{
				var certData = x509.parseCert(item.certFile);
				var daysToExpirate=Math.floor((+certData.notAfter-Date.now())/1000/60/60/24);
				if(daysToExpirate<3)await main.createCrt(item);
			}
		}
	},
	createCrtIfNotExists:async function(){
		for(let i in config.certs){
			let item=config.certs[i];
			if(typeof item.caFile!='undefined'&&!fs.existsSync(item.caFile))main.copyCaFile(item.caFile);
			if(!fs.existsSync(item.keyFile)||!fs.existsSync(item.certFile)){
				if(!fs.existsSync(item.keyFile))openssl.createKey(item.keyFile);
				let res = await main.createCrt(item);
				if(res===false)return false;
			}
		}
		return true;
	},
	copyCaFile:function(path){
		fs.copyFileSync(__root+'data/root_ca.crt', path, fs.constants.COPYFILE_EXCL);
	},
	createCrt:async function(item){
		let name=openssl.genTmpNeme();
		openssl.createCsr(item.keyFile,__root+'data/.tmp/'+name+'.csr',item.options);
		let csr=fs.readFileSync(__root+'data/.tmp/'+name+'.csr','utf8');
		fs.unlinkSync(__root+'data/.tmp/'+name+'.csr');
		try{
			var responce = await API.get('cert/signcsr','',{csr:csr});
		}catch(err){setTimeout(()=>{restart();},30000);return false;}
		if(responce.result.cert)fs.writeFileSync(item.certFile, responce.result.cert,{ flag: 'w+' });
		//console.log('Certificate created;');
		return true;
	}
};
module.exports=main;