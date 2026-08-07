const pdf = require('pdf-parse');

async function extractEmployeeProfile(filePath) {
  let text = '';
  try {
    const data = await pdf(filePath);
    text = data.text;
  } catch {
    text = '';
  }

  const email = /([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i.exec(text)?.[1] || 'unknown@example.com';
  const name = /^\s*name\s*[:\s-]\s*([a-zA-Z][a-zA-Z ]*)$/im.exec(text)?.[1]?.trim() || 'New Employee';
  const role = /^\s*role\s*[:\s-]\s*([a-zA-Z][a-zA-Z ]*)$/im.exec(text)?.[1]?.trim() || 'Software Engineer';
  const department = /^\s*department\s*[:\s-]\s*([a-zA-Z][a-zA-Z ]*)$/im.exec(text)?.[1]?.trim() || 'Engineering';
  const location = /^\s*location\s*[:\s-]\s*([a-zA-Z][a-zA-Z ]*)$/im.exec(text)?.[1]?.trim() || 'US';
  const clearance = /^\s*clearance\s*[:\s-]\s*([a-zA-Z][a-zA-Z ]*)$/im.exec(text)?.[1]?.trim() || 'Confidential';
  const joiningDate = /^\s*joining\s*date\s*[:\s-]\s*(\d{4}-\d{2}-\d{2})$/im.exec(text)?.[1] || new Date().toISOString().slice(0, 10);

  return {
    name,
    email,
    role,
    department,
    location,
    clearance,
    joiningDate
  };
}

module.exports = { extractEmployeeProfile };
