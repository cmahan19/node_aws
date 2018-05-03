/**
 * Author   Chris Mahan
 * Email    cjmahan19@gmail.com
 * 
 */

// ==========================
// Accquire packages
// ==========================
const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require('socket.io')(http);
const AWS = require('aws-sdk');

// ==========================
// Express Configurations
// ==========================
app.use(express.static(__dirname + "/public"));

// ==========================
// AWS Configurations
// ==========================
AWS.config.update({ region: 'us-west-2' });                             // Set the AWS region
var s3 = new AWS.S3({ apiVersion: '2006-03-01' });                      // Create S3 service object
var cloudwatch = new AWS.CloudWatch({ apiVersion: '2010-08-01' });      // Create a cloudwatch instance

// ==========================
// Global Scope Variables
// ==========================
const AWS_Stats = {                                                     // An object to hold the AWS stats
    numFilesInBucket: -1,
    numFilesOutBucket: -1,
    inBucketSize: -1,
    outBucketSize: -1
};

// ==========================
// Fetch AWS Stats
// ==========================
const UPDATE_INTERVAL = 1000 * 3600 * 6;                                // Update every 6 hours
function fetchStats() {
    var params = {
        DashboardName: "BucketInfo"
    };
    cloudwatch.getDashboard(params, function (err, data) {
        if (err) console.log(err, err.stack);
        else {
            console.log("Stat fetch to be developed...");
        }
    });
}
// fetchStats();
// setInterval(fetchStats, UPDATE_INTERVAL);

// ==========================
// Socket Connection
// ==========================
io.on('connection', function (socket) {
    console.log("user connected");

    // Request from the client to list the buckets' names
    s3.listBuckets(function (err, data) {
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
                    if (numSuccess === query.files.length) {
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