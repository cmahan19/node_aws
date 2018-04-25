// ==========================
// Accquire packages
// ==========================
var express = require("express");
var app = express();
var http = require("http").Server(app);
var io = require('socket.io')(http);
var AWS = require('aws-sdk');

// ==========================
// Configurations
// ==========================
app.use(express.static(__dirname + "/public"));
AWS.config.update({ region: 'us-west-2' });         //set the AWS region
s3 = new AWS.S3({ apiVersion: '2006-03-01' });      // Create S3 service object

// ==========================
// Socket connection
// ==========================
io.on('connection', function (socket) {
    console.log("user connected");
    
    // Request from the client to list the buckets' names
    s3.listBuckets(function(err, data) {
        if (err) {
            console.log(err, err.stack);
        } else {
            var bucketsList = data.Buckets;
            socket.emit("listBuckets", bucketsList);
        }
    });
    
    // Request from the client to list the object in selected the bucket
    socket.on("listObjects", (bucketName) => {
        console.log(`Requesting bucket: ${bucketName}`);
        var params = {
            Bucket: bucketName,
            // MaxKeys: 2      // Requesting 2 files at a time. later this will be set to 100
        };
        s3.listObjectsV2(params, function (err, data) {
            if (err) {
                console.log(err, err.stack);
            } else {
                var objectsList = data.Contents;
                socket.emit("bucketList", objectsList);
            }
        });
    });

    socket.on("copyFile", function (query) {
        var numSuccess = 1;         // Number of successful copies done
        query.files.forEach((file) => {
            var params = {
                Bucket: query.dest,
                CopySource: "/" + query.source + "/" + file,
                Key: file
            };
            s3.copyObject(params, function (err, data) {
                if (err) {
                    console.log(err, err.stack);
                } else {
                    if(numSuccess === query.files.length) {
                        socket.emit("copySuccess");
                    } else {
                        numSuccess++;
                    }
                }
            });
        });
    });

});



// ==========================
// Server Info
// ==========================
const IP = "127.0.0.1";
const PORT = "3000";
http.listen(PORT, IP, () => {
    console.log(`Server is up at ${IP}:${PORT}`);
});