import fs from 'fs'
import logger from './logger'

try {
  export const apiconf = JSON.parse(fs.readFileSync('../sensitive/apiconf.json', 'utf8'));
} catch (e) {
  logger.error(`Can't read api configuration file`, { error: e });
  process.exit(1);
}
