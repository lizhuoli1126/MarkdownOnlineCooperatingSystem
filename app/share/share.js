var Duplex = require('stream').Duplex;
var sharejs = require('share');
var livedb = require('livedb');
var db = require('livedb-mongo')('mongodb://localhost:27017/test', {safe:true});
var backend = livedb.client(db);
var share = require('share').server.createClient({backend: backend});

console.log('MongoDB connect test OK!');

function communicate(client) {
    var stream = new Duplex({objectMode: true});

    stream._read = function() {};
    stream._write = function(chunk, encoding, callback) {
    if (client.state !== 'closed') {
        client.send(chunk);
    }
        callback();//write to stream
    };

    client.on('message', function(data) {
        console.log(data);
        stream.push(data);
    });

    client.on('close', function(reason) {
        stream.push(null);
        stream.emit('close');
    });

    stream.on('end', function() {
        client.close();
    });

    // Give the stream to sharejs
    return share.listen(stream);
};

function getSnapshot(projectID,docID,callback){
    backend.fetch(projectID,docID,function(err,snapshot){
        if(err){
            callback(false);
        }
        else{
            callback(snapshot);
        }
    })
}



function deleteDoc(projectID,docID,callback){
    backend.submit(projectID, docID, {del:true}, function(err) {
        if(err){
            callback(false);
        }
        else{
            callback(true);
        }
    });
}

function createDocFromContent(projectID,docID,docContent,callback){
    backend.submit(projectID, docID, {create:{type:'http://sharejs.org/types/textv1', data:{}}}, function(err) {
        if(err){
            callback(false);
        }
        else{
            backend.submit('users', 'fred', {v:1, op:[docContent]}, function(err) {
                if(err){
                    callback(false);
                }
                else{
                    callback(true);
                }
            });
        }
    });
}

exports.communicate = communicate;
exports.share = share;
exports.getSnapshot = getSnapshot;
exports.deleteDoc = deleteDoc;
exports.createDocFromContent = createDocFromContent;