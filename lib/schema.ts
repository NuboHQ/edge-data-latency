import { mysqlTable, varchar, int } from 'drizzle-orm/mysql-core';

export const employees = mysqlTable('employees', {
  emp_no: int('emp_no').primaryKey().notNull(),
  first_name: varchar('first_name', { length: 255 }).notNull(),
  last_name: varchar('last_name', { length: 255 }).notNull(),
});
