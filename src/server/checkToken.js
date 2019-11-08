import { JWT } from "jose"

const checkToken = (req, res, next) => {
    if(!req.get('authorization')) {
        console.warn("Call to API without credentials.");
        res.status(403).json({ error: 'No credentials sent!' });
    } else {
        const auth = req.get('authorization');
        const jwt = auth.substr(7)
        const token = JWT.decode(jwt);
        if(token.exp && token.exp < Date.now() / 1000) {
            console.warn("Call to API with expired token credentials.", JSON.stringify(token));
            res.status(403).json({ error: 'Expired token!' });
        }
        else {
            console.log("API Request with token", JSON.stringify(token));
            next();
        }
    }

};

export default checkToken;
