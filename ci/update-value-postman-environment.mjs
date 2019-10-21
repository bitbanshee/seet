import fs from 'fs'

const [
  postman_environment_file_path,
  key,
  value
] = process.argv.slice(2);

if (postman_environment_file_path === undefined
    || key === undefined
    || value === undefined) {
  console.log(`Usage: node --experimental-modules update-value-postman-environment.mjs <postman_environment_file_path> <key> <value>`);
  process.exit(1);
}

console.log(`Updating value of '${key}' to '${value}' in Postman environment file descriptor located at ${postman_environment_file_path}.`);

const postman_environment = JSON.parse(fs.readFileSync(postman_environment_file_path));
postman_environment
  .values
  .find(value => value.key === key)
  .value = value;
fs.writeFileSync(postman_environment_file_path, JSON.stringify(postman_environment, null, 2));

console.log(`File was overwritten.`);