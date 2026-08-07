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

module.exports = { createEmployee, listEmployees, findEmployeeById, updateEmployee };
