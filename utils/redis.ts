const Redis = require('ioredis')
require('dotenv').config();


const redisClient = ()=>{
    if(process.env.REDIS_URL){
        console.log(`Redis conneted `);
        return process.env.REDIS_URL;
    }
    throw new Error('REDIS connected fail')
}

export const redis = new Redis(redisClient());