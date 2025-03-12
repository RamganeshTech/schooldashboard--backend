const jwt = require('jsonwebtoken');


const verifyTokenMiddleware = async (req, res, next) => {
    try {

        if (!req.cookies || !req.cookies.accessToken) {
            return res.status(401).json({ message: "Access denied. No token provided please loign again.", ok: false });
        }

        let isAdminAccessTokenExist = req.cookies.accessToken

        if(!isAdminAccessTokenExist){
            throw new Error("please login")
        }

        const decoded = jwt.verify(isAdminAccessTokenExist, process.env.JWT_SECRET);

        if (decoded.role !== "admin") {
            return res.status(403).json({ message: "Access denied. Admins only.", ok: false });
        }


        req.admin = decoded; // Attach admin data to request
        next();
    }
    catch (err) {
        console.log(err.message)
        res.status(401).json({ error: "No token provided", message: err.message, ok: false });
    }

}

const verifyAccountantMiddleware = async (req, res, next)=>{
 try{
    if (!req.cookies || !req.cookies.accountantaccessToken) {
        return res.status(401).json({ message: "Access denied. No token provided please loign again.", ok: false });
    }

    let isAccountantAccessTokenExist = req.cookies.accountantaccessToken

    if(!isAccountantAccessTokenExist){
        throw new Error("please login")
    }

    // Verify the access token
    const decoded = jwt.verify(isAccountantAccessTokenExist, process.env.JWT_SECRET);

    if (decoded.role !== "accountant") {
        return res.status(403).json({ message: "Access denied. Admins only.", ok: false });
    }

    req.accountant = decoded; // Attach admin data to request
    next();
}
catch (err) {
    console.log(err.message)
    res.status(401).json({ error: "No token provided", message: err.message, ok: false });
}   
}

module.exports = {
    verifyTokenMiddleware,
    verifyAccountantMiddleware
}