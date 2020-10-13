/////////////////////////////////////////////////////////////////////////////////////////////////////////
//											REST API Lib											   //
/////////////////////////////////////////////////////////////////////////////////////////////////////////
	const fs = require('fs');	
	const request = require('request');
	const crypto = require('crypto');
	var {promisify} = require('util');
/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
	class api {
		constructor(options) {
			this.options={
				host:'',
				publicKey:'',
				secretKey:''
			}
			if(options.host)this.options.host=options.host;
			if(options.publicKey)this.options.publicKey=options.publicKey;
			if(options.secretKey)this.options.secretKey=options.secretKey;
		}
		async get(action,query,data,strictSSL) {
			if(typeof strictSSL=='undefined')strictSSL=true;
			action=action.trim().replace(/^\/+|\/+$/g,"");
			if(typeof query=='object'){
				let newQueryParts=[];
				for(let key in query){
					let val=key+'=';
					switch(typeof query[key]){
						case 'string':
						case 'number':
						case 'boolean':
						case 'bigint':
							val=val+query[key];
						break;
						case 'bigint':
							val=val+JSON.stringify(query[key]);
						break;
						case 'undefined':
						break;
					}
					newQueryParts.push(val)
				}
				query=newQueryParts.join('&');
			}
			var body;
			if(data&&typeof data=='object')body=JSON.stringify(data);
			else if(data&&typeof data=='string')body=data;
			else body='';
			const nonce = +new Date();
			query=query+((query!='')?'&':'')+'publickey='+this.options.publicKey;
			query=query+((query!='')?'&':'')+'nonce='+nonce;
			const signbody=query+body;
			const signature = crypto.createHmac('sha256', this.options.secretKey).update(signbody).digest('hex');
			var url=this.options.host+action+'/?'+query+((query!='')?'&':'')+'signature='+signature;
			//console.log(url)
			if(data){
				var options={
					method:'POST',
					url:url,
					headers:{'Content-Type':'application/json'},
					body:body
				}
				if(strictSSL==false)options.strictSSL=false;
				else options.ca=fs.readFileSync(__root+'data/root_ca.crt');
			}else{
				var options={
					method:'GET',
					url:url
				}
				if(strictSSL==false)options.strictSSL=false;
				else options.ca=fs.readFileSync(__root+'data/root_ca.crt');
			}
			var response=await promisify(request)(options);
			
			let jsonBody={};
			try{
				jsonBody=JSON.parse(response.body);
			}catch(err){
				return null;
			}
			return jsonBody;
		}
	};
/////////////////////////////////////////////////////////////////////////////////////////////////////////
module.exports=api;