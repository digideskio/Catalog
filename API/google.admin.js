var sheetKeyPrivate = "1MJpC2n-ekpnRXaLsb7B4dI6VOQIzn1eZO61I7sy2yiA";

var google = require('googleapis');

var getDataList = function (auth, callback) {
    var sheets = google.sheets('v4');
    sheets.spreadsheets.values.get({
        auth: auth,
        spreadsheetId: sheetKeyPrivate,
        range: 'Sheet1',
    }, function (err, response) {
        if (err) {
            console.log('The API returned an error: ' + err);
            return;
        }
        var rows = response.values;
        callback(rows);
    });
};

var sheetWrite = function (auth, body, resCallback) {
    var offset = 3;
    var nextRow = 'A' + String(body.row + offset);

    var sheets = google.sheets('v4');
    sheets.spreadsheets.values.update({
        auth: auth,
        spreadsheetId: sheetKeyPrivate,
        range: nextRow,
        valueInputOption: "USER_ENTERED",
        resource: body.stdData,
    }, function (err, response) {
        if (err) {
            console.log(err);
            return;
        }
        console.log(response);
        resCallback(response);
    });
};

var deleteEntry = function (auth, index, resCallback) {
    var row = index[0];
    var offset = 1;
    var body = {
        "requests": [
            {
                "deleteDimension": {
                    "range": {
                        "sheetId": 0,
                        "dimension": "ROWS",
                        "startIndex": row,
                        "endIndex": row + offset
                    }
                }
            }
        ]
    };

    var sheets = google.sheets('v4');
    sheets.spreadsheets.batchUpdate({
        auth: auth,
        spreadsheetId: sheetKeyPrivate,
        resource: body
    }, function (err, response) {
        if (err) {
            console.log(err);
            return;
        }
        resCallback(response);
    })
};

exports.deleteEntry = deleteEntry;
exports.sheetWrite = sheetWrite;
exports.getDataList = getDataList;
