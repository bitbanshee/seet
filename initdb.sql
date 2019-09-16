-- CREATE DATABASE seet;

CREATE SCHEMA device
  CREATE TABLE devices (
    id varchar,
    name varchar,
    sim_number varchar,
    imei varchar,
    active boolean
  )
  CREATE TABLE access_tokens (
    device varchar,
    token varchar,
    expiration_time timestamp
  )
  CREATE TABLE history (
    device varchar,
    coordinates point,
    altitude_cm int,
    precision int,
    age int,
    speed int,
    sent_time timestamp,
    received_time timestamp
  );

CREATE TABLE public.access_tokens (
  user_ref varchar,
  token varchar,
  expiration_time timestamp
);

CREATE TABLE public.users (
  name varchar,
  email varchar,
  password varchar
);

CREATE TABLE public.enterprises (
  name varchar,
  email varchar,
  password varchar
);

CREATE TABLE public.products (
  name varchar,
  enterprise varchar,
  user_ref varchar,
  device varchar
);