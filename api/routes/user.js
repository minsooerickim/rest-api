const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('../models/user');
// const { token } = require('morgan');

router.post('/signup', (req, res, next) => {
    //checking for duplicate emails
    User.find({email: req.body.email})
        .exec()
        .then(user => {
            if (user.length >= 1) /*if >= 0 then no previous email exists*/{
                return res.status(409).json({
                    message: 'email already exists'
                });
            }
            else {
                //hashing then go onto the creating user
                bcrypt.hash(req.body.password, 10, (err, hash) => {
                    if (err) {
                        return res.status(500).json({
                        error: err
                    });
                    }
                    else {
                        const user = new User({
                        _id: new mongoose.Types.ObjectId(),
                        email: req.body.email,
                        password: hash
                    });
                    user
                        .save()
                        .then(result => {
                            console.log(result);
                            res.status(201).json({
                                message: 'User created'
                            });
                        })
                        .catch(err => {
                            console.log(err);
                            res.status(500).json({
                                error: err
                            });
                        });
                    }
                })
            }
        })
});

router.post('/login', (req, res, next) => {
    User.find({ email: req.body.email })
        .exec()
        .then(user => {
            //if we have no users
            if (user.length < 1) {
                return res.status(401).json({
                    message: 'Auth failed'
                });
            }
            /*
            bcrypt documentation

            bcrypt.compare(myPlaintextPassword, hash, function(err, result) {
                result == true
            });
            */
            bcrypt.compare(req.body.password, user[0].password, (err, result) => {
                if (err) {
                    return res.status(401).json({
                        message: 'Auth failed'
                    });
                }
                if (result) {
                    /*
                        jwt usage
                            jwt.sign(payload, secretOrPrivateKey, [options, callback])
                        payload = information we want to pass
                    */

                    //assigning to 'const token' which allows us to omit 'callback' argument 
                    const token = jwt.sign(
                        //'payload'
                        {
                            email: user[0].email,
                            userId: user[0]._id
                        }, 
                        //privateKey (env key)
                        // process.env.JWT_KEY,
                        'youwillneverguessit',
                        //time
                        {
                            expiresIn: "1h"
                        }
                    );
                    return res.status(200).json({
                        message: 'Auth successful',
                        token: token
                    });
                }
                return res.status(401).json({
                    message: 'Auth failed'
                });
            });
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
})

router.delete('/:userId', (req, res, next) => {
    User.remove({_id: req.params.userId})
        .exec()
        .then(result => {
            res.status(200).json({
                message: 'User deleted'
            });
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
})

//get all users
router.get('/', (req, res, next) => {
    User.find()
        .select('email _id')
        .exec()
        .then(docs => {
            res.status(200).json({
                count: docs.length,
                users: docs.map(doc => {
                    return {
                        _id: doc._id
                    }
                })
            })
        })
        .catch(err => {
            res.status(500).json(err);
        })
})

module.exports = router;