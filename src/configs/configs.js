require('dotenv').config()

module.exports = {
    TOKEN: process.env.TOKEN,
    MONGODB_URL: process.env.MONGODBURL,
    BRAWL_STARS_API_KEY: process.env.BRAWL_STARS_API_KEY,
    IMGBB_API_KEY: process.env.IMGBB_API_KEY
}