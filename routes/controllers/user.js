import UserService from './../../service/user-service.js';
import jwt_decode from 'jwt-decode';
import LogService from '../../service/log-service.js';
import TokenService from '../../service/token-service.js';

class UserController {
  constructor() {
    this.registration = this.registration.bind(this);
    this.authorization = this.authorization.bind(this);
    this.getUsers = this.getUsers.bind(this);
    this.updateUser = this.updateUser.bind(this);
    this.blockUser = this.blockUser.bind(this);
    this.unlockUser = this.unlockUser.bind(this);
  }

  async test1(req, res, next) {
    return res.json({ nah: 'go' });
  }

  async registration(req, res, next) {
    try {
      // User
      const user = TokenService.parsingToken(req);

      if (user.role !== 'admin')
        throw ApiError.Forbidden('Недостаточно прав доступа');

      const userData = await UserService.registration(req.body.user, next);

      // Add log
      LogService.users(
        `${user.login} --> добавил нового пользователя ${JSON.stringify(
          userData
        )}\n`
      );

      return res.json(userData);
    } catch (e) {
      next(e);
    }
  }

  async authorization(req, res, next) {
    try {
      const { login, password } = req.body;

      const userData = await UserService.authorization(login, password, next);

      if (userData) {
        // Add log
        LogService.users(`${login} --> успешная авторизация\n`);

        // Cookie
        res.cookie('mz_refreshToken', userData.refreshToken, {
          maxAge: 30 * 24 * 60 * 60 * 1000,
          httpOnly: true,
        });

        res.status(200).json({ data: userData.client });
      }
    } catch (e) {
      next(e);
    }
  }

  async getUsers(req, res, next) {
    try {
      const users = await UserService.getUsers(next);
      res.status(200).json({ data: users });
    } catch (e) {
      next(e);
    }
  }

  async updateUser(req, res, next) {
    try {
      // User
      const user = TokenService.parsingToken(req);

      const tempUser = req.body;
      const updateUser = await UserService.updateUser(tempUser, next);

      // Add log
      LogService.users(
        `${user.login} --> Обновил пользователя (id: ${
          tempUser.id
        }): ${JSON.stringify(tempUser)})\n`
      );

      res.status(200).json({ data: 'Пользователь обновлен' });
    } catch (e) {
      next(e);
    }
  }

  async blockUser(req, res, next) {
    try {
      // User
      const user = TokenService.parsingToken(req);

      const id = req.params.id;
      const blockUser = await UserService.blockUser(id, next);

      // Add log
      LogService.users(
        `${user.login} --> Заблокировал пользователя (id: ${id})\n`
      );

      res.status(200).json({ data: 'Пользователь заблокирован' });
    } catch (e) {
      next(e);
    }
  }

  async unlockUser(req, res, next) {
    try {
      // User
      const user = TokenService.parsingToken(req);

      const id = req.params.id;
      const unlockUser = await UserService.unlockUser(id, next);

      // Add log
      LogService.users(
        `${user.login} --> Разблокировал пользователя (id: ${id})\n`
      );

      res.status(200).json({ data: 'Пользователь разблокирован' });
    } catch (e) {
      next(e);
    }
  }
}

export default new UserController();
