var request = require('request');
var cheerio = require('cheerio');
var mysql = require('mysql');

var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'r',
  database: 'web-crawler'
});


function crawl() {
  const url = "https://finance.google.com/finance";
  request(url, function(error, response, body) {
    if (error) {
      console.log("Check your connection");
    }
    if (response.statusCode == 200) {
      console.log("New Connection at: " + new Date());
      parseData(body);
    }
  });
}

function parseData(body) {

  var $ = cheerio.load(body);
  var markets = $('#markets > div[class="sfe-section"] > table > tbody');
  var tbodyChildren = markets['0'].children;

  for (var tbodyChild in tbodyChildren) {
    var trChildren = tbodyChildren[tbodyChild].children;
    for (var trChild in trChildren) {
      if (trChildren[trChild].name === 'td') {
        tdChildren = trChildren[trChild].children;
        var symbol, price, changeAmount, changePercent;
        for (tdChild in tdChildren) {
          if (tdChildren[tdChild].type !== 'text') {
            if (tdChildren[tdChild].name === 'a') {
              symbol = tdChildren[tdChild].children[0].data.replace(/\n/g, '');
            }
            if (tdChildren[tdChild].parent.attribs.class === 'price') {
              price = tdChildren[tdChild].children[0].data.replace(/\n/g, '');
            }
            if (tdChildren[tdChild].parent.attribs.class === 'change') {
              var data = tdChildren[tdChild].children[0].data.replace(/\n/g, '');
              if (data[0] === '(') {
                changePercent = data;
              } else {
                changeAmount = data;
              }
            }
          }
        }
      }
    }
    saveToDatabase({
      'symbol': symbol,
      'price': price,
      'changeAmount': changeAmount,
      'changePercent': changePercent
    });
  }
}

function saveToDatabase(data) {
  var sql = "INSERT INTO stocks(symbol, price, change_amount, change_percent) VALUES(?, ?, ?, ?);";
  connection.query(sql, [data.symbol, data.price, data.changeAmount, data.changePercent], function(error, result, fields) {
    if (error) throw error;
  });
}

function makeDatabase() {
  var schema = 'CREATE TABLE stocks( \
      id             INT NOT NULL AUTO_INCREMENT, \
      symbol         VARCHAR(255) NOT NULL, \
      price          VARCHAR(255) NOT NULL, \
      change_amount  VARCHAR(255) NOT NULL, \
      change_percent VARCHAR(255) NOT NULL, \
      created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, \
      PRIMARY KEY    (id) \
    );';

  connection.query(schema, function(error, result, fields) {
    if (error) throw error;
  });
}

makeDatabase();
var handle = setInterval(crawl, 300000);
