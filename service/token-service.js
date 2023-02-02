import jwt from 'jsonwebtoken';
import pool from '../db/db.js';

class TokenService {
  constructor() {
    this.generateTokens = this.generateTokens.bind(this);
  }

  async generateTokens(payload) {
   const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {expiresIn: '120m'});
   const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {expiresIn: '30d'});
   return{
    accessToken,
    refreshToken
   }
  }

  async saveToken(userID, refreshToken){
    const query = `SELECT * FROM mz_users WHERE mz_user_refreshToken=${refreshToken}`;

    pool
      .execute(query)
      .then((result) => {
        console.log(result);
      })
      .catch(function (err) {
        console.log(err);
      });
  }

  validateAccessToken(token){
    try{
      const userData = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      console.log(`Валидация аксесс токена ${userData}`);
      return userData;
    } catch(e){
      return null;
    }
  }

  validateRefreshToken(token){
    try{
      const userData = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      console.log(`Валидация аксесс токена ${userData}`);
      return userData;
    } catch(e){
      return null;
    }
  }


}

export default new TokenService();
