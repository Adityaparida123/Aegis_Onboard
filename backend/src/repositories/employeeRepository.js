const mongoose = require('mongoose');
const Employee = require('../models/Employee');

const memoryEmployees = [];

async function createEmployee(payload) {
  if (mongoose.connection.readyState === 1) {
    return Employee.create(payload);
  }

  const employee = {
    _id: `${Date.now()}-${memoryEmployees.length + 1}`,
    ...payload,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  memoryEmployees.push(employee);
  return employee;
}

async function listEmployees() {
  if (mongoose.connection.readyState === 1) {
    return Employee.find({}).lean();
  }

  return memoryEmployees;
}

async function findEmployeeById(id) {
  if (mongoose.connection.readyState === 1) {
    return Employee.findById(id).lean();
  }

  return memoryEmployees.find((employee) => employee._id.toString() === id.toString()) || null;
}

async function findEmployeeByEmail(email) {
  if (mongoose.connection.readyState === 1) {
    return Employee.findOne({ email: String(email).trim().toLowerCase() }).lean();
  }

  return memoryEmployees.find((employee) => String(employee.email).trim().toLowerCase() === String(email).trim().toLowerCase()) || null;
}

async function findEmployeeByUserId(userId) {
  if (mongoose.connection.readyState === 1) {
    return Employee.findOne({ userId }).lean();
  }

  return memoryEmployees.find((employee) => employee.userId && employee.userId.toString() === String(userId)) || null;
}

async function linkEmployeeToUser(employeeId, userId) {
  if (mongoose.connection.readyState === 1) {
    await Employee.updateOne({ _id: employeeId, userId: { $exists: false } }, { $set: { userId } });
    await Employee.updateOne({ _id: employeeId, userId: null }, { $set: { userId } });
    return Employee.findById(employeeId).lean();
  }

  const employee = memoryEmployees.find((entry) => entry._id.toString() === String(employeeId));
  if (employee && !employee.userId) {
    employee.userId = String(userId);
  }
  return employee;
}

async function updateEmployee(id, payload) {
  if (mongoose.connection.readyState === 1) {
    return Employee.findByIdAndUpdate(id, payload, { new: true }).lean();
  }

  const employee = memoryEmployees.find((entry) => entry._id.toString() === id.toString());
  if (!employee) {
    return null;
  }

  Object.assign(employee, payload, { updatedAt: new Date() });
  return employee;
}

module.exports = { createEmployee, listEmployees, findEmployeeById, findEmployeeByEmail, findEmployeeByUserId, linkEmployeeToUser, updateEmployee };
