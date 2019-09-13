import { Pool } from 'pg'
import fs from 'fs'
import logger from '../misc/logger'

const poolPromise = readDBConf()
  .then(data => new Pool(JSON.parse(data)))
  .catch(error => {
    logger.error(`Dabatase configuration can't be read`, { error });
    process.exit(1);
  });

async function readDBConf() {
  return new Promise((res, rej) => {
    fs.readFile('../sensitive/dbconf.json', 'utf8', (err, data) => {
      if (err) rej(err);
      res(data);
    });
  });
}

export async function query(text, params) {
  return poolPromise
    .then(pool => pool.query(text, params));
}