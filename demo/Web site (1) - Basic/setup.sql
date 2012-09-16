-- Make sure you run this script in the demodb database, with the user 'public'!

DROP TABLE IF EXISTS employees;

CREATE TABLE employees(
  id INT NOT NULL AUTO_INCREMENT,
  f_name VARCHAR(40) NOT NULL DEFAULT 'unknown',
  salary INT NOT NULL DEFAULT 100000,
  PRIMARY KEY (id)
);

INSERT INTO employees(f_name, salary) VALUES ('John Tank', 50000), ('Raja Singh', 15000), ('Joe Smith', 10000);

