const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'users.json');

// Load users from file, or start empty
const loadUsers = () => {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading users file:', e.message);
  }
  return [];
};

const saveUsers = (users) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing users file:', e.message);
  }
};

exports.register = (req, res) => {
  const { name, email, password, profilePicture } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const users = loadUsers();

  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists with this email' });
  }

  // In production, ALWAYS hash passwords. This is a prototype.
  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    password,
    profilePicture: profilePicture || null
  };
  users.push(newUser);
  saveUsers(users);

  res.status(201).json({
    message: 'User registered successfully',
    user: { id: newUser.id, name: newUser.name, email: newUser.email, profilePicture: newUser.profilePicture }
  });
};

exports.login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const users = loadUsers();
  const user = users.find(u => u.email === email);

  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  res.status(200).json({
    message: 'Login successful',
    user: { id: user.id, name: user.name, email: user.email, profilePicture: user.profilePicture }
  });
};
