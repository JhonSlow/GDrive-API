// Client ID e API KEY para usar a api
var CLIENT_ID = '984617940870-r59l0ff6ibuadud6j3e7vb8n1pofr3fu.apps.googleusercontent.com';
var API_KEY = 'AIzaSyAe4A_kbiAhVRh7w11wq7BEAYOTXzRfCQw';

//inports da api
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
var SCOPES = "https://www.googleapis.com/auth/drive";
var DOWNLOAD_URL = "https://www.googleapis.com/drive/v3/files/";

var authorizeButton = document.getElementById('authorize-button');
var signoutButton = document.getElementById('signout-button');
var buttons = $("#hide");



function initClient() {
    gapi.client.init({
      apiKey: API_KEY,
      clientId: CLIENT_ID,
      discoveryDocs: DISCOVERY_DOCS,
      scope: SCOPES
    }).then(function () {
          // Listen for sign-in state changes.
          gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

          // Handle the initial sign-in state.
          updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
          authorizeButton.onclick = handleAuthClick;
          signoutButton.onclick = handleSignoutClick;
        }, function(error) {
          appendPre(JSON.stringify(error, null, 2));
        });
      }

  
  //chamando a biblioteca auth2 e API client.
  function handleClientLoad() {
    gapi.load('client:auth2', initClient);
    console.log("load ok");
}

function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        authorizeButton.style.display = 'none';
        signoutButton.style.display = 'block';
        buttons.css("display", "block");
        listFiles();
    } else {
        authorizeButton.style.display = 'block';
        signoutButton.style.display = 'none';
        buttons.css("display", "none");
    }
}


// upload arquivo
function insertFile(fileData, callback) {
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    var reader = new FileReader();
    reader.readAsBinaryString(fileData);
    reader.onload = function (e) {
        var contentType = fileData.type || 'application/octet-stream';
        var metadata = {
            'title': fileData.name,
            'mimeType': contentType
        };

        var base64Data = btoa(reader.result);
        var multipartRequestBody =
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            'Content-Type: ' + contentType + '\r\n' +
            'Content-Transfer-Encoding: base64\r\n' +
            '\r\n' +
            base64Data +
            close_delim;

        var request = gapi.client.request({
            'path': '/upload/drive/v2/files',
            'method': 'POST',
            'params': {'uploadType': 'multipart'},
            'headers': {
                'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
            },
            'body': multipartRequestBody
        });
        if (!callback) {
            callback = function (file) {
                console.log(file);
            };
        }
        request.execute(callback);
    }
}
//baixar aquivo
function downloadFile(fileId, callback) {
    var url = DOWNLOAD_URL + fileId + "?alt=media";
    var reader = new FileReader();
    console.log(fileId);
    if (url) {
        var accessToken = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token;
        var xhr = new XMLHttpRequest();
        xhr.responseType = "blob";
        xhr.open('GET', url);
        xhr.setRequestHeader('Authorization', 'Bearer' + accessToken);
        xhr.onload = function () {
            console.log(xhr.response);

            var a = document.createElement("a");
            a.style = "display: none";
            document.body.appendChild(a);
            var url = window.URL.createObjectURL(xhr.response);
            a.href = url;
            a.download = fileObj[fileId];
            a.click();
            window.URL.revokeObjectURL(url);
        };
        xhr.onerror = function () {
            console.log(null);
        };
        xhr.send();
    } else {
        console.log(null);
    }
}

//apagar arquivo
function deleteFile(fileId) {
    var request = gapi.client.drive.files.delete({
        'fileId': fileId
    });
    request.execute(function (resp) {
    });
}

$(document).on("click", "#lessen", function () {

    if (arguments.length == 1) data = arguments[0];
});

function hideWelcome() {
    $("#upload-success").hide("slow");
}

function success() {
    console.log("sucesso");
    $("#upload-success").show();

    var tim = setTimeout(hideWelcome, 3000);
    console.log(tim);
}

function myFile(file) {
    insertFile(file[0], success);
}

function handleAuthClick(event) {
    gapi.auth2.getAuthInstance().signIn();
}

function handleSignoutClick(event) {
    gapi.auth2.getAuthInstance().signOut();
    location.reload();
}

function appendPre(message, fileId, file) {
    var pre = document.getElementById('content');
    var textDiv = $("#con").clone();

    textDiv.text(message);
 
    textDiv.appendTo(pre);
  
    if (arguments.length == 3) {
        var newButton = $("#b").clone();
        newButton.attr("id", fileId);
        newButton.appendTo(pre);
        var ddButton = $("#d").clone();
        ddButton.attr("id", "d" + fileId);
        ddButton.appendTo(pre);
    }

}


var fileObj = {};


//lista de qrquivos
function listFiles() {
    gapi.client.drive.files.list({
        'pageSize': 500,
        'fields': "nextPageToken, files(id, name)"
    }).then(function (response) {
        var files = response.result.files;
        console.log(files.length);
        if (files && files.length > 0) {
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                appendPre(file.name /*+ ' (' + file.id + ')'*/, file.id.toString(), file);
                fileObj[file.id] = file.name;

            }
        } else {
            appendPre('No files found.');
        }
    });
}

function readTextFile(file)
{
    var client = new XMLHttpRequest();
    client.open('GET', file);
    client.onreadystatechange = function() {
        console.log(client.responseText);
        CLIENT_ID = client.responseText;
    }
    client.send();
}