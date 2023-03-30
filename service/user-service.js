import bcrypt from 'bcrypt';
import pool from '../db/db.js';
import ApiError from '../exceptions/api-error.js';
import tokenService from './token-service.js';

class UserService {
  constructor() {
    this.registration = this.registration.bind(this);
    this.authorization = this.authorization.bind(this);
    this.getUsers = this.getUsers.bind(this);
    this.updateUser = this.updateUser.bind(this);
    this.blockUser = this.blockUser.bind(this);
    this.unlockUser = this.unlockUser.bind(this);
  }

  async registration(user, next) {
    const { name, surname, email, login, phone, role, position, pass } = user;
    const hashPassword = await bcrypt.hash(pass, 3);

    const query = `
    INSERT INTO mz_users 
    (mz_user_login, mz_user_name, mz_user_surname, mz_user_phone, mz_user_email, mz_user_id_role, mz_user_position, mz_user_password )
    VALUES ('${login}', '${name}', '${surname}', '${phone}', '${email}', '${role[0].id}', '${position}', '${hashPassword}')`;

    const newUser = await pool
      .execute(query)
      .then((result) => {
        const getUser = `SELECT * FROM mz_users WHERE mz_user_login='${login}'`;
        return pool.execute(getUser);
      })
      .then((result) => {
        return result[0][0];
      })
      .catch(function (err) {
        throw ApiError.BadRequest(`Пользователь не добавлен`);
      })
      .catch(function (err) {
        next(err);
      });

    return { data: 'Пользователь добавлен', user: newUser };
  }

  async authorization(login, password, next) {
    const query = `SELECT 
    id,
    mz_user_login,
    mz_user_name,
    mz_user_surname,
    mz_user_phone,
    mz_user_email,
    (SELECT role FROM mz_user_roles WHERE id_role=mz_users.mz_user_id_role) AS mz_user_role,
    mz_user_position,
    mz_user_password,
    mz_user_img,
    mz_user_isBlocked,
    mz_user_sa,
    date_create,
    author,
    mz_user_last_activity 
    FROM mz_users 
    WHERE mz_user_login='${login}'`;

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

        if (result.mz_user_isBlocked) {
          throw ApiError.BadRequest('Пользователь заблокирован');
        }

        return result;
      })
      .catch(function (err) {
        next(err);
      });

    const queryLastActivity = `UPDATE mz_users SET mz_user_last_activity = ( SELECT NOW() ) WHERE mz_user_login='${login}'`;

    if (user) {
      const tokens = await tokenService.generateTokens({
        id: user.id,
        login: user.mz_user_login,
        role: user.mz_user_role,
      });

      pool.execute(queryLastActivity);

      return {
        client: {
          id: user.id,
          name: user.mz_user_name,
          surname: user.mz_user_surname,
          phone: user.mz_user_phone,
          email: user.mz_user_email,
          login: user.mz_user_login,
          role: user.mz_user_role,
          position: user.mz_user_position,
          img: user.mz_user_img,
          accessToken: tokens.accessToken,
        },
        refreshToken: tokens.refreshToken,
      };
    } else return null;
  }

  async getUsers(next) {
    const query = `
    SELECT 
      id, 
      mz_user_login AS login, 
      mz_user_name AS name, 
      mz_user_surname AS surname, 
      mz_user_phone AS phone, 
      mz_user_email AS email, 
      (SELECT role FROM mz_user_roles WHERE id_role=mz_u.mz_user_id_role) AS role,
      mz_user_position AS position,
      mz_user_img AS img, 
      mz_user_isblocked AS isBlocked,
      mz_user_last_activity AS last_activity,
      date_create,
      author
    FROM mz_users mz_u
    `;

    const users = await pool
      .execute(query)
      .then((data) => {
        const result = data[0];
        return result;
      })
      .catch(function (err) {
        next(err);
      });

    return users;
  }

  async updateUser(user, next) {
    const updateQuery = `
      UPDATE mz_users 
      SET 
      mz_user_login='${user.login}', 
      mz_user_name='${user.name}', 
      mz_user_surname='${user.surname}', 
      mz_user_phone='${user.phone}', 
      mz_user_email='${user.email}', 
      mz_user_id_role=(SELECT id_role FROM mz_user_roles WHERE role='${user.role}'),
      mz_user_position='${user.position}'
      WHERE id='${user.id}'
    `;

    const update = await pool
      .execute(updateQuery)
      .then((data) => {
        const result = data[0];

        if (result.changedRows === 0) {
          throw ApiError.BadRequest(`Пользователь с данным id не найден`);
        }

        return result;
      })
      .catch(function (err) {
        next(err);
      });

    return update;
  }

  async blockUser(id, next) {
    const blockQuery = `
      UPDATE mz_users 
      SET mz_user_isBlocked='1'
      WHERE id='${id}'
    `;

    const update = await pool
      .execute(blockQuery)
      .then((data) => {
        const result = data[0];

        if (result.changedRows === 0) {
          throw ApiError.BadRequest(`Пользователь с данным id не найден`);
        }

        return result;
      })
      .catch(function (err) {
        next(err);
      });

    return update;
  }

  async unlockUser(id, next) {
    const unlockQuery = `
      UPDATE mz_users 
      SET mz_user_isBlocked='0' 
      WHERE id='${id}'
    `;

    const update = await pool
      .execute(unlockQuery)
      .then((data) => {
        const result = data[0];

        if (result.changedRows === 0) {
          throw ApiError.BadRequest(`Пользователь с данным id не найден`);
        }

        return result;
      })
      .catch(function (err) {
        next(err);
      });

    return update;
  }

  async refreshToken(user, next) {
    const check = await pool
      .execute(`SELECT mz_user_isBlocked FROM mz_users WHERE id='${user.id}'`)
      .then((data) => {
        const result = data[0][0];
        return result.mz_user_isBlocked ? false : true;
      })
      .catch(function (err) {
        next(err);
      });

    if (!check) throw ApiError.Unauthorized('Пользователь заблокирован');

    const tokens = await tokenService.generateTokens({
      id: user.id,
      login: user.login,
      role: user.role,
    });

    await pool.execute(
      `UPDATE mz_users SET mz_user_last_activity = ( SELECT NOW() ) WHERE id='${user.id}'`
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    }
  }

}

export default new UserService();
