import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import jwt_decode from 'jwt-decode';
import pool from '../db/db.js';
import ApiError from '../exceptions/api-error.js';

class TokenService {
  constructor() {
    this.generateTokens = this.generateTokens.bind(this);
  }

  async generateTokens(payload) {
    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
      expiresIn: '5m',
    });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: '30d',
    });
    return {
      accessToken,
      refreshToken,
    };
  }

  async saveToken(userID, refreshToken) {
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

  validateAccessToken(token) {
    try {
      const userData = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      return userData;
    } catch (e) {
      return null;
    }
  }

  validateRefreshToken(token) {
    try {
      const userData = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      return userData;
    } catch (e) {
      return null;
    }
  }

  parsingToken(req) {
    try {
      return jwt_decode(req.headers.authorization.split(' ')[1]);
    } catch (e) {
      return null;
    }
  }

  verifyRefreshToken(req, res, next) {
    const refreshToken = req.cookies.mz_refreshToken;
    const decoded = this.validateRefreshToken(refreshToken);

    console.log({
      refresh: refreshToken,
      access: req.headers.authorization.split(' ')[1]
    })

    if (!refreshToken) return null;

    if (!decoded) return null;

    return decoded;
  }
}

export default new TokenService();
