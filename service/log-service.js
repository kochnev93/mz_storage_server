import fs from 'fs';

class LogService {
  constructor() {
    this.products = this.products.bind(this);
  }

  getLogStr(str) {
    return `${new Date().toLocaleString()} --> ${str}`;
  }

  users(str) {
    try {
      fs.appendFile('./logs/usersLogs.txt', `${this.getLogStr(str)}`, (err) => {
        if (err) throw err;
      });
    } catch (e) {
      return null;
    }
  }

  products(str) {
    try {
      fs.appendFile('./productsLogs.txt', `${this.getLogStr(str)}`, (err) => {
        if (err) throw err;
      });
    } catch (e) {
      return null;
    }
  }
}

export default new LogService();
