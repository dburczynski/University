const express = require("express");
const router = new express.Router();
const User = require("../model");
const uuid = require("uuidv4").uuid;
// Passport.js i narzędzie do szyfrowania haseł
const passport = require("../passport");

const default_size = 5;
const default_dim = 9;
const default_max = 0;

// „wyłapywanie”  odwołań nieobsługiwanymi metodami HTTP
const rejectMethod = (_req, res, _next) => {
    // Method Not Allowed
    res.sendStatus(405);
};

router
    .route("/")
    .get((req, res) => {
        res.render("index", {
            isAuthenticated: req.isAuthenticated(),
            user: req.user,
        });
    })
    .all(rejectMethod);

router
    .route("/login")
    .get((req, res) => {
        if(req.isAuthenticated()) res.redirect("/")
        else res.render("login");
    })
    .post(passport.authenticate("local-login"), async (req, res) => {
        await res.redirect("/");
    })
    .all(rejectMethod);

router
    .route("/logout")
    .get((req, res) => {
        req.logout();
        res.redirect("/");
    })
    .all(rejectMethod);

    router
    .route("/register")
    .get((req, res) => {
      if (req.isAuthenticated()) res.redirect("/");
      else res.render("register");
    })
    .post(passport.authenticate("local-signup"), async (req, res) => {
      await res.redirect("/");
    })
    .all(rejectMethod);

router
    .route("/mmind")
    .get((req, res) => {
        if(!req.isAuthenticated()) res.redirect("/")
        else res.render("mmind");
    })
    .post((req, res) => { 
        let size = parseInt(req.body['size']);
        let dim = parseInt(req.body['dim'])
        let max = parseInt(req.body['max'])
       
        if(isNotNum(size) || isNotPositiveNum(size)) {
            size = default_size;
        }
        if(isNotNum(dim) || isNotPositiveNum(dim)) {
            dim = default_dim;
        }
        if(isNotNum(max) || isNegativeNum(dim)) {
            max = default_max
        }
        var mmindCode = generateRandomMmind(size, dim);
        req.session = { "id": uuid(),
                        "mmind": JSON.stringify(mmindCode),
                        "size": size,
                        "dim": dim,
                        "max": max,
                        "current": 0
                    };

        res.json({"size": size, 
                "dim": dim,
                "max": max,
                "temp": req.session["mmind"]
                });
    })
    .patch((req, res) => {
        let serverCode = JSON.parse(req.session["mmind"]);
        var clientCode = JSON.parse(req.body["clientCode"]);
    
        
        
        var result = getBlackPoints(clientCode, serverCode);
        var bp = result[0];
        var wp = getWhitePoints(result[1], result[2]);
        
        req.session["current"] = req.session["current"]+1;

        res.json({
            "wp": wp,
            "bp": bp,
            "size": req.session["size"],
            "current": req.session["current"],
            "max": req.session["max"]
        });
    });


//  „API” – oczwiście musi być serwowane przez HTTPS!

    function getBlackPoints(clientCode, serverCode) {
        var blackPoints = 0;
        for(var i = 0; i < clientCode.length; i++) {
            if(clientCode[i] == serverCode[i]) {
                blackPoints++;
                clientCode.splice(i,1);
                serverCode.splice(i,1);
                i = i - 1;
            }
        }
        return [blackPoints, clientCode, serverCode];
    }    
    
    function getWhitePoints(clientCode, serverCode) {
        var whitePoints = 0;
        for(var i = 0; i < clientCode.length; i++) {
            for(var j = 0; j < serverCode.length; j++) {
                if(clientCode[i] == serverCode[j]) {
                    whitePoints++;
                    clientCode.splice(i,1);
                    serverCode.splice(j,1);
                    j--;
                    i--;
                    break;
                }
            }
        }
        return whitePoints;
    }
    
    function isNotNum(num) {
        if(isNaN(num)) {
            return true;
        }
        return false;
    }
    
    function isNotPositiveNum(num) {
        if(num < 1) {
            return true;
        }
        return false;
    };
    
    function isNegativeNum(num) {
        if(num < 0) {
            return true;
        }
        return false;
    }
    
    function generateRandomMmind(size, dim) {
        var mmind =[];
        for(var i = 0; i < size; i++) {
            mmind.push(Math.floor(Math.random()*(dim+1)));
        }
        return mmind;
    }
    
    
    
module.exports = router;
    
