const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://saketahlawat:nitin@cluster0.ohd4krs.mongodb.net/Chat_multiroom');

const db = mongoose.connection;

db.on('error',console.error.bind(console,"database is not connected !"));

db.once('open',function(){
    console.log("database is connected successfully !");
});

module.exports = db;