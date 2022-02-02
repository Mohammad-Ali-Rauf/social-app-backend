const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const config = require('config');

// @route POST /api/users
// @desc  Register a User
// @access Public
router.post("/", [
    check('name', "Please enter at least 5 characters").isLength({ min: 5 }),
    check('email', "Enter a valid Email").isEmail(),
    check('password', "Password must be at least 3 characters").isLength({ min: 3 }),
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name , email , password } = req.body;

    const user = new User({
        name,
        email,
        password
    })

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt)

    try {
        const checkUser = await User.findOne({ email }).select({ password: 0 });
        if(checkUser) return res.status(400).json({ msg: 'User already exists.' })

        await user.save();
        
        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(payload, config.get("jwtSecret"), {
            expiresIn: 1000000000
        }, (err, token) => {
            if(err) throw err;
            res.status(200).json({ token })
        })

    } catch (err) {
        console.log("Error ", err.message);
        res.status(500).json({ msg: "Server Error" })
    }
})

module.exports = router;