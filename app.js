
    var express = require('express');
    var app = express();
    var mongoose = require('mongoose');
    var path = require('path');
    var port = Number(process.env.PORT || 3000);
    var request = require('request');
    const KEY = process.env.GOOGLE_API_KEY;
    const CX = process.env.GOOGLE_API_CX;

    //// Google Custom Search Engine
    /*
        q =          search string
        searchType = image
        start =      offset
        
    */

        var mongourl = (process.env.MONGO_URI || 'mongodb://localhost/imgsearch')   // connect to mongoLab db
        var Search = new mongoose.Schema({
            term: String,
            time : Date
        })

        var searchModel = mongoose.model('Search', Search);
        var search = new searchModel();

        db = mongoose.connect(mongourl, function(err) {
            if (err) {
                console.log(err);
            } else { 
                console.log('Connection to MongoDB successfully established!')
            }
        })

    app.get('/', function(req, res) {
        res.sendFile(path.join(__dirname + '/index.html'));
    });


    app.get('/search/:find', function(req, res) {
        var term = req.params.find;   //// localhost/search/cats?offset=2   returns value - cats
        var offset = req.query.page * 10 + 1 - 10;  ////                                returns value - 2

        var url = "https://www.googleapis.com/customsearch/v1?q="+term+"&searchType=image&start="+offset+"&key="+KEY+"&cx="+CX;        


        searchModel.create({term: term, time: new Date()}, function(err, srch) {
            if (err) throw err;
            console.log('Search term saved! ',"term: " + srch.term, "time: " + srch.time)
        });


        request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            body = JSON.parse(body);
            var obj = [];

        Object.keys(body.items).forEach(key => {
            var item = body.items[key];

            obj.push({'title'    : item.title,
                      'url'      : item.link,
                      'thumbnail': item.image.thumbnailLink,
                      'context'  : item.image.contextLink
                    });
        });
            res.json(obj)

        } else {
            res.json({'Error' : 'Cannot retrieve data.'})
        }
        })

    });

    app.get('/latest/', function(req, res) {
        
        searchModel.find({}).sort('-time').limit(10).select('-_id -__v').exec(function(err, posts){
            res.json(posts)
        })

    });

    app.listen(port, function(err) {
        if (err) throw err;
        console.log('Listening on port ' + port);
    });