import Pool from 'pg'
import fs from 'fs'
import logger from '../misc/logger'

const poolPromise = readDBConf()
  .then(data => { console.log(data); return data; })
  .then(data => new Pool(data))
  .catch(error => {
    console.log(error);
    logger.error(`Can't connect to database`, { error });
    process.exit(1);
  });

async function readDBConf() {
  return new Promise((res, rej) => {
    fs.readFile('sensitive/dbconf.json', 'utf8', (err, data) => {
      if (err) rej(err);
      res(data);
    });
  });
}

export default async function query(text, params) {
  return poolPromise
    .then(pool => pool.query(text, params));
}