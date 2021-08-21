const otplib = require("otplib");
const secret = otplib.authenticator.generateSecret();
console.log("Generated secret: " + secret);
