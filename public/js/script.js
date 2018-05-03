var sourceBucket;   // Global variable to keep track of what the source bucket is
var socket = io();

socket.on("listBuckets", function (bucketList) {
    var buckets = ["bucket-list", "dest-bucket"];
    buckets.forEach(function (bucket) {
        var dropDown = document.getElementById(bucket);
        dropDown.innerHTML = "";
        bucketList.forEach(function (item) {
            var option = document.createElement("option");
            option.value = item.Name;
            option.text = item.Name;
            dropDown.add(option);
        });
    });
});

// Populate the table from the data received
socket.on("bucketList", function (theList) {
    var tbody = document.getElementById("list-tbody");
    tbody.innerHTML = "";   // Remove the old list from the table
    theList.forEach(item => {
        var newRow = tbody.insertRow(tbody.rows.length);

        var newCell = newRow.insertCell(0);
        var checkbox = document.createElement('input');
        checkbox.type = "checkbox";
        checkbox.name = item.Key;
        checkbox.value = item.Key;
        checkbox.id = item.Key;
        newCell.appendChild(checkbox);

        newCell = newRow.insertCell(1);
        var newText = document.createTextNode(item.Key);
        newCell.appendChild(newText);

        newCell = newRow.insertCell(2);
        var newDate = document.createTextNode(item.LastModified);
        newCell.appendChild(newDate);
    });
});

socket.on("copySuccess", function () {
    alert("Copy success!");
});

function getObjects() {
    var selected = document.getElementById("bucket-list");          // Get the currently selected bucket's name
    var bucket = selected.options[selected.selectedIndex].value;    // Get the currently selected bucket's name
    sourceBucket = bucket;
    socket.emit('listObjects', bucket);
    var checkAllBox = document.getElementById("checkbox-all");      // Find the DOM element check-all-box
    checkAllBox.removeAttribute("disabled");                        // Re-enable the button after listing the objects
}

function copyItems() {
    var query = {};                                                 // All the info about the files that are going to be copied
    var selectedItems = [];                                         // Contains the ETags of the files that are selected
    var checkboxs = document.querySelectorAll("tbody td input");    // Select all the checkboxs in cell #2
    checkboxs.forEach(function (checkbox) {
        if (checkbox.checked) {
            selectedItems.push(checkbox.id);
        }
    });

    selected = document.getElementById("dest-bucket");              // Get the source bucket's name
    bucket = selected.options[selected.selectedIndex].value;        // Get the source selected bucket's name
    query.dest = bucket;

    query.source = sourceBucket;                                    // Source bucket is a global variable

    query.files = selectedItems;
    socket.emit("copyFile", query);
}

function copyFile() {
    var info = {};
    info.source = document.getElementById("source").value;
    info.destination = document.getElementById("destination").value;
    info.filename = document.getElementById("filename").value;
    socket.emit("copyFile", info);
}

function uploadFile() {
    var selectedFile = document.getElementById('file-upload-btn').files[0];
    console.log(selectedFile);
}

(function checkAll() {                                             // Select all the files from the list when check-all button is clicked
    var checkAllBox = document.getElementById("checkbox-all");
    checkAllBox.addEventListener("click", function(event) {
        var checkboxs = document.querySelectorAll("tbody td input");// Select all the checkboxs in cell #2
        checkboxs.forEach(function (checkbox) {
            if(checkAllBox.checked == true) {
                checkbox.checked = true;
            } else {
                checkbox.checked = false;
            }

        });
    });
}());   // Self-invoking