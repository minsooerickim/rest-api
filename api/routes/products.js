const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const checkAuth = require('../middleware/check-auth');

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './uploads/'); //folder isn't publically accessible by defailt
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname);
    }
});

//filtering which files to accept or reject
const fileFilter = (req, file, cb) => {
    //reject a file by calling cb(null, false);
    //accept by calling cb(null, true);
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
    }
    else {
        cb(null, false);
    }
};
//folder where multer puts all incoming files into;
// const upload = multer({dest: 'uploads/'}); 

//using storage strategie defined above indicating destination folder and name
const upload = multer({
    storage: storage, 
    limits: {
        fileSize: 1024 * 1024 * 5 //only accepting files up to 5 mb
    },
    fileFilter: fileFilter
});

const Product = require('../models/product');

//GET all products
router.get('/', (req, res, next) => {
    Product.find()
        .select ('name price _id productImage')
        .exec()
        .then(docs => {
            const response = {
                count: docs.length,
                products: docs.map(doc => {
                    return {
                        name: doc.name,
                        price: doc.price,
                        productImage: doc.productImage,
                        _id: doc._id,
                        request: {
                            type: 'GET',
                            url: 'http://localhost:3000/products/' + doc._id
                        }
                    }
                })
            }
            res.status(200).json(response);
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
               error: err 
            });
        });
});
//arguments run left to right, so we add middleware(checkAuth) 2nd to check auth (protecting the route)
router.post('/', checkAuth, upload.single('productImage')/*single means it only takes and parses one file, and 'productImage' is the name for the file*/, (req, res, next) => {
    console.log(req.file); //req.file is new object available with the upload.single('productImage')
    const product = new Product({
        _id: new mongoose.Types.ObjectId(),
        name: req.body.name,    //now using multer's req.body not obody-parser
        price: req.body.price,   //same typing as body-parser but is using multer's since its form data not JSON
        productImage: req.file.path //getting url of the image passed in
    });

    product
        .save()
        .then(result => {
            console.log(result);
            res.status(201).json({
                message: 'Created product successfully',
                createdProduct: {
                    name: result.name,
                    price: result.price, 
                    _id: result._id,
                    request: {
                        type: 'POST',
                        url: "http://localhost:3000/products/" + result._id
                    }
                }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
    });
});

//GET specific product
router.get('/:productId', (req, res, next) => {
    const id = req.params.productId; 

    Product.findById(id)
        .select('name price _id productImage')
        .exec()
        .then(doc => {
            console.log("From database", doc);
            if (doc) {
                res.status(200).json({
                    product: doc,
                    request: {
                        type: 'GET',
                        url: "http://localhost:3000/products/"
                    }
                });
            }
            else {
                res.status(400).json({message: 'No valid entry found for provided ID'});
            }
            res.status(200).json(doc);
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({error: err});
        }); 
});

router.patch('/:productId', (req, res, next) => {
    const id = req.params.productId;
    const updateOps = {};
    for (const ops of req.body) {
        updateOps[ops.propName] = ops.value;
    }
    Product.update({_id: id}, {$set: updateOps})
        .exec()
        .then(result => {
            res.status(200).json({
                message: 'Product Updated',
                request: {
                    type: 'GET',
                    url: 'http://localhost:3000/products/' + id
                }
            })
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
});

router.delete('/:productId', (req, res, next) => {
    const id = req.params.productId;
    Product.remove({_id: id})
        .exec()
        .then(result => {
            res.status(200).json({
                message: 'Product deleted',
                request: {
                    type: 'POST',
                    url: 'http://localhost:3000/product',
                    data: { name: 'String', price: 'Number' }
                }
            });
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
});

module.exports = router;