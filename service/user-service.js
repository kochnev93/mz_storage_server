import bcrypt from 'bcrypt';
import pool from '../db/db.js';
import ApiError from '../exceptions/api-error.js';
import tokenService from './token-service.js';

class UserService {
  constructor() {
    this.registration = this.registration.bind(this);
  }

  async registration(login, password) {
    const hashPassword = await bcrypt.hash(password, 3);
    const tokens = await tokenService.generateTokens({
      login: login,
      pass: password,
    });

    return { ...tokens, login: login, password: hashPassword };
  }

  async authorization(login, password, next) {
    const query = `SELECT * FROM mz_users WHERE mz_user_login='${login}'`;

    const user = await pool
      .execute(query)
      .then((data) => {
        const result = data[0][0];

        if (!result) {
          throw ApiError.BadRequest(
            `Пользователь с логином ${login} не найден`
          );
        }

        const isPassValid = bcrypt.compareSync(
          password,
          result.mz_user_password
        );
        if (!isPassValid) {
          throw ApiError.BadRequest('Неверный логин или пароль');
        }

        return result;
      })
      .catch(function (err) {
        next(err);
      });

    if (user) {
      const tokens = await tokenService.generateTokens({
        id: user.id,
        login: user.mz_user_login,
        role: user.mz_user_role,
      });

      return {
        client: {
          id: user.id,
          login: user.mz_user_login,
          role: user.mz_user_role,
          accessToken: tokens.accessToken,
        },
        refreshToken: tokens.refreshToken,
      };
    }
  }
}

export default new UserService();
