var express = require('express')
    ,path = require('path')
    ,bodyParser = require('body-parser')
    ,cheerio = require('cheerio')
    ,requesturl = require('request')
    ,URL = require('url-parse')
    ,app = express()
    ,http = require('http').Server(app)
    ,io = require('socket.io')(http);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

var images = []
    ,toCrawl = ""
    ,visitedPage = {}
    ,imagesNum = 0
    ,pagesToVisit = []
    ,baseurl = ""
    ,url = "";


io.on('connection', function(socket) {
   
    socket.on('getimage', function(data) {
        
        visitedPage = {};
        imagesNum = 0;
        pagesToVisit = [];
        images = [];
        
        toCrawl = data;
        url = new URL(toCrawl);
        baseurl = url.protocol + '//' + url.hostname;
        
        pagesToVisit.push(baseurl);
        crawl();
    }); 
    
    function crawl() {
        let nextPage = pagesToVisit.pop();

        if(nextPage in visitedPage) {
            crawl();
        }
        else {
            crawlPage(nextPage, crawl);
        }
    }

    function crawlPage(page, callback) {

        visitedPage[page] = true;
        requesturl(page, function(err, res, body) {
            
            if(err) {
                socket.emit(err);
            }
            if(res.statusCode !== 200) {
                socket.emit('err');
                return;
            }
           
            getImage(body);
        });

    }

    function getImage(body) {

        let $ = cheerio.load(body);
        console.log($._root.children);
        if(images.length === 0) {
            collectLinks($);
        }
       
        $('img').each(function(i, e) {
            
            if($(this).attr('src') !== undefined) {
                images.push($(this).attr('src'));
            }
            if($(this).attr('data-src') !== undefined) {
                images.push($(this).attr('data-src'));
            }
            if($(this).attr('data-cfsrc') !== undefined) {
                images.push($(this).attr('data-cfsrc'));
            }
            imagesNum++;
        });
        
        if(imagesNum >= 25) {
            
            socket.emit('sendimage', {images: images, url: baseurl});
            return;
        }
             crawl();
    }

    function collectLinks($) {

        let link = $("a[href^='/']");

        link.each(function(i, e) {
          pagesToVisit.push(baseurl + $(this).attr('href'));
        });
    }
});

app.use(express.static(path.join(__dirname, 'public')));

var port = process.env.PORT || 3000;
http.listen(port, function() {
   
    console.log("connected");
});