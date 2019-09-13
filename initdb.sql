CREATE TABLE IF NOT EXISTS public.device_access_tokens (
  device varchar,
  token varchar,
  expiration_time timestamp
);

CREATE TABLE IF NOT EXISTS public.user_access_tokens (
  user varchar,
  token varchar,
  expiration_time timestamp
);

CREATE TABLE IF NOT EXISTS public.users (
  name varchar,
  email varchar,
  password varchar
);

CREATE TABLE IF NOT EXISTS public.enterprises (
  name varchar,
  email varchar,
  password varchar
);