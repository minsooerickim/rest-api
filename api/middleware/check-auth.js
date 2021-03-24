const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    //format is from jwt github
    try {
        const token = req.headers.authorization.split(" ")[1]; //token returns "Bearer tokenblahblahblah" so we get rid of whitespace
        //if no token, or invalid token, then error
        const decoded = jwt.verify(token, 'restfulapipassword'/*process.env.JWT_KEY*/); //if verification succesful, returns decoded value
        req.userData = decoded; //adding a new field to req
        next();
    }
    catch (error) {
        return res.status(401).json({
            message: 'Auth failed'
        });
    };
};