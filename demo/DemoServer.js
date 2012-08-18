var http = require('http'),
  Result2Array = require('../src/resultset/Result2Array'),
  client = require('../index.js').createDefaultCUBRIDDemodbConnection();

//Note: Open http://localhost:8080 to test it

function resultToHtmlTable(result) {
  var ret = '';

  ret += '    <h1>Table `code` content</h1>';
  ret += '    <table border=1>';

  var arr = Result2Array.GetResultsArray(result);
  for (var i = 0; i < arr.length; i++) {
    ret += '      <tr>';
    for (var j = 0; j < arr[i].length; j++) {
      ret += '        <td>';
      ret += '          ' + arr[i][j];
      ret += '        </td>';
    }
    ret += '      </tr>';
  }
  ret += '    </table>';

  return ret;
}

http.createServer(function (request, response) {
  if (request.url == '/') {
    client.connect(function (err) {
      if (err) {
        response.end(err.message);
      } else {
        client.query('select * from code', function (err, result, queryHandle) {
          if (err) {
            response.end(err.message);
          } else {
            var output = '';
            output += '<html>';
            output += '  <head>';
            output += '    <title>CUBRID Node.js Driver test</title>';
            output += '    <style type="text/css">';
            output += '      html, body {';
            output += '        font: normal 0.9em arial, helvetica;';
            output += '      }';
            output += '    </style>';
            output += '  </head>';
            output += '  <body>';
            output += resultToHtmlTable(result);
            output += '  </body>';
            output += '</html>';
            client.closeRequest(queryHandle, function (err) {
              if (err) {
                response.end(err.message);
              } else {
                client.close(function (err) {
                  if (err) {
                    response.end(err.message);
                  }
                });
                response.writeHead(200, {'Content-Type' : 'text/html'});
                response.end(output);
              }
            })
          }
        })
      }
    })
  } else {
    response.writeHead(404, {'Content-Type' : 'text/plain'});
    response.end('Error: Unexpected request!');
  }
}).listen(8080, 'localhost');

