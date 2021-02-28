const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const productRoutes = require('./api/routes/products');
const orderRoutes = require('./api/routes/orders');

//connecting mongoDB
const mongoDB_URI = 'mongodb+srv://minsookime:' + process.env.MONGO_ATLAS_PW + '@cluster0.tfwft.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';

mongoose.connect(mongoDB_URI, {
    useNewUrlParser: true, 
    useUnifiedTopology: true
});

mongoose.Promise = global.Promise;

mongoose.connection.on('connected', () => {
    console.log("Mongoose is connected!!!!");
});

// mongoose.connect('mongodb+srv://minsookime:restfulapipassword@cluster0.tfwft.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', {
//     useNewUrlParser: true
// });

// mongoose.connect('mongodb+srv://minsookime:' + process.env.MONGO_ATLAS_PW + '@cluster0.tfwft.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', {
//     useNewUrlParser: true
// });

app.use(morgan('dev'));
/*'/uploads ignores the /uploads when you access it in the browser cuz u gotta 
void the /uploads when accessing it normally which is inconvenient

http://localhost:3000/uploads/profile%20picture.JPG would normally not work
http://localhost:3000/profile%20picture.JPG this would only work 

but now with 'uploads', the top method with /uploads path works but not the bottom method*/
app.use('/uploads', express.static('uploads')); //makes the 'uploads' folder publically available so iamge can be accessed using GET
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//CORS error handling
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
        'Acess-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
        return res.status(200).json({});
    }
    next();
})
//Routes handling requests
app.use('/products', productRoutes);
app.use('/orders', orderRoutes);

//Error handling
app.use((req, res, next) => {
    const error = new Error('Not Found');
    error.status = 404; 
    next(error);
});

app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message
        }
    })
})
module.exports = app;