var request = require('request');
var cheerio = require('cheerio');


function crawl() {
  const url = "https://finance.google.com/finance";
  request(url, function(error, response, body) {
    if (error) {
      console.log("Check your connection");
    }
    if(request.statusCode === 200){
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
  console.log(data);
}


var handle = setInterval(crawl, 300000);
