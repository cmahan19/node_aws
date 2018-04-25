/** 
 * Author   Chris Mahan
 * 
 * 
*/
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
app.use(express.static(__dirname + "/public"));             // Use the public folder to connect with client
AWS.config.update({ region: 'us-west-2' });                 //set the AWS region
s3 = new AWS.S3({ apiVersion: '2006-03-01' });              // Create S3 service object
var cw = new AWS.CloudWatch({apiVersion: '2010-08-01'});    // Create CloudWatch service object

// ==========================
// Socket connection
// ==========================
io.on('connection', function (socket) {                     //Connection with the client.
    console.log("user connected");

    // Request from the client to list the buckets' names
    //Desc: listbuckets() returns a list of buckets from AWS
    s3.listBuckets(function(err, data) {
        if (err) {
            console.log(err, err.stack);
        } else {
            var bucketsList = data.Buckets;
            socket.emit("listBuckets", bucketsList);
        }
    });
    
    // Request from the client to list the object in selected the bucket
    // Desc: listobjects() returns a list of objects contained in specified s3 bucket from AWS
    socket.on("listObjects", (bucketName) => {
        console.log(`Requesting bucket: ${bucketName}`);
        var params = {
            Bucket: bucketName,
             MaxKeys: 25      // Requesting number of files files at a time. later this will be set to 100
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

    // Request from the client to copy objects from one bucket to anouther
    // Desc: copyfile() Copy an object from one s3 bucket to anouther s3 bucket
    socket.on("copyFile", function (query) {
        var numSuccess = 1;                            // Number of successful copies done
        query.files.forEach((file) => {                // loop through and copy each file the user checked 
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