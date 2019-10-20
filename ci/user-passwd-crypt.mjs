import bcrypt from 'bcrypt'

const [password] = process.argv.slice(2);

if (password === undefined) {
  console.log(`Usage: node --experimental-modules user-passwd-crypt.mjs <password>`);
  process.exit(1);
}

console.log(bcrypt.hashSync(password, 10 + ~~(Math.random() * 8)));