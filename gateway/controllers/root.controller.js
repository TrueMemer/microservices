function handler(req, res) {
    return res.send("gateway working");
}

module.exports = [
    {
        method: ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS", "PATCH"],
        url: "/*",
        handler
    }
];