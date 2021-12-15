'use strict';
const https = require('https');
const AWS = require('aws-sdk');
// Set the region 
AWS.config.update({region: 'us-east-1'});
// Define o nome da tabela do DynamoDB
const table = '[ nome da tabela do DynamoDB aqui ]';

function gravaDynamoDB(json, callback) {
  console.log("Gravando no DynamoDB");
  // cria o objeto do dynamoDB
  const dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
  // parametros da inserção
  var params = {
    TableName: table,
    Item: {
      cep : { S: json.cep },
      logradouro: { S: json.logradouro },
      complemento: { S: json.complemento },
      bairro: { S: json.bairro },
      localidade: { S: json.localidade },
      uf: { S: json.uf },
      ibge: { S: json.ibge },
      gia: { S: json.gia },
      ddd: { S: json.ddd },
      siafi: { S: json.siafi }
    }
  };
  // insere os dados no dynamoDB
  dynamodb.putItem(params, function(err, data) {
    if (err) {
      console.log("Error", err);
      callback({ success: false, msg: 'Não foi possivel gravar dados no DynamoDB', data: {} });
    } else {
      console.log("Success", data);
      callback({ success: true, msg: 'Ok', data: { cep: json.cep } });
    }
  });
}

function viaCEP(cep, callback) {
  const url = `https://viacep.com.br/ws/${cep}/json/`;
  console.log('Consultando a URL:', url);
  https.get(url, (res) => {
    console.log('HTTP Status Code:', res.statusCode);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      // inicaliza o body
      let chunks = [];
      res.on('data', chunk => {
        // recebe todos os dados retornados
        chunks.push(chunk);
      });
      res.on('end', () => {
        // ao finalizar tranforma o resultado em JSON
        const body = Buffer.concat(chunks);
        const json = JSON.parse(body.toString());
        console.log("Retorno:");
        console.log(json);
        // faz a chamada da funcao para gravar no dynamoDB
        gravaDynamoDB(json, callback);
      });
    } else {
      console.log('Nao foi possível conectar ao serviço')
      console.log(res.statusMessage)
      callback({ success: false, msg: res.statusMessage, data: {} })
    }
  });
}
// funcao handler do lambda
module.exports.buscaCEP = (event, context, callback) => {
  console.log("Iniciando o lambda...")
  // faz a chamada da funcao para buscar o CEP
  viaCEP(event.cep, (r) => {
    // finaliza a execucao do lambda, o primeiro argumento do callback deve ser null (sinaliza q nao houve erro) e o segundo o resultado em objeto JSON
    callback(null, r);
  });
};
